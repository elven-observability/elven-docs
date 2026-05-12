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
  const opts = { input: null, out: null, theme: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--out" || a === "-o") {
      opts.out = args[++i];
    } else if (a === "--theme" || a === "-t") {
      opts.theme = args[++i];
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
Uso: render-pdf.js <input.md> [--out <output.pdf>] [--theme <client|internal>]

Opções:
  --out, -o     Caminho do PDF de saída. Default: <input>.pdf
  --theme, -t   client | internal. Default: 'client' se type=ps-*, senão 'internal'.
  --help, -h    Imprime esta ajuda.

Exemplos:
  render-pdf.js relatorio-incidente.md
  render-pdf.js docs/instrumentacao-java.md --theme internal
  render-pdf.js report.md --out /tmp/report.pdf --theme client
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

async function renderPDF({ input, out, theme }) {
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

  const cover = buildCoverHtml(fields, themeName);

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(fields.title || path.basename(inputAbs))}</title>
  <style>${css}</style>
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
