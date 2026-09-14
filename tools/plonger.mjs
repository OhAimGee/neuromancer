#!/usr/bin/env node
// Mene une plongee detaillee dans le cyberespace et capture chaque etape.
//
//   node tools/plonger.mjs [dossier-de-sortie] [nombre-de-coups]
//
// Pour jouer une partie entiere jusqu'a une fin, c'est tools/jouer.mjs.
// Le serveur de dev doit tourner.

import fs from 'node:fs';
import path from 'node:path';
import { ouvrirJeu, plongerAuHasard, traverserPrologue } from './lib-jeu.mjs';

const dossier = process.argv[2] ?? 'captures';
const coups = Number(process.argv[3] ?? 14);
fs.mkdirSync(dossier, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu();

// Au hub, le premier choix est la cabine du Chatsubo : jouer au premier choix
// mene donc droit au branchement.
const branche = await traverserPrologue(page);
if (!branche) {
  console.error('le recit n a pas mene a une plongee');
  await navigateur.close();
  process.exit(1);
}

await page.waitForTimeout(500);
await page.locator('.viewport').screenshot({ path: path.join(dossier, 'net-00.png') });

const bilan = await plongerAuHasard(page, {
  coups,
  surEtape: async (coup) => {
    if (coup % 3 !== 0) return;
    await page.locator('.viewport').screenshot({
      path: path.join(dossier, `net-${String(coup).padStart(2, '0')}.png`),
    });
  },
});

await page.waitForTimeout(200);
await page.locator('.viewport').screenshot({ path: path.join(dossier, 'net-fin.png') });

console.log(`bilan : ${bilan}`);
console.log(`erreurs console : ${erreurs.length === 0 ? 'aucune' : ''}`);
for (const e of erreurs) console.error(`  ${e}`);

await navigateur.close();
process.exit(erreurs.length === 0 ? 0 : 1);
