import type { Cout, Etiquette } from '@/types/jeu';

const ETIQUETTES = new Set<Etiquette>([
  'MENSONGE',
  'MENACE',
  'CONNAISSANCE',
  'FRAGMENT',
  'IMPLANT',
  'ACTION',
]);

/** Decoupe `cle:valeur:valeur2` en segments. */
function segments(tag: string): string[] {
  return tag.split(':').map((s) => s.trim());
}

export interface MiseEnScene {
  locuteur: string | null;
  portrait: string | null;
  expression: string | null;
  decor: string | null;
  musique: string | null;
  sfx: string | null;
  /** Carton plein ecran a lire avant de reprendre (saut dans le temps). */
  entracte: string | null;
  /** Identifiant de la fin atteinte. Non nul = la partie est finie. */
  fin: string | null;
  /** Explication de regle que le recit demande a montrer ici. */
  glose: string | null;
  /**
   * `demarrer` quand le recit vient de poser la toxine. Avant ce signal, le
   * compte a rebours n'existe pas dans la fiction et le HUD ne le montre pas.
   */
  horloge: string | null;
}

export function parseTagsLigne(tags: readonly string[]): MiseEnScene {
  const mes: MiseEnScene = {
    locuteur: null,
    portrait: null,
    expression: null,
    decor: null,
    musique: null,
    sfx: null,
    entracte: null,
    fin: null,
    glose: null,
    horloge: null,
  };

  for (const tag of tags) {
    const [cle, a, b] = segments(tag);
    switch (cle) {
      case 'speaker':
        mes.locuteur = a ?? null;
        break;
      case 'portrait':
        mes.portrait = a ?? null;
        mes.expression = b ?? 'neutre';
        break;
      case 'bg':
        mes.decor = a ?? null;
        break;
      case 'musique':
        mes.musique = a ?? null;
        break;
      case 'sfx':
        mes.sfx = a ?? null;
        break;
      // Le texte d'un entracte contient des espaces : on reprend le tag entier
      // apres la premiere ponctuation plutot que le premier segment.
      case 'entracte':
        mes.entracte = tag.slice(tag.indexOf(':') + 1).trim() || null;
        break;
      case 'ending':
        mes.fin = a ?? null;
        break;
      case 'glose':
        mes.glose = a ?? null;
        break;
      case 'horloge':
        mes.horloge = a ?? null;
        break;
    }
  }
  return mes;
}

export interface MetaChoix {
  etiquette: Etiquette | null;
  cout: Cout;
}

/**
 * Les couts lus ici sont DESCRIPTIFS : ils servent a afficher et a filtrer les
 * choix. L'arithmetique reelle est appliquee par Ink (`~ humanite -= 5`), qui
 * reste la source de verite pendant une scene. Le validateur narratif verifie
 * que les deux concordent.
 */
export function parseTagsChoix(tags: readonly string[]): MetaChoix {
  let etiquette: Etiquette | null = null;
  const cout: Cout = { credits: 0, cycles: 0, humanite: 0 };

  for (const tag of tags) {
    const [cle, valeur] = segments(tag);
    if (cle === 'etq' && valeur && ETIQUETTES.has(valeur as Etiquette)) {
      etiquette = valeur as Etiquette;
      continue;
    }
    const n = Number(valeur);
    if (!Number.isFinite(n)) continue;
    if (cle === 'cout_credits') cout.credits = n;
    else if (cle === 'cout_cycles') cout.cycles = n;
    else if (cle === 'cout_humanite') cout.humanite = n;
  }

  return { etiquette, cout };
}
