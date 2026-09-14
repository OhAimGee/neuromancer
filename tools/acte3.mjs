// Verification autonome de l'acte III, dans un vrai navigateur.
//
// L'acte III est derriere quatre bons choix d'affilee et une connaissance
// volee : un outil qui joue au hasard ne l'atteint qu'une fois sur cinquante,
// et ne prouve donc rien. Celui-ci pose un profil de joueur experimente dans
// localStorage — c'est exactement ce que le jeu fait apres quelques parties —
// puis suit un itineraire decrit par des expressions regulieres sur le libelle
// des choix. Si un libelle change, l'outil s'arrete en le disant.
//
//   node tools/acte3.mjs [captures]

import fs from 'node:fs';
import path from 'node:path';
import { ouvrirJeu, derouler, passerEntracte, dansLeReseau, plongerAuHasard } from './lib-jeu.mjs';

const CAPTURES = process.argv.includes('captures');
const DOSSIER = 'docs/images';

// Un joueur qui a deja fini trois parties : c'est le seul etat depuis lequel
// l'acte III est entierement visible, fin secrete comprise.
const PROFIL = {
  state: {
    connaissances: {
      __Set__: [
        'identite_employeur', 'dossier_medical_armitage', 'operation_poing_hurlant',
        'villa_straylight_plan', 'lady_3jane_testament', 'antidote_formule',
        'wintermute_existe', 'neuromancer_existe', 'dixie_rom_localisee',
      ],
    },
    glosesVues: { __Set__: [] },
    finsVues: ['la_rue', 'flatline'],
    parties: 4,
    meilleursCycles: 5,
  },
  version: 2,
};

// L'itineraire. Chaque etape est cherchee parmi les choix affiches ; les
// repliques intermediaires sont deroulees toutes seules.
const ITINERAIRE = [
  [/Appeler Molly/, null],
  [/J'ai le nom/, null],
  [/Demander ce qu'il y a après/, null],
  [/Accepter\. Monter/, 'freeside'],
  [/gaine de service/, null],
  [/ce qu'il veut en échange|Se brancher sans rien/, 'straylight'],
];

function verifier(erreurs) {
  if (erreurs.length === 0) return;
  console.error('erreurs console :');
  for (const e of erreurs) console.error('  ' + e);
  process.exitCode = 1;
}

const { navigateur, page, erreurs } = await ouvrirJeu();
if (CAPTURES) fs.mkdirSync(DOSSIER, { recursive: true });

await page.addInitScript((p) => {
  window.localStorage.setItem('neuromancer-profil', JSON.stringify(p));
}, PROFIL);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.boot__title');
await page.click('.viewport');
await page.waitForSelector('.dlg');

const capturer = async (nom) => {
  if (!CAPTURES) return;
  const cible = path.join(DOSSIER, `${nom}.png`);
  await page.locator('.viewport').screenshot({ path: cible });
  console.log(`  capture ${cible}`);
};

// Traverser l'ouverture et le prologue en prenant toujours le premier choix,
// jusqu'au hub — reconnu a la presence du choix « Appeler Molly ».
let auHub = false;
for (let i = 0; i < 60 && !auHub; i++) {
  await derouler(page);
  if (await dansLeReseau(page)) {
    await plongerAuHasard(page, { coups: 6 });
    continue;
  }
  const boutons = page.locator('.dlg__bouton:not([disabled])');
  if ((await boutons.count()) === 0) break;
  auHub = (await boutons.filter({ hasText: 'Appeler Molly' }).count()) > 0;
  if (!auHub) await boutons.first().click();
  await page.waitForTimeout(120);
}
if (!auHub) {
  console.error('hub jamais atteint');
  await navigateur.close();
  process.exit(1);
}
console.log('hub atteint');

for (const [motif, capture] of ITINERAIRE) {
  await derouler(page);
  await passerEntracte(page);
  if (await dansLeReseau(page)) break;
  const cible = page.locator('.dlg__bouton:not([disabled])').filter({ hasText: motif });
  if ((await cible.count()) === 0) {
    const vus = await page.locator('.dlg__bouton').allTextContents();
    console.error(`choix introuvable ${motif} — visibles : ${JSON.stringify(vus)}`);
    await navigateur.close();
    process.exit(1);
  }
  await cible.first().click();
  await page.waitForTimeout(200);
  await derouler(page);
  if (capture) await capturer(capture);
  console.log(`  pris ${motif}`);
}

// La percee : la seule plongee obligatoire de la partie.
await derouler(page);
if (await dansLeReseau(page)) {
  const bilan = await plongerAuHasard(page, { coups: 16 });
  console.log(`  percee : ${bilan.replace(/\s+/g, ' ').slice(0, 90)}`);
}

// Le coeur, puis une fin.
await derouler(page);
await capturer('coeur');
for (let i = 0; i < 12; i++) {
  await derouler(page);
  await passerEntracte(page);
  if ((await page.locator('.fin').count()) > 0) break;
  const boutons = page.locator('.dlg__bouton:not([disabled])');
  if ((await boutons.count()) === 0) break;
  await boutons.first().click();
  await page.waitForTimeout(150);
}
await derouler(page);

if ((await page.locator('.fin').count()) === 0) {
  console.error('aucune fin atteinte au bout de l\'acte III');
  verifier(erreurs);
  await navigateur.close();
  process.exit(1);
}
const nom = ((await page.locator('.fin__nom').textContent()) ?? '').trim();
await capturer('fin');
console.log(`acte III joue jusqu'au bout — fin : ${nom}`);
verifier(erreurs);
await navigateur.close();
