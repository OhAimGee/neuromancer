import donnees from '@data/hacking.json';
import { alea, entier, tirage } from './alea';
import type { Butin, Graphe, Noeud, TypeButin, TypeNoeud } from './types';

const LARGEUR = 320;
const HAUTEUR = 180;
const MARGE_X = 28;
const MARGE_Y = 26;

export interface PointAcces {
  id: string;
  nom: string;
  profondeur: number;
  richesse: number;
  danger: number;
}

export const POINTS_ACCES: PointAcces[] = donnees.pointsAcces;

export function pointAcces(id: string): PointAcces {
  const p = POINTS_ACCES.find((x) => x.id === id);
  if (!p) throw new Error(`Point d'acces inconnu : ${id}`);
  return p;
}

/**
 * Poids des types de noeud selon la profondeur et le danger de la region.
 * La glace noire n'apparait que loin d'un jack de quartier : elle tue.
 */
function poidsTypes(couche: number, danger: number): [TypeNoeud[], number[]] {
  const types: TypeNoeud[] = ['relais', 'bdd', 'glace', 'leurre', 'glace_noire'];
  const poids = [
    Math.max(1, 5 - couche),
    3 + Math.min(3, couche),
    1 + couche,
    couche >= 2 ? 1 + danger : 0,
    couche >= 3 && danger >= 2 ? danger : 0,
  ];
  return [types, poids];
}

function rangGlace(couche: number, danger: number, noire: boolean): number {
  return Math.min(5, 1 + Math.floor((couche - 1) / 2) + danger + (noire ? 1 : 0));
}

/**
 * Tire le butin d'une base de donnees.
 *
 * `deja` garantit qu'une meme plongee ne propose pas deux fois le meme plan ou
 * la meme info : reperer un doublon dans un butin donne l'impression d'un
 * generateur qui tourne a vide.
 */
function tirerButin(
  hasard: () => number,
  couche: number,
  richesse: number,
  deja: Set<string>,
): Butin {
  const poids = (['credits', 'plans', 'scripts', 'infos'] as TypeButin[]).map(
    (t) => donnees.poidsButin[t][Math.min(couche, donnees.poidsButin[t].length - 1)] ?? 0,
  );
  const type = tirage(hasard, ['credits', 'plans', 'scripts', 'infos'] as TypeButin[], poids);

  if (type === 'credits') {
    const { base, parProfondeur, parRichesse } = donnees.portefeuilles;
    const brut = base + parProfondeur * couche + parRichesse * richesse;
    return { type, id: '', solde: Math.round((brut * (0.75 + hasard() * 0.5)) / 10) * 10 };
  }

  const listes: Record<Exclude<TypeButin, 'credits'>, string[]> = {
    plans: donnees.plans,
    scripts: donnees.scriptsButin,
    infos: donnees.infos,
  };
  const restants = listes[type].filter((id) => !deja.has(id));
  // Table epuisee : la BDD ne contenait qu'un portefeuille de plus.
  if (restants.length === 0) {
    const { base, parProfondeur } = donnees.portefeuilles;
    return { type: 'credits', id: '', solde: base + parProfondeur * couche };
  }
  const id = restants[entier(hasard, restants.length)] as string;
  deja.add(id);
  return { type, id, solde: 0 };
}

/**
 * Engendre le reseau atteignable depuis un jack physique.
 *
 * La topologie est un arbre plus quelques raccourcis lateraux. L'arbre est
 * volontaire : une glace n'est un mur que si elle est le seul passage vers ce
 * qu'elle protege. Les raccourcis rendent parfois un contournement possible —
 * c'est la le jeu.
 */
export function genererGraphe(idPointAcces: string, graine: string): Graphe {
  const p = pointAcces(idPointAcces);
  const hasard = alea(`${idPointAcces}:${graine}`);
  const noeuds: Record<string, Noeud> = {};
  const deja = new Set<string>();
  let sanctuairePose = false;

  const pas = (LARGEUR - 2 * MARGE_X) / Math.max(1, p.profondeur);
  const entree = 'n0';
  noeuds[entree] = {
    id: entree, type: 'relais', couche: 0,
    x: MARGE_X, y: HAUTEUR / 2, rang: 0, butin: null,
    voisins: [], repere: true, franchi: true,
  };

  let couchePrecedente = [entree];
  let compteur = 1;

  for (let couche = 1; couche <= p.profondeur; couche++) {
    const enfants: string[] = [];

    for (const parent of couchePrecedente) {
      const n = 1 + (enfants.length < 4 && hasard() < 0.55 ? 1 : 0);
      for (let k = 0; k < n && enfants.length < 4; k++) {
        const id = `n${compteur++}`;
        const dernier = couche === p.profondeur;

        let type: TypeNoeud;
        if (dernier && enfants.length === 0) {
          type = 'coeur';
        } else if (!sanctuairePose && couche >= 2 && couche < p.profondeur && hasard() < 0.25) {
          type = 'sanctuaire';
          sanctuairePose = true;
        } else {
          const [types, poids] = poidsTypes(couche, p.danger);
          type = tirage(hasard, types, poids);
        }

        noeuds[id] = {
          id, type, couche,
          x: Math.round(MARGE_X + couche * pas),
          y: 0,
          rang:
            type === 'glace' || type === 'glace_noire'
              ? rangGlace(couche, p.danger, type === 'glace_noire')
              : 0,
          butin: type === 'bdd' || type === 'coeur'
            ? tirerButin(hasard, couche, p.richesse, deja)
            : type === 'leurre'
              // Un leurre doit ressembler a une BDD jusqu'a ce qu'on y entre.
              ? tirerButin(hasard, couche, p.richesse, new Set())
              : null,
          voisins: [],
          repere: false,
          // franchi couvre deux etats distincts selon le type : une glace
          // percee, une BDD videe, un leurre declenche. Aucun n'est vrai au
          // depart — marquer les BDD comme franchies a la generation les
          // rendait impillables.
          franchi: false,
        };
        noeuds[parent]?.voisins.push(id);
        enfants.push(id);
      }
    }

    // Raccourci lateral : sans lui l'arbre n'offre jamais de contournement.
    if (enfants.length >= 2 && hasard() < 0.4) {
      const a = enfants[entier(hasard, enfants.length)] as string;
      const b = enfants[entier(hasard, enfants.length)] as string;
      if (a !== b && !noeuds[a]?.voisins.includes(b)) noeuds[a]?.voisins.push(b);
    }

    const pasY = (HAUTEUR - 2 * MARGE_Y) / Math.max(1, enfants.length - 1);
    enfants.forEach((id, i) => {
      const n = noeuds[id];
      if (!n) return;
      n.y = enfants.length === 1 ? HAUTEUR / 2 : Math.round(MARGE_Y + i * pasY);
    });

    couchePrecedente = enfants;
  }

  // Les aretes sont parcourables dans les deux sens : on doit pouvoir refluer
  // vers un sanctuaire quand la trace monte.
  for (const n of Object.values(noeuds)) {
    for (const v of n.voisins) {
      const voisin = noeuds[v];
      if (voisin && !voisin.voisins.includes(n.id)) voisin.voisins.push(n.id);
    }
  }

  for (const v of noeuds[entree]?.voisins ?? []) {
    const n = noeuds[v];
    if (n) n.repere = true;
  }

  return { pointAcces: idPointAcces, graine, entree, noeuds };
}
