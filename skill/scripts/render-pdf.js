#!/usr/bin/env node
/**
 * render-pdf.js — markdown → HTML temado → PDF via Puppeteer.
 *
 * Uso (direto):
 *   node skill/scripts/render-pdf.js <input.md> [--out <output.pdf>] [--theme <client|internal>]
 *
 * Uso (via CLI):
 *   elven-docs-skill pdf <input.md> [--out <out.pdf>] [--theme <client|internal>]
 *
 * Comportamento:
 *   - Lê <input.md>, separa frontmatter YAML do conteúdo.
 *   - Converte markdown → HTML com `marked`.
 *   - Aplica classes semânticas em <blockquote> baseado no prefixo bold tipado
 *     (Atenção, Importante, Nota, Dica, Cuidado, Aviso).
 *   - Injeta CSS do tema escolhido (default: --theme client se type=ps-*, senão internal).
 *   - Para PS reports, injeta página de capa com título, cliente, data, severidade.
 *   - Renderiza com Puppeteer headless e gera PDF A4.
 *
 * Exit:
 *   0  PDF gerado com sucesso
 *   1  erro fatal (input ausente, render falhou)
 *   2  uso incorreto
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

let marked, puppeteer;
try {
  marked = require("marked").marked;
  puppeteer = require("puppeteer");
} catch (e) {
  console.error(
    "Dependências ausentes. Rode `npm install` no diretório do skill antes de usar `pdf`."
  );
  console.error("Detalhe:", e.message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { input: null, out: null, theme: null, mermaid: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--out" || a === "-o") {
      opts.out = args[++i];
    } else if (a === "--theme" || a === "-t") {
      opts.theme = args[++i];
    } else if (a === "--mermaid" || a === "-m") {
      opts.mermaid = args[++i];
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else if (!a.startsWith("--")) {
      if (!opts.input) opts.input = a;
    }
  }
  return opts;
}

function printHelp() {
  process.stdout.write(`
Uso: render-pdf.js <input.md> [--out <output.pdf>] [--theme <client|internal>] [--mermaid <cdn|bundle>]

Opções:
  --out, -o       Caminho do PDF de saída. Default: <input>.pdf
  --theme, -t     client | internal. Default: 'client' se type=ps-*, senão 'internal'.
  --mermaid, -m   cdn (default) | bundle. 'bundle' usa mermaid local (~3MB) — funciona offline.
                  ENV: ELVEN_MERMAID_MODE=bundle aplica como default.
  --help, -h      Imprime esta ajuda.

Exemplos:
  render-pdf.js relatorio-incidente.md
  render-pdf.js docs/instrumentacao-java.md --theme internal
  render-pdf.js report.md --out /tmp/report.pdf --theme client
  render-pdf.js report.md --mermaid bundle           # offline-safe
`);
}

function extractFrontmatter(raw) {
  const fm = { fields: {}, body: raw };
  if (!raw.startsWith("---")) return fm;
  const lines = raw.split("\n");
  if (lines[0].trim() !== "---") return fm;
  let endIdx = -1;
  for (let i = 1; i < lines.length && i < 60; i++) {
    if (lines[i].trim() === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return fm;
  for (let i = 1; i < endIdx; i++) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    // remove quotes simples ou duplas externas
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fm.fields[m[1]] = value;
  }
  fm.body = lines.slice(endIdx + 1).join("\n");
  return fm;
}

function inferTheme(fields) {
  const type = fields.type || "";
  if (type.startsWith("ps-")) return "client";
  return "internal";
}

function loadTheme(themeName, skillDir) {
  const p = path.join(skillDir, "themes", `${themeName}.css`);
  if (!fs.existsSync(p)) {
    throw new Error(`Theme não encontrado: ${p}`);
  }
  return fs.readFileSync(p, "utf8");
}

function addCalloutClasses(html) {
  // Adiciona class="callout-X" em <blockquote> baseado no prefixo bold.
  return html.replace(
    /<blockquote>\s*<p>\s*<strong>(Atenção|Importante|Nota|Dica|Cuidado|Aviso):<\/strong>/g,
    (match, label) => {
      const cls = "callout-" + label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return `<blockquote class="${cls}"><p><strong>${label}:</strong>`;
    }
  );
}

function decodeHtmlEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function transformMermaidBlocks(html) {
  // Após marked.parse(), blocos ```mermaid ... ``` viram:
  //   <pre><code class="language-mermaid">...</code></pre>
  // Para o mermaid.js renderizar, precisamos:
  //   <pre class="mermaid">DIAGRAMA EM TEXTO PURO</pre>
  // Retorna {html, hasMermaid}.
  let hasMermaid = false;
  const transformed = html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (match, content) => {
      hasMermaid = true;
      const decoded = decodeHtmlEntities(content);
      return `<pre class="mermaid">${decoded}</pre>`;
    }
  );
  return { html: transformed, hasMermaid };
}

function resolveLocalImages(html, inputAbs) {
  // Converte <img src="path-relativo"> em <img src="data:image/...;base64,...">
  // - Pula URLs absolutas (http://, https://, file://, data:).
  // - Resolve path relativo ao diretório do .md.
  // - Suporta extensões comuns: png, jpg, jpeg, gif, svg, webp.
  // - Em caso de erro (arquivo ausente), mantém src original e loga warning.
  const inputDir = path.dirname(inputAbs);
  const warnings = [];

  const transformed = html.replace(
    /<img\s+([^>]*?)src="([^"]+)"([^>]*)>/g,
    (match, before, src, after) => {
      if (/^(https?:|file:|data:|\/\/)/i.test(src)) {
        return match; // já é absoluta
      }
      const filePath = path.isAbsolute(src)
        ? src
        : path.resolve(inputDir, src);
      if (!fs.existsSync(filePath)) {
        warnings.push(`imagem não encontrada: ${src} (resolvido em ${filePath})`);
        return match;
      }
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mimeMap = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        webp: "image/webp",
      };
      const mime = mimeMap[ext];
      if (!mime) {
        warnings.push(`extensão de imagem não suportada: .${ext} (${src})`);
        return match;
      }
      try {
        const data = fs.readFileSync(filePath);
        const base64 =
          ext === "svg" ? encodeURIComponent(data.toString("utf8")) : data.toString("base64");
        const dataUri =
          ext === "svg"
            ? `data:image/svg+xml,${base64}`
            : `data:${mime};base64,${base64}`;
        return `<img ${before}src="${dataUri}"${after}>`;
      } catch (e) {
        warnings.push(`erro lendo ${filePath}: ${e.message}`);
        return match;
      }
    }
  );

  return { html: transformed, warnings };
}

function buildCoverHtml(fields, themeName) {
  if (themeName !== "client") return "";
  const title = fields.title || "(sem título)";
  const client = fields.client || "—";
  const reportDate =
    fields.incident_date || fields.test_date || fields.spike_date ||
    fields.report_date || fields.last_reviewed || "—";
  const severity = fields.severity || fields.severity_estimated || "";
  const owner = fields.owner || "Elven Works";

  const sevLine = severity ? `<div><strong>Severidade:</strong> ${escapeHtml(severity)}</div>` : "";

  return `
    <div class="elven-cover">
      <div class="brand">Elven Works · Professional Services</div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="meta">
        <div><strong>Cliente:</strong> ${escapeHtml(client)}</div>
        <div><strong>Data:</strong> ${escapeHtml(reportDate)}</div>
        ${sevLine}
        <div><strong>Owner:</strong> ${escapeHtml(owner)}</div>
        <div><strong>Documento:</strong> ${escapeHtml(fields.slug || "")}</div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildFooterTemplate(fields) {
  const client = fields.client ? escapeHtml(fields.client) : "Elven Works";
  return `
    <div style="font-size: 8pt; color: #6a7385; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between;">
      <span>Elven Works · Confidencial — ${client}</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `;
}

function buildHeaderTemplate(fields) {
  const title = fields.title ? escapeHtml(fields.title) : "Elven Works";
  return `
    <div style="font-size: 8pt; color: #6a7385; width: 100%; padding: 0 18mm;">
      <span>${title}</span>
    </div>
  `;
}

function resolveMermaidMode(flag) {
  const mode = flag || process.env.ELVEN_MERMAID_MODE || "cdn";
  if (!["cdn", "bundle"].includes(mode)) {
    throw new Error(`Mermaid mode inválido: '${mode}' (use 'cdn' ou 'bundle').`);
  }
  return mode;
}

function loadMermaidBundle() {
  // Procura mermaid em ./node_modules/mermaid/dist/mermaid.min.js relativo ao package root
  // ou via require.resolve.
  try {
    const pkgPath = require.resolve("mermaid/package.json");
    const distDir = path.join(path.dirname(pkgPath), "dist");
    // Tenta vários nomes (mermaid muda o asset entre versões).
    const candidates = [
      "mermaid.min.js",
      "mermaid.js",
    ];
    for (const name of candidates) {
      const p = path.join(distDir, name);
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, "utf8");
      }
    }
    throw new Error("mermaid.min.js não encontrado em " + distDir);
  } catch (e) {
    throw new Error(
      `Não consegui carregar mermaid local: ${e.message}. ` +
      `Rode 'npm install' no diretório do skill, ou use '--mermaid cdn'.`
    );
  }
}

async function renderPDF({ input, out, theme, mermaid: mermaidMode }) {
  if (!input) {
    console.error("Erro: arquivo de input obrigatório.");
    printHelp();
    process.exit(2);
  }

  const inputAbs = path.resolve(input);
  if (!fs.existsSync(inputAbs)) {
    console.error(`Erro: arquivo não encontrado: ${inputAbs}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputAbs, "utf8");
  const { fields, body } = extractFrontmatter(raw);

  const themeName = theme || inferTheme(fields);
  if (!["client", "internal"].includes(themeName)) {
    console.error(`Erro: theme inválido '${themeName}' (use client ou internal).`);
    process.exit(2);
  }

  const mode = resolveMermaidMode(mermaidMode);

  const skillDir = path.resolve(__dirname, "..");
  const css = loadTheme(themeName, skillDir);

  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
  });
  let html = marked.parse(body);
  html = addCalloutClasses(html);

  // Transformação: Mermaid blocks → <pre class="mermaid">
  const mermaidResult = transformMermaidBlocks(html);
  html = mermaidResult.html;
  const hasMermaid = mermaidResult.hasMermaid;

  // Transformação: imagens locais → data URI
  const imgResult = resolveLocalImages(html, inputAbs);
  html = imgResult.html;
  for (const warn of imgResult.warnings) {
    process.stderr.write(`  ! warning: ${warn}\n`);
  }

  const cover = buildCoverHtml(fields, themeName);

  // Mermaid script — CDN (default, leve) OU bundle local (~3MB, offline-safe).
  let mermaidScript = "";
  if (hasMermaid) {
    const initScript = `
    <script>
      window.__mermaidReady__ = false;
      function __initMermaid__() {
        if (typeof mermaid === "undefined") {
          // Aguarda mermaid carregar; tenta de novo em 100ms.
          setTimeout(__initMermaid__, 100);
          return;
        }
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          themeVariables: {
            primaryColor: "#0d1530",
            primaryTextColor: "#0d1530",
            primaryBorderColor: "#c95b29",
            lineColor: "#34405c",
            secondaryColor: "#fdf5ef",
            tertiaryColor: "#f8f9fb"
          },
          flowchart: { htmlLabels: true, curve: "basis" },
          securityLevel: "loose"
        });
        mermaid.run().then(function() {
          window.__mermaidReady__ = true;
        }).catch(function(err) {
          console.error("mermaid render error:", err);
          window.__mermaidReady__ = true; // libera o waitFor pra não pendurar PDF
        });
      }
      __initMermaid__();
    </script>`;

    if (mode === "bundle") {
      const bundle = loadMermaidBundle();
      // Inline bundle direto no HTML. Tag <script> antes do init.
      mermaidScript = `\n  <script>${bundle}</script>${initScript}`;
    } else {
      // CDN: tag <script> assíncrona; o init aguarda mermaid existir.
      mermaidScript = `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>${initScript}`;
    }
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(fields.title || path.basename(inputAbs))}</title>
  <style>${css}</style>${mermaidScript}
</head>
<body>
  ${cover}
  ${html}
</body>
</html>`;

  const outAbs = out
    ? path.resolve(out)
    : inputAbs.replace(/\.md$/i, ".pdf");

  process.stdout.write(`Renderizando ${path.basename(inputAbs)} → ${path.basename(outAbs)} (theme=${themeName})...\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    if (hasMermaid) {
      // Espera o Mermaid renderizar os diagramas (timeout 15s pra rodadas mais lentas).
      try {
        await page.waitForFunction(() => window.__mermaidReady__ === true, {
          timeout: 15000,
        });
      } catch (e) {
        process.stderr.write(
          `  ! warning: Mermaid não terminou em 15s. PDF segue, diagramas podem estar incompletos.\n`
        );
      }
    }

    await page.pdf({
      path: outAbs,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: themeName === "client",
      headerTemplate: buildHeaderTemplate(fields),
      footerTemplate: buildFooterTemplate(fields),
      margin: {
        top: themeName === "client" ? "25mm" : "20mm",
        right: "18mm",
        bottom: "22mm",
        left: "18mm",
      },
    });
  } finally {
    await browser.close();
  }

  const stats = fs.statSync(outAbs);
  process.stdout.write(`PDF gerado: ${outAbs} (${(stats.size / 1024).toFixed(1)} KB)\n`);
}

async function main() {
  const opts = parseArgs(process.argv);
  try {
    await renderPDF(opts);
  } catch (e) {
    console.error("Erro no render-pdf:", e.message);
    if (process.env.DEBUG) console.error(e.stack);
    process.exit(1);
  }
}

main();
