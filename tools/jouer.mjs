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
import { ouvrirJeu, passerEntracte } from './lib-jeu.mjs';

const dossier = process.argv[2] ?? 'captures';
const strategie = process.argv[3] ?? 'dernier';
fs.mkdirSync(dossier, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu();
await page.locator('.viewport').screenshot({ path: path.join(dossier, '00-demarrage.png') });

let cartons = 0;
let etape = 0;
while (etape < 30) {
  await page.waitForTimeout(250);
  const carton = await passerEntracte(
    page,
    path.join(dossier, `entracte-${String(cartons + 1).padStart(2, '0')}.png`),
  );
  if (carton !== null) console.log(`\n=== entracte : ${carton}`);
  cartons += carton === null ? 0 : 1;
  const boutons = page.locator('.dlg__bouton');
  const n = await boutons.count();

  await page.locator('.viewport').screenshot({
    path: path.join(dossier, `${String(++etape).padStart(2, '0')}.png`),
  });

  if (n === 0) break;

  const libelles = await boutons.allInnerTexts();
  console.log(`\n--- etape ${etape} : ${n} choix`);
  for (const l of libelles) console.log('   ' + l.replace(/\n/g, ' '));
  for (const g of await page.locator('.dlg__glose').allInnerTexts()) {
    console.log('   glose> ' + g.replace(/\n/g, ' '));
  }

  const i =
    strategie === 'premier' ? 0 : strategie === 'hasard' ? Math.floor(Math.random() * n) : n - 1;
  console.log(`   => choisi : ${libelles[i]?.replace(/\n/g, ' ')}`);
  await boutons.nth(i).click();
}

// Le panneau de fin est sous la ligne de flottaison quand la scene est longue.
await page.evaluate(() => {
  const j = document.querySelector('.dlg__journal');
  if (j) j.scrollTop = j.scrollHeight;
});
await page.waitForTimeout(200);
await page.locator('.viewport').screenshot({ path: path.join(dossier, 'fin.png') });

const hud = await page.locator('.dlg__hud').innerText();
console.log(`\nHUD final : ${hud.replace(/\n/g, '  ')}`);
console.log(`etapes jouees : ${etape}`);
console.log('erreurs console :', erreurs.length ? erreurs.join('\n') : 'aucune');
console.log(`captures dans ${dossier}/`);

await navigateur.close();
process.exit(erreurs.length ? 1 : 0);
