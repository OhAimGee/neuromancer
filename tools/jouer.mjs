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
import path from 'node:path';
import { derouler, ouvrirJeu } from './lib-jeu.mjs';

const dossier = process.argv[2] ?? 'captures';
const strategie = process.argv[3] ?? 'dernier';
fs.mkdirSync(dossier, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu();
await page.locator('.viewport').screenshot({ path: path.join(dossier, '00-demarrage.png') });

let etape = 0;
let beats = 0;

while (etape < 30) {
  // Derouler la scene replique par replique, en capturant chaque boite.
  await derouler(page, {
    surReplique: async ({ nom, texte }) => {
      console.log(`   ${nom ? `[${nom}] ` : '           '}${texte}`);
      await page.locator('.viewport').screenshot({
        path: path.join(dossier, `beat-${String(++beats).padStart(3, '0')}.png`),
      });
    },
  });

  const boutons = page.locator('.dlg__bouton');
  const n = await boutons.count();
  if (n === 0) break;

  etape++;
  await page.locator('.viewport').screenshot({
    path: path.join(dossier, `choix-${String(etape).padStart(2, '0')}.png`),
  });

  const libelles = await boutons.allInnerTexts();
  console.log(`\n--- choix ${etape} : ${n} options`);
  for (const l of libelles) console.log('   ' + l.replace(/\n/g, ' '));
  for (const g of await page.locator('.dlg__glose').allInnerTexts()) {
    console.log('   glose> ' + g.replace(/\n/g, ' '));
  }

  const i =
    strategie === 'premier' ? 0 : strategie === 'hasard' ? Math.floor(Math.random() * n) : n - 1;
  console.log(`   => choisi : ${libelles[i]?.replace(/\n/g, ' ')}\n`);
  await boutons.nth(i).click();
  await page.waitForTimeout(150);
}

await page.locator('.viewport').screenshot({ path: path.join(dossier, 'fin.png') });

const hud = await page.locator('.dlg__hud').innerText();
console.log(`\nHUD final : ${hud.replace(/\n/g, '  ')}`);
console.log(`repliques lues : ${beats} · palettes de choix : ${etape}`);
console.log('erreurs console :', erreurs.length ? erreurs.join('\n') : 'aucune');
console.log(`captures dans ${dossier}/`);

await navigateur.close();
process.exit(erreurs.length ? 1 : 0);
