#!/usr/bin/env node
// Joue le prologue dans un vrai navigateur et capture chaque palette de choix.
//
//   node tools/jouer.mjs [dossier-de-sortie] [strategie]
//
// strategie : "dernier" (defaut, prend le dernier choix — souvent le plus
// conditionnel), "premier", ou "hasard".
//
// Sert a verifier qu'une modification narrative ne casse pas la scene, sans
// rejouer a la main. Le serveur de dev doit tourner.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const LIBS = path.join(os.homedir(), '.local/playwright-libs/extracted/usr/lib/x86_64-linux-gnu');
if (fs.existsSync(LIBS)) {
  process.env['LD_LIBRARY_PATH'] = `${LIBS}:${process.env['LD_LIBRARY_PATH'] ?? ''}`;
}

const dossier = process.argv[2] ?? 'captures';
const strategie = process.argv[3] ?? 'dernier';
fs.mkdirSync(dossier, { recursive: true });

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1280, height: 720 } });

const erreurs = [];
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
});
page.on('pageerror', (e) => erreurs.push(`PAGEERROR ${e.message}`));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForSelector('.boot__title', { timeout: 10_000 });
await page.screenshot({ path: path.join(dossier, '00-demarrage.png') });

await page.click('.viewport');
await page.waitForSelector('.dlg', { timeout: 5_000 });

let etape = 0;
while (etape < 20) {
  await page.waitForTimeout(250);
  const boutons = page.locator('.dlg__bouton');
  const n = await boutons.count();

  await page.screenshot({ path: path.join(dossier, `${String(++etape).padStart(2, '0')}.png`) });

  if (n === 0) break;

  const libelles = await boutons.allInnerTexts();
  console.log(`\n--- etape ${etape} : ${n} choix`);
  for (const l of libelles) console.log('   ' + l.replace(/\n/g, ' '));

  const i =
    strategie === 'premier' ? 0 : strategie === 'hasard' ? Math.floor(Math.random() * n) : n - 1;
  console.log(`   => choisi : ${libelles[i]?.replace(/\n/g, ' ')}`);
  await boutons.nth(i).click();
}

const hud = await page.locator('.dlg__hud').innerText();
console.log(`\nHUD final : ${hud.replace(/\n/g, '  ')}`);
console.log(`etapes jouees : ${etape}`);
console.log('erreurs console :', erreurs.length ? erreurs.join('\n') : 'aucune');
console.log(`captures dans ${dossier}/`);

await navigateur.close();
process.exit(erreurs.length ? 1 : 0);
