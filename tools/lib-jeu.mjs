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

/** Ouvre le jeu, passe l'ecran de demarrage, et collecte les erreurs console. */
export async function ouvrirJeu({ largeur = 1280, hauteur = 720 } = {}) {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });

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

/** Joue le prologue de bout en bout, en prenant toujours le premier choix. */
export async function traverserPrologue(page, max = 30) {
  for (let i = 0; i < max; i++) {
    await passerEntracte(page);
    const boutons = page.locator('.dlg__bouton:not([disabled])');
    if ((await boutons.count()) === 0) break;
    await boutons.first().click();
    await page.waitForTimeout(120);
  }
  await passerEntracte(page);
}
