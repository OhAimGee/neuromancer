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
}

export function parseTagsLigne(tags: readonly string[]): MiseEnScene {
  const mes: MiseEnScene = {
    locuteur: null,
    portrait: null,
    expression: null,
    decor: null,
    musique: null,
    sfx: null,
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
