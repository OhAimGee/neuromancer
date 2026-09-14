#!/usr/bin/env node
// Verifie la trame narrative avant commit.
//
//   npm run validate:narrative
//
// Deux passes. La passe STATIQUE relit les sources .ink : elle attrape les
// fautes qu'aucune execution ne revelerait — un tag mal orthographie est
// simplement ignore par le moteur, et un cout affiche qui ne correspond pas a
// l'arithmetique Ink ment au joueur sans jamais planter.
// La passe DYNAMIQUE joue la trame au hasard : elle attrape les plantages
// d'execution et les fins devenues inatteignables.

import fs from 'node:fs';
import path from 'node:path';
import { Story } from 'inkjs';
import { compileInk } from './compile-ink.mjs';

const RACINE = path.resolve(import.meta.dirname, '..');
const INK = path.join(RACINE, 'content/ink');
const PARTIES = 500;

const C = { reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m' };

const erreurs = [];
const avertissements = [];

// Le vocabulaire fait foi : tout tag hors de cette liste est une faute de
// frappe, car Ink accepte n'importe quel tag et le moteur l'ignore en silence.
const TAGS_CONNUS = new Set([
  'etq', 'cout_credits', 'cout_cycles', 'cout_humanite',
  'bg', 'musique', 'sfx', 'speaker', 'portrait',
  'ending', 'hub', 'horloge',
]);
const ETIQUETTES = new Set(['MENSONGE', 'MENACE', 'CONNAISSANCE', 'FRAGMENT', 'IMPLANT', 'ACTION']);
// Tag de cout -> variable Ink que le corps du choix doit reellement decrementer.
const VARIABLE_DU_COUT = {
  cout_credits: 'credits',
  cout_cycles: 'cycles_restants',
  cout_humanite: 'humanite',
};

function fichiersInk(dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dossier, e.name);
    return e.isDirectory() ? fichiersInk(p) : e.name.endsWith('.ink') ? [p] : [];
  });
}

// --- Passe statique --------------------------------------------------------

const finsDeclarees = new Map();

for (const fichier of fichiersInk(INK)) {
  const rel = path.relative(RACINE, fichier);
  const lignes = fs.readFileSync(fichier, 'utf-8').split('\n');

  lignes.forEach((ligne, i) => {
    const ou = `${rel}:${i + 1}`;
    const sansCommentaire = ligne.replace(/\/\/.*$/, '');
    const choix = /^(\s*)([*+][*+\s]*)(.*)$/.exec(sansCommentaire);

    if (choix && choix[3].includes('[')) {
      erreurs.push(`${ou} : choix avec crochets — choice.tags reviendra vide (voir CLAUDE.md)`);
    }

    const debutTags = sansCommentaire.indexOf('#');
    const zoneTags = debutTags === -1 ? '' : sansCommentaire.slice(debutTags);

    for (const tag of zoneTags.split('#').map((t) => t.trim()).filter(Boolean)) {
      const cle = tag.split(':')[0].trim();
      if (!TAGS_CONNUS.has(cle)) {
        erreurs.push(`${ou} : tag inconnu '${cle}' — le moteur l'ignorera en silence`);
        continue;
      }
      const valeur = tag.slice(cle.length + 1).trim();
      if (cle === 'etq' && !ETIQUETTES.has(valeur)) {
        erreurs.push(`${ou} : etiquette inconnue '${valeur}'`);
      }
      if (cle.startsWith('cout_') && !/^-?\d+$/.test(valeur)) {
        erreurs.push(`${ou} : cout '${cle}' non entier ('${valeur}')`);
      }
      if (cle === 'ending') finsDeclarees.set(valeur, ou);

      // Le cout affiche doit correspondre a l'arithmetique du corps du choix.
      // Sinon l'interface annonce un prix que le recit ne prelevera pas.
      if (choix && cle in VARIABLE_DU_COUT) {
        const variable = VARIABLE_DU_COUT[cle];
        const indentation = choix[1].length;
        const attendu = new RegExp(`~\\s*${variable}\\s*-=\\s*${valeur}\\b`);
        let trouve = false;
        for (let j = i + 1; j < lignes.length; j++) {
          const suivante = lignes[j];
          if (suivante.trim() === '') continue;
          if (suivante.search(/\S/) <= indentation) break;
          if (attendu.test(suivante)) { trouve = true; break; }
        }
        if (!trouve) {
          erreurs.push(
            `${ou} : le choix annonce ${cle}:${valeur} mais son corps ne contient pas ` +
            `'~ ${variable} -= ${valeur}' — le joueur paierait un prix different de celui affiche`,
          );
        }
      }
    }
  });
}

// --- Les EXTERNAL declares doivent etre lies par le moteur -----------------

const globals = fs.readFileSync(path.join(INK, 'shared/globals.ink'), 'utf-8');
const moteur = fs.readFileSync(path.join(RACINE, 'src/dialogue/moteur.ts'), 'utf-8');
for (const [, nom] of globals.matchAll(/^EXTERNAL\s+(\w+)\s*\(/gm)) {
  if (!new RegExp(`lier\\('${nom}'`).test(moteur)) {
    erreurs.push(`EXTERNAL '${nom}' declare dans globals.ink mais jamais lie dans moteur.ts`);
  }
}

// --- Dette narrative : les infos volables doivent finir par etre lues ------
//
// Une info recuperee dans une BDD qu'aucun knows() ne consulte est un butin
// mort : elle alimenterait un inventaire que le recit ignore. C'est le point
// qui separe le hacking d'un mini-jeu decoratif, donc il se surveille.

const hacking = JSON.parse(fs.readFileSync(path.join(RACINE, 'data/hacking.json'), 'utf-8'));
const sourcesInk = fichiersInk(INK).map((f) => fs.readFileSync(f, 'utf-8')).join('\n');
const infosLues = new Set(
  [...sourcesInk.matchAll(/knows\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]),
);
const infosMortes = hacking.infos.filter((id) => !infosLues.has(id));
if (infosMortes.length > 0) {
  avertissements.push(
    `dette narrative : ${infosMortes.length}/${hacking.infos.length} infos pillables ne sont ` +
    `lues par aucun knows() dans content/ink — ${infosMortes.join(', ')}`,
  );
}

// --- Passe dynamique : fuzzing --------------------------------------------

const { json, errors, warnings } = compileInk();
for (const w of warnings) avertissements.push(`compilation : ${w}`);
for (const e of errors) erreurs.push(`compilation : ${e}`);

const finsAtteintes = new Set();
let plantages = 0;
let premierPlantage = null;
let etapes = 0;

if (json) {
  for (let partie = 0; partie < PARTIES; partie++) {
    // Le fuzzing reste ainsi independant du moteur TypeScript.
    const story = new Story(json);
    // Les externals ne sont pas liees ici : Ink doit retomber sur les fonctions
    // de repli de globals.ink, sinon il refuse de jouer.
    story.allowExternalFunctionFallbacks = true;
    try {
      let garde = 0;
      while (garde++ < 2000) {
        while (story.canContinue) {
          story.Continue();
          etapes++;
          for (const tag of story.currentTags ?? []) {
            if (tag.startsWith('ending:')) finsAtteintes.add(tag.slice(7).trim());
          }
        }
        if (story.currentChoices.length === 0) break;
        story.ChooseChoiceIndex(Math.floor(Math.random() * story.currentChoices.length));
      }
    } catch (e) {
      plantages++;
      premierPlantage ??= e instanceof Error ? e.message : String(e);
    }
  }
}

if (plantages > 0) {
  erreurs.push(`${plantages}/${PARTIES} parties aleatoires ont plante — premiere : ${premierPlantage}`);
}
for (const [id, ou] of finsDeclarees) {
  if (!finsAtteintes.has(id)) {
    erreurs.push(`fin '${id}' (${ou}) jamais atteinte en ${PARTIES} parties aleatoires`);
  }
}

// --- Rapport ---------------------------------------------------------------

for (const a of avertissements) console.warn(`${C.yellow}avertissement${C.reset} ${a}`);
if (erreurs.length > 0) {
  for (const e of erreurs) console.error(`${C.red}erreur${C.reset} ${e}`);
  console.error(`${C.red}Validation narrative echouee (${erreurs.length} erreur(s)).${C.reset}`);
  process.exit(1);
}

const resume = finsDeclarees.size === 0
  ? 'aucune fin declaree pour l\'instant'
  : `${finsAtteintes.size}/${finsDeclarees.size} fins atteintes`;
console.log(
  `${C.green}narratif${C.reset} ${PARTIES} parties, ${etapes} lignes jouees, 0 plantage ` +
  `${C.dim}(${resume})${C.reset}`,
);
