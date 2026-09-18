#!/usr/bin/env node
// Prouve que le jeu se joue ENTIEREMENT au clavier.
//
//   node tools/clavier.mjs [captures]
//
// Pas une capture de plus : pas un clic. La souris n'est jamais touchee, et si
// le prologue n'atteint pas le hub, l'outil sort en code non nul.
//
// C'est la seule verification qui ne ment pas sur ce lot. Un test unitaire sur
// le crochet de navigation dirait que les fleches deplacent un index ; il ne
// dirait pas qu'une palette de choix est atteignable, qu'un carton d'entracte
// se ferme, ni qu'Entree ne valide pas un choix qu'on n'a pas encore vu.

import fs from 'node:fs';
import path from 'node:path';
import { ouvrirJeu } from './lib-jeu.mjs';

const CAPTURES = process.argv.includes('captures');
const DOSSIER = 'captures';
if (CAPTURES) fs.mkdirSync(DOSSIER, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu({ clavier: true });

const capturer = async (nom) => {
  if (!CAPTURES) return;
  const cible = path.join(DOSSIER, `${nom}.png`);
  await page.locator('.viewport').screenshot({ path: cible });
  console.log(`  capture ${cible}`);
};

const vise = () =>
  page.locator('.dlg__bouton--vise').count().then(async (n) =>
    n === 0 ? null : ((await page.locator('.dlg__bouton--vise').textContent()) ?? '').trim(),
  );

let choixPris = 0;
let flechesVerifiees = false;

for (let i = 0; i < 260; i++) {
  if ((await page.locator('.entracte').count()) > 0) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    continue;
  }

  const boutons = await page.locator('.dlg__bouton').count();
  if (boutons > 1) {
    // Les fleches doivent deplacer le curseur, une fois au moins, et sous les
    // yeux de l'outil : c'est le coeur du lot.
    if (!flechesVerifiees) {
      const avant = await vise();
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(80);
      const apres = await vise();
      if (avant === null || apres === null || avant === apres) {
        console.error(`la fleche bas n'a pas deplace le curseur (${avant} -> ${apres})`);
        process.exitCode = 1;
      } else {
        flechesVerifiees = true;
        await capturer('clavier');
      }
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(80);
    }
    await page.keyboard.press('Enter');
    choixPris += 1;
    await page.waitForTimeout(150);
    continue;
  }

  if ((await page.locator('.dlg__bouton').count()) === 1) {
    await page.keyboard.press('Enter');
    choixPris += 1;
    await page.waitForTimeout(150);
    continue;
  }

  if ((await page.locator('.boite').count()) === 0) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(70);

  if ((await page.locator('.dlg__bouton', { hasText: 'Descendre chez le Finn' }).count()) > 0) break;
}

const auHub = (await page.locator('.dlg__bouton', { hasText: 'Descendre chez le Finn' }).count()) > 0;

// La fiche et les options, au clavier et seulement au clavier.
await page.keyboard.press('Tab');
await page.waitForTimeout(200);
const ficheOuverte = (await page.locator('.etat').count()) > 0;
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const ficheFermee = (await page.locator('.etat').count()) === 0;
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const optionsOuvertes = (await page.locator('.opt').count()) > 0;
if (CAPTURES && optionsOuvertes) await capturer('clavier-options');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const optionsFermees = (await page.locator('.opt').count()) === 0;

console.log(`${choixPris} choix pris au clavier, hub ${auHub ? 'atteint' : 'MANQUE'}`);
console.log(
  `fiche ${ficheOuverte ? 'ouverte' : 'MANQUE'}/${ficheFermee ? 'fermee' : 'RESTE'} · ` +
    `options ${optionsOuvertes ? 'ouvertes' : 'MANQUE'}/${optionsFermees ? 'fermees' : 'RESTE'}`,
);
if (erreurs.length > 0) {
  console.error('erreurs console :');
  for (const e of erreurs) console.error(`  ${e}`);
  process.exitCode = 1;
}
if (!auHub || !flechesVerifiees || !ficheOuverte || !ficheFermee || !optionsOuvertes || !optionsFermees) {
  process.exitCode = 1;
}

await navigateur.close();
