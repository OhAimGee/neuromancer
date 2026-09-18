#!/usr/bin/env node
// Verifie que chaque tilemap ne cite que des tuiles existantes, que ses rangees
// sont rectangulaires, et que chaque decor de data/decors.json designe quelque
// chose qui existe.
//
// Sans cela, une tuile renommee dans un generateur Lua ne se voit qu'a
// l'execution, sous la forme d'un decor vide et d'une exception dans la console.
// Un plan de parallaxe renomme est pire encore : Assets.load echoue, la scene
// reste noire, et rien ne distingue cette panne d'une scene volontairement sans
// decor.

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..');
const TILEMAPS = path.join(RACINE, 'public/assets/tilemaps');
const TILESETS = path.join(RACINE, 'public/assets/tilesets');
const PARALLAX = path.join(RACINE, 'public/assets/parallax');

const erreurs = [];
const lire = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

const fichiers = fs.existsSync(TILEMAPS)
  ? fs.readdirSync(TILEMAPS).filter((f) => f.endsWith('.json'))
  : [];

for (const fichier of fichiers) {
  const id = fichier.replace(/\.json$/, '');
  const map = lire(path.join(TILEMAPS, fichier));
  const manifeste = path.join(TILESETS, `${map.tileset}.json`);

  if (!fs.existsSync(manifeste)) {
    erreurs.push(`${id} : tileset '${map.tileset}' introuvable`);
    continue;
  }
  const noms = new Set(lire(manifeste).noms);

  for (const [cle, nom] of Object.entries(map.legende)) {
    if (!noms.has(nom)) erreurs.push(`${id} : legende '${cle}' -> tuile inconnue '${nom}'`);
  }

  const largeur = map.lignes[0]?.length ?? 0;
  map.lignes.forEach((ligne, y) => {
    if (ligne.length !== largeur) {
      erreurs.push(`${id} : rangee ${y} fait ${ligne.length} colonnes au lieu de ${largeur}`);
    }
    for (const cle of new Set(ligne)) {
      if (cle !== ' ' && !(cle in map.legende)) {
        erreurs.push(`${id} : rangee ${y} utilise '${cle}', absent de la legende`);
      }
    }
  });

  const inutilisees = Object.keys(map.legende).filter((c) => !map.lignes.some((l) => l.includes(c)));
  if (inutilisees.length > 0) {
    console.warn(`  ${id} : legende inutilisee -> ${inutilisees.join(', ')}`);
  }
}

// Les decors : soit des plans de parallaxe, soit une tilemap, jamais rien.
const decors = lire(path.join(RACINE, 'data/decors.json'));
const idsTilemap = new Set(fichiers.map((f) => f.replace(/\.json$/, '')));
const plansExistants = new Set(
  fs.existsSync(PARALLAX)
    ? fs.readdirSync(PARALLAX).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''))
    : [],
);
let nbDecors = 0;

for (const [id, conf] of Object.entries(decors)) {
  if (id.startsWith('_')) continue;
  nbDecors += 1;

  const plans = conf.plans ?? [];
  for (const plan of plans) {
    if (!plansExistants.has(plan.image)) {
      erreurs.push(`decor ${id} : plan '${plan.image}' absent de public/assets/parallax/`);
    }
  }
  // Un decor sans plans retombe sur la tilemap du meme nom. 'matrice' est une
  // geometrie construite en code, et 'aucun' est le noir : ni l'un ni l'autre
  // n'a de tilemap.
  if (plans.length === 0 && id !== 'matrice' && id !== 'aucun' && !idsTilemap.has(id)) {
    erreurs.push(`decor ${id} : ni plans de parallaxe ni tilemap du meme nom`);
  }
  for (const halo of conf.halos ?? []) {
    if (!/^0x[0-9a-fA-F]{6}$/.test(String(halo.couleur))) {
      erreurs.push(`decor ${id} : halo de couleur invalide '${halo.couleur}'`);
    }
  }
}

if (erreurs.length > 0) {
  console.error(erreurs.map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}
console.log(`assets : ${fichiers.length} tilemap(s) et ${nbDecors} decor(s) coherent(s)`);
