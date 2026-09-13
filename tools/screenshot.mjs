#!/usr/bin/env node
// Capture le jeu tournant sur le serveur de dev et signale les erreurs console.
//
//   node tools/screenshot.mjs [fichier.png] [url]
//
// Sert a verifier le rendu sans intervention manuelle. Le serveur de dev doit
// tourner (npm run dev).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

// Cette machine (Ubuntu 24.04 sous WSL) n'a pas libasound2, et l'installer
// demanderait les droits root. Le paquet est extrait dans le repertoire
// personnel ; on l'ajoute au chemin de recherche avant de lancer le navigateur.
// Mise en place : voir la section Outillage de CLAUDE.md.
const LIBS = path.join(os.homedir(), '.local/playwright-libs/extracted/usr/lib/x86_64-linux-gnu');
if (fs.existsSync(LIBS)) {
  process.env['LD_LIBRARY_PATH'] = `${LIBS}:${process.env['LD_LIBRARY_PATH'] ?? ''}`;
}

const sortie = process.argv[2] ?? 'capture.png';
const url = process.argv[3] ?? 'http://localhost:5173/';

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1280, height: 720 } });

const erreurs = [];
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
});
page.on('pageerror', (e) => erreurs.push(`PAGEERROR ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: sortie });

const viewport = page.locator('.viewport');
if (await viewport.count()) {
  console.log('--- texte visible dans le viewport ---');
  console.log(await viewport.innerText());
}
console.log('--- erreurs console ---');
console.log(erreurs.length ? erreurs.join('\n') : 'aucune');
console.log(`--- capture ecrite : ${sortie}`);

await navigateur.close();
process.exit(erreurs.length ? 1 : 0);
