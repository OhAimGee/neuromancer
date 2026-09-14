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
  'ending', 'hub', 'horloge', 'entracte', 'glose',
]);
// La boite de dialogue montre UNE replique a la fois, en bas de l'ecran, et ne
// defile pas : au-dela de cette longueur le texte deborde du cadre et devient
// invisible. Mesure : 4 lignes de Jersey 10 dans la boite etroite (celle qui
// porte un portrait) tiennent un peu plus de 200 signes ; 180 garde une marge
// pour les mots longs, qui passent a la ligne sans se couper.
const MAX_SIGNES = 180;
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

    // Longueur du texte reellement affiche : marqueur de choix, condition et
    // tags retires, puisque rien de tout cela n'arrive dans la boite.
    const affiche = (debutTags === -1 ? sansCommentaire : sansCommentaire.slice(0, debutTags))
      .replace(/^\s*[*+][*+\s]*/, '')
      .replace(/^\s*-(?!>)\s*/, '')
      .replace(/^\s*\{[^}]*\}\s*/, '')
      .trim();
    const directive = /^(===|->|VAR\b|CONST\b|LIST\b|EXTERNAL\b|INCLUDE\b|~|\{|\}|=)/.test(affiche);
    if (!directive && affiche.length > MAX_SIGNES) {
      erreurs.push(
        `${ou} : replique de ${affiche.length} signes (max ${MAX_SIGNES}) — ` +
        `elle deborderait de la boite de dialogue. La couper en deux repliques.`,
      );
    }

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
// Erreur et non avertissement depuis le lot J : la tranche narrative est
// ecrite, donc une info pillable que rien ne lit est un butin mort, pas un
// chantier en cours.
const infosMortes = hacking.infos.filter((id) => !infosLues.has(id));
if (infosMortes.length > 0) {
  erreurs.push(
    `dette narrative : ${infosMortes.length}/${hacking.infos.length} infos pillables ne sont ` +
    `lues par aucun knows() dans content/ink — ${infosMortes.join(', ')}`,
  );
}

// Meme regle pour les plans. Un plan volable qu'aucun atelier ne sait poser est
// exactement le meme butin mort qu'une info que personne ne lit, et c'est la
// forme qu'avait le jeu jusqu'au lot des implants : six plans pillables, aucune
// paillasse pour les monter.
const plansPosables = new Set(
  [...sourcesInk.matchAll(/a_plan\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]),
);
const plansMorts = hacking.plans.filter((id) => !plansPosables.has(id));
if (plansMorts.length > 0) {
  erreurs.push(
    `dette narrative : ${plansMorts.length}/${hacking.plans.length} plans pillables ne sont ` +
    `poses par aucun a_plan() dans content/ink — ${plansMorts.join(', ')}`,
  );
}

// Et l'inverse : un implant decrit dans data/implants.json que rien ne pose est
// une ligne d'equilibrage qui ne s'applique jamais.
const implantsData = JSON.parse(
  fs.readFileSync(path.join(RACINE, 'data/implants.json'), 'utf-8'),
);
const implantsPoses = new Set(
  [...sourcesInk.matchAll(/poser_implant\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]),
);
const implantsOrphelins = implantsData.implants
  .map((i) => i.id)
  .filter((id) => !implantsPoses.has(id));
if (implantsOrphelins.length > 0) {
  erreurs.push(
    `implants jamais poses par le recit : ${implantsOrphelins.join(', ')}`,
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

// Le fuzzing rejoue la boucle complete, plongees comprises.
//
// Sans cela une partie s'arreterait au premier `~ plonger(...)` : le recit rend
// la main au jeu, et un harnais qui ne la reprend pas ne verrait jamais ni le
// hub ni les fins. Ce petit modele double donc volontairement le moteur —
// c'est le prix a payer pour que « aucune fin n'est inatteignable » veuille
// dire quelque chose.
const KNOT_FLATLINE = 'fin_flatline_reseau';

// Le marcheur prefere ce qu'il a le moins pris.
//
// Un tirage uniforme ne suffit pas des que le recit a de la profondeur : pour
// atteindre l'acte III il faut enchainer quatre bons choix parmi cinq a sept,
// soit environ une chance sur cinq cents par passage au hub. Mesure sur cette
// version : 10 parties sur 500 y arrivaient, et trois fins etaient declarees
// inatteignables alors qu'elles etaient simplement improbables — exactement le
// faux positif qui apprend a ignorer un validateur.
//
// On compte donc les choix deja pris, par signature de palette, et on prend le
// moins visite. Les conditions (knows, crew_present, parties) restent tirees au
// sort a chaque partie : c'est la variete des ETATS qui doit venir du hasard,
// pas celle des CHEMINS.
// Le hasard du fuzzing est ENSEMENCE.
//
// Il ne l'etait pas, et le validateur passait au vert une fois sur trois sans
// qu'une ligne du recit ait bouge. Un controle intermittent ne dit plus rien :
// il apprend a relancer jusqu'a ce que ça passe. Avec une graine fixe, un echec
// est reproductible et un succes veut dire quelque chose. `--graine=N` permet
// de balayer d'autres tirages a la main quand on soupconne un coup de chance.
const GRAINE = Number(
  process.argv.find((a) => a.startsWith('--graine='))?.slice(9) ?? 20260914,
);

function alea(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dé = alea(GRAINE);

const choixVus = new Map();

function choisirNouveau(story) {
  const choix = story.currentChoices;
  const palette = choix.map((c) => c.text).join('|');
  let meilleur = 0;
  let minimum = Infinity;
  for (let i = 0; i < choix.length; i++) {
    const cle = `${palette}#${i}`;
    const vu = choixVus.get(cle) ?? 0;
    // Le bruit departage les ex aequo : sans lui, le marcheur reprendrait
    // toujours le meme chemin dans le meme ordre et n'explorerait qu'un peigne.
    const score = vu + dé() * 0.5;
    if (score < minimum) {
      minimum = score;
      meilleur = i;
    }
  }
  choixVus.set(`${palette}#${meilleur}`, (choixVus.get(`${palette}#${meilleur}`) ?? 0) + 1);
  return meilleur;
}

// Une plongee sur cinq se termine en flatline. Un tirage a 20 % tuait quatre
// parties sur cinq avant l'acte III ; un compteur donne la meme couverture de
// la fin `flatline` sans etouffer tout ce qui vient apres.
let plongees = 0;
const PLONGEES_PAR_FLATLINE = 5;

// Parties rejouees par fin manquante, portes ouvertes. Voir la seconde passe.
//
// 2500 et non 300 : atteindre la fin BLACKOUT demande treize bons choix
// d'affilee, dont plusieurs parmi sept. Le marcheur balaye l'arbre au lieu de
// le tirer au sort, mais un arbre de cette profondeur reste large. Mesure :
// 7,6 s pour l'ensemble du validateur.
const ESSAIS_PERMISSIFS = 2500;

function jouerUnePartie(permissif = false) {
  const story = new Story(json);
  story.allowExternalFunctionFallbacks = true;

  // Les connaissances sont tirees UNE FOIS par partie : un knows() qui repond
  // oui puis non dans la meme partie decrirait un joueur impossible.
  const su = new Map();
  const lier = (nom, fn) => story.BindExternalFunction(nom, fn, false);
  lier('knows', (id) => {
    if (permissif) return true;
    const cle = String(id);
    if (!su.has(cle)) su.set(cle, dé() < 0.5);
    return su.get(cle);
  });
  lier('skill', () => (permissif ? 3 : 1 + Math.floor(dé() * 3)));
  lier('has_implant', () => (permissif ? true : dé() < 0.3));
  // Tire une fois par partie, comme les connaissances : un plan qu'on a puis
  // qu'on n'a plus ne decrirait aucun joueur. C'est ce qui fait entrer
  // l'atelier du Finn dans la passe aleatoire — sans lui, les six choix de
  // pose ne seraient jamais joues.
  const plans = new Map();
  lier('a_plan', (id) => {
    if (permissif) return true;
    const cle = String(id);
    if (!plans.has(cle)) plans.set(cle, dé() < 0.4);
    return plans.get(cle);
  });
  lier('poser_implant', () => 0);
  lier('crew_present', () => (permissif ? true : dé() < 0.3));
  lier('learn', () => 0);
  lier('resolve_scene', () => 0);
  lier('boost_competence', () => 0);
  lier('acquerir_script', () => 0);
  // Le compte de parties est tire au sort : la fin secrete l'exige, et un
  // harnais qui repondrait toujours zero la declarerait inatteignable.
  lier('parties', () => (permissif ? 5 : Math.floor(dé() * 6)));

  let retourDePlongee = null;
  lier('plonger', (_point, retour) => {
    retourDePlongee = String(retour);
    return 0;
  });

  let garde = 0;
  while (garde++ < 2000) {
    while (story.canContinue) {
      story.Continue();
      etapes++;
      for (const tag of story.currentTags ?? []) {
        if (tag.startsWith('ending:')) finsAtteintes.add(tag.slice(7).trim());
      }
    }
    if (story.currentChoices.length > 0) {
      story.ChooseChoiceIndex(choisirNouveau(story));
      continue;
    }
    if (retourDePlongee === null) break;

    const retour = retourDePlongee;
    retourDePlongee = null;
    if (!permissif && ++plongees % PLONGEES_PAR_FLATLINE === 0) {
      story.ChoosePathString(KNOT_FLATLINE);
      continue;
    }
    // Une plongee consomme des cycles : sans cela l'horloge ne tomberait jamais
    // a zero et la fin par la toxine serait declaree inatteignable a tort.
    const reste = Number(story.variablesState['cycles_restants']);
    story.variablesState['cycles_restants'] = Math.max(0, reste - 1 - Math.floor(dé() * 2));
    story.ChoosePathString(retour);
  }
}

if (json) {
  for (let partie = 0; partie < PARTIES; partie++) {
    try {
      jouerUnePartie();
    } catch (e) {
      plantages++;
      premierPlantage ??= e instanceof Error ? e.message : String(e);
    }
  }

  // Seconde passe : l'atteignabilite, et rien d'autre.
  //
  // La premiere passe cherche des plantages, et pour cela ses conditions
  // doivent etre tirees au sort — un joueur qui sait tout ne visite jamais les
  // branches du joueur qui ne sait rien. Mais avec des conditions aleatoires,
  // « fin jamais atteinte » finit par vouloir dire « fin improbable », ce qui
  // n'est pas la question posee. On rejoue donc les fins manquantes avec toutes
  // les portes ouvertes : si une fin reste hors d'atteinte ici, elle est
  // vraiment inatteignable, et c'est un defaut d'ecriture.
  for (const id of finsDeclarees.keys()) {
    // Le compteur de choix repart de zero pour chaque fin manquante : garder
    // celui de la premiere passe ferait commencer l'exploration a mi-chemin
    // d'un peigne deja parcouru, et une fin profonde n'aurait pas le temps
    // d'etre atteinte dans son budget d'essais.
    if (!finsAtteintes.has(id)) choixVus.clear();
    for (let essai = 0; essai < ESSAIS_PERMISSIFS && !finsAtteintes.has(id); essai++) {
      try {
        jouerUnePartie(true);
      } catch (e) {
        plantages++;
        premierPlantage ??= e instanceof Error ? e.message : String(e);
      }
    }
  }
}

if (plantages > 0) {
  erreurs.push(`${plantages}/${PARTIES} parties aleatoires ont plante — premiere : ${premierPlantage}`);
}
for (const [id, ou] of finsDeclarees) {
  if (!finsAtteintes.has(id)) {
    erreurs.push(
      `fin '${id}' (${ou}) jamais atteinte : ni en ${PARTIES} parties aleatoires, ` +
      `ni en ${ESSAIS_PERMISSIFS} parties toutes portes ouvertes — elle est inatteignable`,
    );
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
  `${C.green}narratif${C.reset} ${PARTIES} parties aleatoires + rattrapage permissif, ` +
  `${etapes} lignes jouees, 0 plantage ${C.dim}(${resume})${C.reset}`,
);
