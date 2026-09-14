#!/usr/bin/env node
// Compile content/ink/main.ink -> public/content/main.ink.json
//
// Utilise le compilateur JavaScript pur embarque dans inkjs. On n'utilise PAS
// le paquet `inklecate`, qui enveloppe un binaire .NET et imposerait mono en CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Compiler, CompilerOptions } from 'inkjs/full';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INK_DIR = path.join(ROOT, 'content', 'ink');
const ENTRY = path.join(INK_DIR, 'main.ink');
const OUT_FILE = path.join(ROOT, 'public', 'content', 'main.ink.json');

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
};

// inkjs/full n'exporte pas PosixFileHandler ; l'interface IFileHandler ne
// demande que ces deux methodes, et les resoudre nous-memes evite de dependre
// du repertoire de travail courant.
function createFileHandler(rootDir) {
  return {
    ResolveInkFilename: (filename) => path.resolve(rootDir, filename),
    LoadInkFileContents: (filename) => fs.readFileSync(filename, 'utf-8'),
  };
}

export function compileInk() {
  const source = fs.readFileSync(ENTRY, 'utf-8');
  const errors = [];
  const warnings = [];
  const authorMessages = [];

  const options = new CompilerOptions(
    ENTRY,
    [],
    // Necessaire pour que Ink compte les visites de chaque knot : le hub et la
    // validation narrative en dependent.
    true,
    (message, errorType) => {
      // ErrorType : 0 = Author, 1 = Warning, 2 = Error
      if (errorType === 2) errors.push(message);
      else if (errorType === 1) warnings.push(message);
      else authorMessages.push(message);
    },
    createFileHandler(INK_DIR),
  );

  let json = null;
  try {
    const story = new Compiler(source, options).Compile();
    json = story.ToJson();
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  return { json, errors, warnings, authorMessages };
}

function build({ quiet = false } = {}) {
  const started = Date.now();
  const { json, errors, warnings, authorMessages } = compileInk();

  for (const m of authorMessages) console.log(`${C.dim}TODO ${m}${C.reset}`);
  for (const w of warnings) console.warn(`${C.yellow}avertissement${C.reset} ${w}`);

  if (errors.length > 0 || json === null) {
    for (const e of errors) console.error(`${C.red}erreur${C.reset} ${e}`);
    console.error(`${C.red}Compilation Ink echouee (${errors.length} erreur(s)).${C.reset}`);
    return false;
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, json, 'utf-8');

  if (!quiet) {
    const kb = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1);
    const rel = path.relative(ROOT, OUT_FILE);
    console.log(
      `${C.green}ink${C.reset} ${rel} ${C.dim}(${kb} ko, ${Date.now() - started} ms)${C.reset}`,
    );
  }
  return true;
}

// compileInk() est importe par tools/validate-narrative.mjs : sans cette garde,
// un simple import declencherait une compilation complete puis un process.exit.
const executeDirectement = process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename;

const isWatch = process.argv.includes('--watch');
const ok = executeDirectement ? build() : true;

if (!executeDirectement) {
  // rien : le module a ete importe
} else if (!isWatch) {
  process.exit(ok ? 0 : 1);
} else {
  const { default: chokidar } = await import('chokidar');
  console.log(`${C.magenta}ink${C.reset} surveillance de content/ink/**/*.ink`);
  chokidar
    // usePolling : le projet vit sur /mnt/c, ou inotify n'est pas fiable.
    .watch(path.join(INK_DIR, '**/*.ink'), {
      ignoreInitial: true,
      usePolling: true,
      interval: 300,
    })
    .on('all', (_event, file) => {
      console.log(`${C.dim}ink ${path.relative(ROOT, file)} modifie${C.reset}`);
      build();
    });
}
