#!/usr/bin/env node
// Joue le prologue, se branche, puis mene une plongee au hasard dans le
// cyberespace en capturant chaque etape.
//
//   node tools/plonger.mjs [dossier-de-sortie] [nombre-de-coups]
//
// Le serveur de dev doit tourner.

import fs from 'node:fs';
import path from 'node:path';
import { ouvrirJeu, traverserPrologue } from './lib-jeu.mjs';

const dossier = process.argv[2] ?? 'captures';
const coups = Number(process.argv[3] ?? 14);
fs.mkdirSync(dossier, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu();
await traverserPrologue(page);

await page.waitForSelector('.dlg__fin .net__bouton', { timeout: 5_000 });
await page.click('.dlg__fin .net__bouton');
await page.waitForSelector('.net canvas', { timeout: 10_000 });
await page.waitForTimeout(700);
await page.locator('.viewport').screenshot({ path: path.join(dossier, 'net-00.png') });

const carte = await page.locator('.net__carte canvas').boundingBox();
const echelle = carte ? carte.width / 320 : 4;

for (let coup = 1; coup <= coups; coup++) {
  if ((await page.locator('.net__bilan').count()) > 0) break;

  // Designer un noeud au hasard parmi ceux que le rendu montre, en cliquant
  // sur le canvas aux coordonnees du graphe.
  const noeuds = await page.evaluate(() => window.__noeudsVisibles ?? []);
  if (noeuds.length > 0 && carte) {
    const n = noeuds[Math.floor(Math.random() * noeuds.length)];
    await page.mouse.click(carte.x + n.x * echelle, carte.y + n.y * echelle);
    await page.waitForTimeout(80);
  }

  const actions = page.locator('.net__actions .net__bouton:not([disabled])');
  const total = await actions.count();
  // Le dernier bouton est DEBRANCHER : on ne le prend qu'a la fin.
  const utiles = Math.max(1, total - 1);
  await actions.nth(Math.floor(Math.random() * utiles)).click();
  await page.waitForTimeout(120);

  if (coup % 4 === 0) {
    await page.locator('.viewport').screenshot({
      path: path.join(dossier, `net-${String(coup).padStart(2, '0')}.png`),
    });
  }
}

const hud = (await page.locator('.net__hud').textContent()) ?? '';
const bilan = (await page.locator('.net__bilan').count())
  ? await page.locator('.net__bilan').textContent()
  : 'plongee en cours';
await page.locator('.viewport').screenshot({ path: path.join(dossier, 'net-fin.png') });

console.log(`HUD   : ${hud.replace(/\s+/g, ' ').trim()}`);
console.log(`bilan : ${bilan}`);
console.log(`erreurs console : ${erreurs.length === 0 ? 'aucune' : ''}`);
for (const e of erreurs) console.error(`  ${e}`);

await navigateur.close();
process.exit(erreurs.length === 0 ? 0 : 1);
