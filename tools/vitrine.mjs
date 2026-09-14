#!/usr/bin/env node
// Les captures du README, prises toujours au meme endroit du recit.
//
//   node tools/vitrine.mjs        (serveur de dev requis)
//
// Elles vivent dans docs/images/ et sont versionnees : un lecteur du depot
// doit voir le jeu sans l'installer. Les prendre a la main garantissait de les
// laisser vieillir — celles du premier README montraient encore une boite de
// dialogue qui prenait tout l'ecran.
//
// L'acte III a son propre outil (tools/acte3.mjs) : il lui faut un profil de
// joueur experimente pose dans localStorage, ce qui n'a rien a faire ici.

import fs from 'node:fs';
import path from 'node:path';
import { ouvrirJeu, derouler, passerEntracte, dansLeReseau, plongerAuHasard } from './lib-jeu.mjs';

const DOSSIER = 'docs/images';
fs.mkdirSync(DOSSIER, { recursive: true });

const { navigateur, page, erreurs } = await ouvrirJeu({
  captureBoot: path.join(DOSSIER, 'boot.png'),
});
console.log('  boot.png');

const capturer = async (nom) => {
  await page.locator('.viewport').screenshot({ path: path.join(DOSSIER, `${nom}.png`) });
  console.log(`  ${nom}.png`);
};

let entractePris = false;

/**
 * Avance d'une replique, en guettant l'entracte au passage.
 *
 * On ne peut pas s'en remettre a `derouler` pour le trouver : il ferme les
 * cartons lui-meme — c'est fait pour, un carton bloque tout clic sur un choix —
 * et le carton aurait disparu avant qu'on le regarde.
 */
async function avancer() {
  if ((await page.locator('.entracte').count()) > 0) {
    if (!entractePris) {
      await passerEntracte(page, path.join(DOSSIER, 'entracte.png'));
      console.log('  entracte.png');
      entractePris = true;
    } else {
      await passerEntracte(page);
    }
    return true;
  }
  const boite = page.locator('.boite');
  if ((await boite.count()) === 0) return false;
  if ((await page.locator('.boite__suite').count()) === 0) return false;
  const avant = ((await page.locator('.boite__texte').textContent()) ?? '').trim();
  await boite.click();
  await page.waitForTimeout(100);
  if ((await page.locator('.boite__texte').count()) > 0) {
    const apres = ((await page.locator('.boite__texte').textContent()) ?? '').trim();
    if (apres === avant) {
      await boite.click();
      await page.waitForTimeout(100);
    }
  }
  return true;
}

/** Joue en prenant toujours le premier choix, jusqu'a ce que le predicat cede. */
async function jusqua(predicat, max = 400) {
  for (let i = 0; i < max; i++) {
    while (await avancer()) {
      if (await predicat()) return true;
    }
    if (await predicat()) return true;
    if (await dansLeReseau(page)) return false;
    const boutons = page.locator('.dlg__bouton:not([disabled])');
    if ((await boutons.count()) === 0) return false;
    await boutons.first().click();
    await page.waitForTimeout(120);
  }
  return false;
}

// 1. L'ouverture : le flashback du flatline, premiere replique jouee.
await derouler(page, { max: 3 });
await capturer('ouverture');

// 3. Une boite de dialogue nominative, avec sa palette de choix etiquetes.
await jusqua(async () => (await page.locator('.boite__nom').count()) > 0
  && (await page.locator('.dlg__etq').count()) > 0);
await capturer('dialogue');

// 4. Le hub : c'est la seule palette qui offre des lieux au lieu de repliques.
const auHub = async () =>
  (await page.locator('.dlg__bouton', { hasText: 'Descendre chez le Finn' }).count()) > 0;
await jusqua(auHub);
if (!entractePris) {
  console.error('aucun entracte rencontre avant le hub');
  process.exitCode = 1;
}

// On ressort du hub et on y revient avant de capturer. Au premier passage, les
// explications de regle sont neuves et occupent la moitie du panneau : sept
// lieux y deviennent deux. La capture montrerait un hub qui n'existe qu'une
// fois par profil.
await page.locator('.dlg__bouton', { hasText: 'Parler à Ratz' }).first().click();
await page.waitForTimeout(150);
await jusqua(auHub);
await capturer('hub');

// 4 bis. La rue. Le port de Ninsei est le seul lieu du hub joue en exterieur,
// donc le seul qui montre le tileset de rue.
await page.locator('.dlg__bouton', { hasText: 'port de Ninsei' }).first().click();
await page.waitForTimeout(250);
await avancer();
await capturer('ninsei');
await jusqua(auHub);

// 5 et 6. Les deux panneaux. On les ferme par leur bouton et non par Echap :
// Echap ouvre les options, donc fermer la fiche avec ouvrait le panneau
// suivant par-dessus, et le clic d'apres tombait dessus.
const panneau = async (ouvrir, racine, nom) => {
  await ouvrir();
  await page.waitForSelector(racine, { timeout: 3000 });
  await page.waitForTimeout(250);
  await capturer(nom);
  await page.locator(`${racine} .net__bouton`).last().click();
  await page.waitForSelector(racine, { state: 'detached', timeout: 3000 });
  await page.waitForTimeout(150);
};
await panneau(() => page.keyboard.press('Tab'), '.etat', 'etat');
await panneau(() => page.locator('.opt__ouvrir:not(.opt__ouvrir--fiche)').click(), '.opt', 'options');

// 6 bis. La meme fiche, une fois que des plans ont ete voles et montes.
//
// L'etat est POSE et non joue : le butin d'une plongee est tire au sort, et un
// outil qui attendrait de piller trois plans precis serait une loterie, pas une
// capture. Ce qu'on verifie ici est l'affichage — l'ordre des vignettes, le
// filtre qui empeche un plan deja pose de figurer deux fois — et la logique de
// la pose est couverte par les tests unitaires. L'etat injecte est retire
// aussitot : les captures suivantes doivent montrer une partie ordinaire.
const posable = await page.evaluate(() => {
  if (!window.__runStore) return false;
  const run = window.__runStore.getState();
  for (const id of ['coprocesseur', 'filtre_noir', 'lentilles_molly']) run.acquerir('plans', id);
  for (const id of ['coprocesseur', 'lentilles_molly']) run.acquerir('implants', id);
  return true;
});
if (!posable) {
  console.error('sonde __runStore absente : capture des implants impossible');
  process.exitCode = 1;
} else {
  // La fiche depasse la hauteur de la vue et defile : ouverte en haut, elle
  // couperait justement les deux sections qu'on vient capturer.
  await page.keyboard.press('Tab');
  await page.waitForSelector('.etat', { timeout: 3000 });
  await page.evaluate(() => {
    const f = document.querySelector('.etat');
    if (f) f.scrollTop = f.scrollHeight;
  });
  await page.waitForTimeout(250);
  await capturer('implants');
  await page.locator('.etat .net__bouton').last().click();
  await page.waitForSelector('.etat', { state: 'detached', timeout: 3000 });
  await page.evaluate(() => window.__runStore.setState({ plans: [], implants: [] }));
}

// 7. Le cyberespace, une fois branche et deux noeuds plus loin.
// Le voile de branchement ne dure que six dixiemes de seconde : on ne le
// capture pas en le poursuivant, on se contente de verifier qu'il est bien
// apparu, et la capture se prend juste apres sur une copie figee.
const voileVu = page
  .waitForSelector('.jack', { timeout: 120_000 })
  .then(() => true)
  .catch(() => false);
await jusqua(async () => dansLeReseau(page));
if (await dansLeReseau(page)) {
  await page.waitForSelector('.net canvas');
  await page.waitForTimeout(600);
  // Deux deplacements choisis, et pas la marche aleatoire de plongerAuHasard :
  // celle-ci tire des scripts au hasard et remplit le journal de « cible
  // invalide pour ce script », ce qui se lit comme un defaut et n'en est pas un.
  const carte = await page.locator('.net__carte canvas').boundingBox();
  const echelle = carte ? carte.width / 320 : 4;
  for (let pas = 0; pas < 2 && carte; pas++) {
    const noeuds = await page.evaluate(() => window.__noeudsVisibles ?? []);
    if (noeuds.length === 0) break;
    const n = noeuds[pas % noeuds.length];
    await page.mouse.click(carte.x + n.x * echelle, carte.y + n.y * echelle);
    await page.waitForTimeout(120);
    const aller = page.locator('.net__actions .net__bouton:not([disabled])', { hasText: 'ALLER' });
    if ((await aller.count()) === 0) continue;
    await aller.first().click();
    await page.waitForTimeout(180);
  }
  await capturer('cyberespace');

  // 8. Le branchement. Poser le voile nous-memes et arreter son animation sur
  // une image est le seul moyen d'en avoir une capture stable ; l'assertion
  // ci-dessus garantit que c'est bien ce que le jeu a joue, et non une classe
  // CSS restee dans la feuille de style apres que le composant l'a oubliee.
  if (!(await voileVu)) {
    console.error('le voile de branchement ne s est pas affiche');
    process.exitCode = 1;
  } else {
    await page.evaluate(() => {
      const d = document.createElement('div');
      d.className = 'jack jack--entree';
      d.id = 'vitrine-jack';
      d.style.animationDelay = '-0.15s';
      d.style.animationPlayState = 'paused';
      document.querySelector('.viewport').appendChild(d);
    });
    await page.waitForTimeout(120);
    await capturer('branchement');
    await page.evaluate(() => document.getElementById('vitrine-jack')?.remove());
  }

  // 9. La glace noire. La trace monte d'un point par deplacement : on fait
  // l'aller-retour entre deux relais jusqu'au plafond, ou la riposte frappe a
  // chaque tick. C'est la derniere capture : la plongee est finie apres.
  const carteM = await page.locator('.net__carte canvas').boundingBox();
  for (let tour = 0; tour < 200 && carteM; tour++) {
    if ((await page.locator('.mort').count()) > 0) break;
    // Une glace refuse le passage sans couter un tick : viser les relais.
    const noeuds = (await page.evaluate(() => window.__noeudsVisibles ?? [])).filter(
      (n) => n.type === 'relais' || n.type === 'bdd',
    );
    let bouge = false;
    for (const n of noeuds) {
      await page.mouse.click(carteM.x + n.x * echelle, carteM.y + n.y * echelle);
      await page.waitForTimeout(35);
      const aller = page.locator('.net__actions .net__bouton:not([disabled])', { hasText: 'ALLER' });
      if ((await aller.count()) === 0) continue;
      await aller.first().click();
      await page.waitForTimeout(45);
      bouge = true;
      break;
    }
    if (!bouge) break;
  }
  if ((await page.locator('.mort').count()) > 0) {
    await page.waitForTimeout(1100);
    await capturer('glace-noire');
  } else {
    console.error('flatline jamais atteint');
    process.exitCode = 1;
  }
} else {
  console.error('cyberespace jamais atteint');
  process.exitCode = 1;
}

if (erreurs.length > 0) {
  console.error('erreurs console :');
  for (const e of erreurs) console.error('  ' + e);
  process.exitCode = 1;
}
await navigateur.close();
