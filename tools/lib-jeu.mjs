// Briques communes aux outils de verification autonome.
//
// Les deux outils (jouer.mjs, plonger.mjs) doivent ouvrir le jeu, traverser le
// boot, et savoir fermer les cartons d'entracte — qui bloquent la scene tant
// qu'ils ne sont pas lus, et font echouer tout clic sur un choix.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const LIBS = path.join(os.homedir(), '.local/playwright-libs/extracted/usr/lib/x86_64-linux-gnu');
if (fs.existsSync(LIBS)) {
  process.env['LD_LIBRARY_PATH'] = `${LIBS}:${process.env['LD_LIBRARY_PATH'] ?? ''}`;
}

/**
 * Ouvre le jeu, passe l'ecran de demarrage, et collecte les erreurs console.
 *
 * Le texte s'affiche d'un coup par defaut : les outils verifient le jeu, pas la
 * vitesse de la machine a ecrire, et attendre chaque caractere multiplierait la
 * duree d'une partie automatique par dix. Passer `vitesseTexte` pour capturer
 * l'effet.
 */
export async function ouvrirJeu({ largeur = 1280, hauteur = 720, vitesseTexte = 0 } = {}) {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });

  await page.addInitScript((v) => {
    window.localStorage.setItem(
      'neuromancer-options',
      JSON.stringify({ state: { vitesseTexte: v }, version: 2 }),
    );
  }, vitesseTexte);

  const erreurs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text());
  });
  page.on('pageerror', (e) => erreurs.push(`PAGEERROR ${e.message}`));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.boot__title', { timeout: 10_000 });
  await page.click('.viewport');
  await page.waitForSelector('.dlg', { timeout: 5_000 });

  return { navigateur, page, erreurs };
}

/** Ferme le carton d'entracte s'il y en a un. Rend son texte, ou null. */
export async function passerEntracte(page, capture = null) {
  const carton = page.locator('.entracte');
  if ((await carton.count()) === 0) return null;
  if (capture) await page.locator('.viewport').screenshot({ path: capture });
  const texte = ((await carton.locator('.entracte__texte').textContent()) ?? '').trim();
  await carton.click();
  await page.waitForTimeout(150);
  return texte;
}

/**
 * Fait defiler la boite de dialogue jusqu'a la prochaine palette de choix.
 *
 * La boite ne montre qu'une replique a la fois : sans ce deroulage, un outil
 * qui cherche des boutons ne trouve jamais rien.
 * Rend les repliques lues, dans l'ordre.
 */
export async function derouler(page, { surReplique = null, max = 80 } = {}) {
  const lues = [];
  for (let i = 0; i < max; i++) {
    await passerEntracte(page);
    const boite = page.locator('.boite');
    if ((await boite.count()) === 0) break;

    const nom = (await page.locator('.boite__nom').count())
      ? ((await page.locator('.boite__nom').textContent()) ?? '').trim()
      : null;
    const texte = ((await page.locator('.boite__texte').textContent()) ?? '').trim();
    const replique = { nom, texte };
    lues.push(replique);
    if (surReplique) await surReplique(replique, i);

    if ((await page.locator('.boite__suite').count()) === 0) break;
    await boite.click();
    await page.waitForTimeout(90);
    // Un clic pendant l'ecriture ne fait que reveler la replique : il en faut
    // un second pour passer a la suivante. La boite peut aussi avoir disparu
    // entre-temps (plongee, fin de partie), d'ou le comptage avant lecture.
    if ((await page.locator('.boite__texte').count()) > 0) {
      const apres = ((await page.locator('.boite__texte').textContent()) ?? '').trim();
      if (apres === texte) {
        await boite.click();
        await page.waitForTimeout(90);
      }
    }
  }
  return lues;
}

/** Vrai quand le jeu a bascule dans le cyberespace. */
export async function dansLeReseau(page) {
  return (await page.locator('.net canvas').count()) > 0;
}

/**
 * Mene une plongee au hasard et se debranche.
 *
 * Les noeuds vivent sur un canvas : on les designe par les coordonnees que le
 * rendu publie dans `window.__noeudsVisibles` (sonde de developpement), faute
 * de quoi Playwright n'a rien a cliquer.
 * Rend le bilan affiche a la sortie.
 */
export async function plongerAuHasard(page, { coups = 14, surEtape = null } = {}) {
  await page.waitForSelector('.net canvas', { timeout: 10_000 });
  await page.waitForTimeout(500);

  const carte = await page.locator('.net__carte canvas').boundingBox();
  const echelle = carte ? carte.width / 320 : 4;

  const bouton = (libelle) =>
    page.locator('.net__actions .net__bouton:not([disabled])', { hasText: libelle });

  for (let coup = 1; coup <= coups; coup++) {
    if ((await page.locator('.net__bilan').count()) > 0) break;

    // Piller des que c'est possible : une marche purement aleatoire ne pille
    // presque jamais, et un outil qui ne rapporte rien ne prouve rien — les
    // fins qui dependent d'une info volee resteraient hors d'atteinte.
    if ((await bouton('PILLER').count()) > 0) {
      await bouton('PILLER').first().click();
      await page.waitForTimeout(120);
      if (surEtape) await surEtape(coup);
      continue;
    }

    const noeuds = await page.evaluate(() => window.__noeudsVisibles ?? []);
    if (noeuds.length > 0 && carte) {
      // Viser une BDD en priorite, sinon n'importe quoi.
      const bdd = noeuds.filter((n) => n.type === 'bdd');
      const pool = bdd.length > 0 && Math.random() < 0.7 ? bdd : noeuds;
      const n = pool[Math.floor(Math.random() * pool.length)];
      await page.mouse.click(carte.x + n.x * echelle, carte.y + n.y * echelle);
      await page.waitForTimeout(80);
    }

    const actions = page.locator('.net__actions .net__bouton:not([disabled])');
    const total = await actions.count();
    if (total === 0) break;
    // Le dernier bouton est DEBRANCHER : on ne le prend qu'a la fin.
    const utiles = Math.max(1, total - 1);
    await actions.nth(Math.floor(Math.random() * utiles)).click();
    await page.waitForTimeout(120);
    if (surEtape) await surEtape(coup);
  }

  // Se debrancher si la plongee est encore ouverte, puis encaisser.
  if ((await page.locator('.net__bilan').count()) === 0) {
    await page.locator('.net__bouton--sortie').click();
    await page.waitForTimeout(150);
  }
  const bilan = ((await page.locator('.net__bilan').textContent()) ?? '').trim();
  await page.locator('.net__bouton--sortie').click();
  await page.waitForTimeout(250);
  return bilan;
}

/**
 * Joue depuis l'ouverture en prenant toujours le premier choix, et s'arrete
 * des que le jeu bascule dans la matrice — au hub, le premier choix est la
 * cabine du Chatsubo. Rend vrai si on est branche.
 */
export async function traverserPrologue(page, max = 40) {
  for (let i = 0; i < max; i++) {
    await derouler(page);
    if (await dansLeReseau(page)) return true;
    const boutons = page.locator('.dlg__bouton:not([disabled])');
    if ((await boutons.count()) === 0) break;
    await boutons.first().click();
    await page.waitForTimeout(120);
  }
  await derouler(page);
  return dansLeReseau(page);
}
