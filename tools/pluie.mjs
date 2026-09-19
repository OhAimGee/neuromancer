// Verification de la pluie : on ne verifie pas une image, on verifie un
// mouvement.
//
//   node tools/pluie.mjs
//
// Une capture d'ecran ne dit rien d'une saccade. La suite des positions de
// fond, relevee a chaque trame, la dit exactement — et c'est le seul moyen de
// distinguer « ca bouge » de « ca bouge bien ».
//
// Ce que l'outil exige :
//   - chaque image posee sur un pixel de jeu ENTIER, jamais entre deux ;
//   - un pas de 0 ou 1 pixel par trame, modulo la tuile ;
//   - la pente du deplacement egale a celle dessinee dans `fx.lua`, 1 pour 3.
//
// `steps(16)` est en jump-end : la suite va de 0 a 15 puis revient a 0. Le
// bouclage se lit donc -15, soit bien un pas d'un pixel modulo la tuile.
import { ouvrirJeu } from './lib-jeu.mjs';

const TUILE = 16;
const PENTE = 3;
const DUREE = 6000;

const { navigateur, page } = await ouvrirJeu({ vitesseTexte: 0 });
// La pluie n'existe que sur les decors qui la declarent ; l'ecran-titre en est
// un, et c'est le seul qu'on atteint sans jouer une partie.
await page.reload();
await page.waitForSelector('.boot');
await page.keyboard.press('Space');
await page.waitForSelector('.pluie');

const echelle = await page.evaluate(() =>
  Number(getComputedStyle(document.querySelector('.viewport')).getPropertyValue('--s')),
);

const suite = await page.evaluate(async (duree) => {
  const el = document.querySelector('.pluie');
  const releves = [];
  const t0 = performance.now();
  while (performance.now() - t0 < duree) {
    const s = getComputedStyle(el);
    releves.push([s.backgroundPositionX, s.backgroundPositionY, performance.now() - t0]);
    await new Promise((r) => requestAnimationFrame(r));
  }
  return releves;
}, DUREE);

await navigateur.close();

const px = (v) => Number.parseFloat(v) / echelle;
const trames = suite.slice(1).map((r, i) => r[2] - suite[i][2]);
const mediane = [...trames].sort((a, b) => a - b)[Math.floor(trames.length / 2)];

const fautes = [];
const pas = { x: new Map(), y: new Map() };
let avant = null;
let totalX = 0;
let totalY = 0;

for (const [bx, by, t] of suite) {
  const x = px(bx);
  const y = px(by);
  for (const [nom, v] of [['x', x], ['y', y]]) {
    if (!Number.isInteger(v)) fautes.push(`${nom} pose a ${v} px de jeu — entre deux pixels`);
  }
  if (avant) {
    // Les positions x descendent et les y montent : on ramene les deux au meme
    // sens avant de comparer.
    const dx = (((avant.x - x) % TUILE) + TUILE) % TUILE;
    const dy = (((y - avant.y) % TUILE) + TUILE) % TUILE;
    totalX += dx;
    totalY += dy;
    // Un pas de 2 sur une trame deux fois trop longue est une trame perdue par
    // le navigateur, pas un defaut de l'animation.
    const tolere = Math.max(1, Math.round((t - avant.t) / mediane));
    for (const [nom, d] of [['x', dx], ['y', dy]]) {
      pas[nom].set(d, (pas[nom].get(d) ?? 0) + 1);
      if (d > tolere) fautes.push(`${nom} : ${d} px en une trame de ${(t - avant.t).toFixed(1)} ms`);
    }
  }
  avant = { x, y, t };
}

const duree = suite.at(-1)[2] / 1000;
const pente = totalY / totalX;
console.log(`pluie : ${suite.length} images, trame mediane ${mediane.toFixed(1)} ms`);
for (const axe of ['x', 'y']) {
  const detail = [...pas[axe]]
    .sort((a, b) => a[0] - b[0])
    .map(([d, n]) => `${d}px×${n}`)
    .join(' ');
  console.log(`  ${axe} : ${detail}`);
}
console.log(
  `  ${(totalY / duree).toFixed(1)} px/s de chute · ` +
    `${(totalX / duree).toFixed(1)} px/s de derive · pente 1 pour ${pente.toFixed(2)}`,
);

if (Math.abs(pente - PENTE) > 0.15) {
  fautes.push(`pente de ${pente.toFixed(2)} au lieu de ${PENTE} — la pluie ne suit plus ses gouttes`);
}
if (fautes.length > 0) {
  console.error([...new Set(fautes)].slice(0, 8).join('\n'));
  process.exit(1);
}
console.log('  aucun pas hors du pixel, aucun saut, pente conforme au dessin');
