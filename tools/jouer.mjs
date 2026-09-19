#!/usr/bin/env node
// Joue une partie ENTIERE, du flatline d'ouverture jusqu'a une fin, en
// capturant chaque replique et chaque palette de choix.
//
//   node tools/jouer.mjs [dossier-de-sortie] [premier|dernier|hasard]
//
// C'est la verification qui compte : elle prouve que la boucle se ferme.
// Le serveur de dev doit tourner.

import fs from 'node:fs';
import path from 'node:path';
import { auComptoir, dansLeReseau, derouler, ouvrirJeu, passerComptoir, plongerAuHasard } from './lib-jeu.mjs';

const dossier = process.argv[2] ?? 'captures';
const strategie = process.argv[3] ?? 'premier';
fs.mkdirSync(dossier, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu();
await page.locator('.viewport').screenshot({ path: path.join(dossier, '00-demarrage.png') });

let etape = 0;
let beats = 0;
let plongees = 0;
let fin = null;

// 120 palettes et non 60 : l'atelier du Finn est un menu reentrant, et un
// marcheur aleatoire y tourne longtemps avant d'en ressortir. A 60, une partie
// sur cinq epuisait le budget et se declarait « boucle non fermee » alors que
// le recit allait tres bien.
while (etape < 120) {
  if (await dansLeReseau(page)) {
    plongees++;
    const bilan = await plongerAuHasard(page);
    console.log(`\n=== plongee ${plongees} : ${bilan}\n`);
    continue;
  }

  if (await auComptoir(page)) {
    const achetes = await passerComptoir(page);
    console.log(`\n=== comptoir : ${achetes.length ? achetes.join(', ') : 'rien a ma portee'}\n`);
    continue;
  }

  await derouler(page, {
    surReplique: async ({ nom, texte }) => {
      console.log(`   ${nom ? `[${nom}] ` : '           '}${texte}`);
      await page.locator('.viewport').screenshot({
        path: path.join(dossier, `beat-${String(++beats).padStart(3, '0')}.png`),
      });
    },
  });

  if ((await page.locator('.fin__nom').count()) > 0) {
    fin = ((await page.locator('.fin__nom').textContent()) ?? '').trim();
    await page.locator('.viewport').screenshot({ path: path.join(dossier, 'fin.png') });
    break;
  }
  if (await dansLeReseau(page)) continue;
  if (await auComptoir(page)) continue;

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

  const actifs = [];
  for (let i = 0; i < n; i++) if (await boutons.nth(i).isEnabled()) actifs.push(i);
  if (actifs.length === 0) break;
  const i =
    strategie === 'premier'
      ? actifs[0]
      : strategie === 'hasard'
        ? actifs[Math.floor(Math.random() * actifs.length)]
        : actifs[actifs.length - 1];
  console.log(`   => choisi : ${libelles[i]?.replace(/\n/g, ' ')}\n`);
  await boutons.nth(i).click();
  await page.waitForTimeout(150);
}

const hud = (await page.locator('.dlg__hud').count())
  ? ((await page.locator('.dlg__hud').textContent()) ?? '').replace(/\s+/g, ' ').trim()
  : '(pas de HUD)';

console.log(`\nHUD final : ${hud}`);
console.log(`repliques lues : ${beats} · palettes de choix : ${etape} · plongees : ${plongees}`);
console.log(`fin atteinte : ${fin ?? 'AUCUNE — la boucle ne se ferme pas'}`);
console.log(`erreurs console : ${erreurs.length === 0 ? 'aucune' : ''}`);
for (const e of erreurs) console.error(`  ${e}`);
console.log(`captures dans ${dossier}/`);

await navigateur.close();
process.exit(erreurs.length === 0 && fin !== null ? 0 : 1);
