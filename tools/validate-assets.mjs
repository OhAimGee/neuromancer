#!/usr/bin/env node
// Verifie que chaque tilemap ne cite que des tuiles existantes et que ses
// rangees sont rectangulaires.
//
// Sans cela, une tuile renommee dans un generateur Lua ne se voit qu'a
// l'execution, sous la forme d'un decor vide et d'une exception dans la console.

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..');
const TILEMAPS = path.join(RACINE, 'public/assets/tilemaps');
const TILESETS = path.join(RACINE, 'public/assets/tilesets');

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

if (erreurs.length > 0) {
  console.error(erreurs.map((e) => `  ${e}`).join('\n'));
  process.exit(1);
}
console.log(`assets : ${fichiers.length} tilemap(s) coherente(s)`);
