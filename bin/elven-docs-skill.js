#!/usr/bin/env node
/**
 * elven-docs-skill — CLI
 *
 * Subcomandos:
 *   install [--force]            Copia skill/* para ~/.claude/skills/elven-docs-skill/
 *   update                       Idem install, com prompt antes de sobrescrever
 *   lint <arquivo>               Roda skill/scripts/lint.sh contra um arquivo
 *   check <arquivo>              Roda cross-section-check.sh — report de claims numéricas
 *   backfill <arquivo..>         Roda skill/scripts/backfill-frontmatter.sh
 *   pdf <arquivo.md> [opts]      Renderiza markdown → PDF temado via Puppeteer
 *                                opts: --out <file.pdf>, --theme <client|internal>,
 *                                      --mermaid <cdn|bundle>
 *   --version, -v                Imprime versão do package
 *   --help, -h                   Imprime esta ajuda
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const PACKAGE_JSON = require(path.join(PACKAGE_ROOT, "package.json"));
const SKILL_SOURCE = path.join(PACKAGE_ROOT, "skill");
const SKILL_DEST = path.join(os.homedir(), ".claude", "skills", "elven-docs-skill");

const args = process.argv.slice(2);
const cmd = args[0];

function log(msg) {
  process.stdout.write(`${msg}\n`);
}
function err(msg) {
  process.stderr.write(`${msg}\n`);
}

function printHelp() {
  log(`@elven-observability/docs-skill v${PACKAGE_JSON.version}

Uso:
  elven-docs-skill install [--force]
      Copia skill/* para ~/.claude/skills/elven-docs-skill/.
      Use --force para sobrescrever sem prompt.

  elven-docs-skill update
      Equivalente a install --force; mantido por afinidade semântica.

  elven-docs-skill lint <arquivo.md> [<arquivo.md>...]
      Roda skill/scripts/lint.sh contra os arquivos passados.
      Exit 0 = todos passam; exit 1 = pelo menos 1 falha.

  elven-docs-skill check <arquivo.md> [<arquivo.md>...]
      Roda cross-section-check.sh — report de claims numéricas que aparecem
      em múltiplas seções (MTTD/MTTR, VUs, throughput, error rate, etc.).
      Sempre exit 0; é report, não gate. Ajuda quality-gate 6.3
      ("numbers must match across sections").

  elven-docs-skill backfill <arquivo.md> [<arquivo.md>...]
      Roda skill/scripts/backfill-frontmatter.sh — adiciona frontmatter
      derivado a docs legados. Edita os arquivos in-place.

  elven-docs-skill pdf <arquivo.md> [--out <out.pdf>] [--theme <client|internal>] [--mermaid <cdn|bundle>]
      Renderiza markdown → HTML temado Elven → PDF via Puppeteer.
      Theme default é 'client' quando type=ps-*, senão 'internal'.
      Saída default é <arquivo>.pdf ao lado do .md.
      --mermaid bundle usa mermaid local (~3MB, offline-safe); default é cdn.
      ENV: ELVEN_MERMAID_MODE=bundle aplica como default global.

  elven-docs-skill --version, -v
      Imprime ${PACKAGE_JSON.version}.

  elven-docs-skill --help, -h
      Imprime esta ajuda.

Documentação completa: https://github.com/elven-observability/elven-docs
`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
    if ((stat.mode & 0o111) !== 0) {
      fs.chmodSync(dest, stat.mode);
    }
  }
}

function promptYesNo(question) {
  // Sem readline interativo síncrono em Node moderno sem pacote externo.
  // Usamos read síncrono via /dev/tty quando possível.
  if (!process.stdin.isTTY) {
    err("Sem TTY interativo. Use --force para sobrescrever sem prompt.");
    return false;
  }
  // Fallback simples: SIGINT pra cancelar; default no.
  process.stdout.write(`${question} [s/N]: `);
  const buf = Buffer.alloc(8);
  try {
    const fd = fs.openSync("/dev/tty", "r");
    const n = fs.readSync(fd, buf, 0, 8, null);
    fs.closeSync(fd);
    const ans = buf.slice(0, n).toString().trim().toLowerCase();
    return ans === "s" || ans === "sim" || ans === "y" || ans === "yes";
  } catch {
    return false;
  }
}

function install({ force = false }) {
  if (!fs.existsSync(SKILL_SOURCE)) {
    err(`Erro: ${SKILL_SOURCE} não existe. Reinstale o package.`);
    process.exit(1);
  }

  if (fs.existsSync(SKILL_DEST) && !force) {
    if (!promptYesNo(`${SKILL_DEST} já existe. Sobrescrever?`)) {
      log("Cancelado.");
      process.exit(0);
    }
  }

  ensureDir(path.dirname(SKILL_DEST));
  if (fs.existsSync(SKILL_DEST)) {
    fs.rmSync(SKILL_DEST, { recursive: true, force: true });
  }
  copyRecursive(SKILL_SOURCE, SKILL_DEST);

  // Garantir +x nos scripts shell
  for (const rel of ["scripts/lint.sh", "scripts/backfill-frontmatter.sh"]) {
    const target = path.join(SKILL_DEST, rel);
    if (fs.existsSync(target)) {
      fs.chmodSync(target, 0o755);
    }
  }

  log(`Skill instalado em ${SKILL_DEST}`);
  log(`Próximo passo: abra uma nova sessão Claude Code e o skill aparecerá em /skills.`);
}

function lint(files) {
  if (files.length === 0) {
    err("Uso: elven-docs-skill lint <arquivo.md> [<arquivo.md>...]");
    process.exit(2);
  }
  const lintScript = path.join(PACKAGE_ROOT, "skill", "scripts", "lint.sh");
  const result = spawnSync("bash", [lintScript, ...files], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

function backfill(files) {
  if (files.length === 0) {
    err("Uso: elven-docs-skill backfill <arquivo.md> [<arquivo.md>...]");
    process.exit(2);
  }
  const script = path.join(PACKAGE_ROOT, "skill", "scripts", "backfill-frontmatter.sh");
  const result = spawnSync("bash", [script, ...files], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

function check(files) {
  if (files.length === 0) {
    err("Uso: elven-docs-skill check <arquivo.md> [<arquivo.md>...]");
    process.exit(2);
  }
  const script = path.join(PACKAGE_ROOT, "skill", "scripts", "cross-section-check.sh");
  const result = spawnSync("bash", [script, ...files], { stdio: "inherit" });
  process.exit(result.status ?? 0);
}

function pdf(args) {
  if (args.length === 0) {
    err("Uso: elven-docs-skill pdf <arquivo.md> [--out <out.pdf>] [--theme <client|internal>]");
    process.exit(2);
  }
  const script = path.join(PACKAGE_ROOT, "skill", "scripts", "render-pdf.js");
  if (!fs.existsSync(script)) {
    err(`Erro: ${script} não encontrado. Reinstale o package.`);
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

function main() {
  switch (cmd) {
    case undefined:
    case "--help":
    case "-h":
    case "help":
      printHelp();
      break;

    case "--version":
    case "-v":
    case "version":
      log(PACKAGE_JSON.version);
      break;

    case "install": {
      const force = args.includes("--force");
      install({ force });
      break;
    }

    case "update":
      install({ force: true });
      break;

    case "lint":
      lint(args.slice(1));
      break;

    case "backfill":
      backfill(args.slice(1));
      break;

    case "check":
      check(args.slice(1));
      break;

    case "pdf":
      pdf(args.slice(1));
      break;

    default:
      err(`Comando desconhecido: ${cmd}\n`);
      printHelp();
      process.exit(2);
  }
}

main();
