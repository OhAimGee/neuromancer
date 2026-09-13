/** Etiquette affichee sur un choix de dialogue. Portee par le tag `# etq:X`. */
export type Etiquette =
  | 'MENSONGE'
  | 'MENACE'
  | 'CONNAISSANCE'
  | 'FRAGMENT'
  | 'IMPLANT'
  | 'ACTION';

/** Issue d'une scene de dialogue, calculee depuis confiance et soupcon. */
export type Palier = 'echec' | 'neutre' | 'succes' | 'critique';

/**
 * Ce qui vit dans le crane de Sable. Vide tant que le joueur n'a rien decouvert.
 * Determine la famille de fins accessible.
 */
export type IdentiteFragment =
  | ''
  | 'wintermute'
  | 'neuromancer'
  | 'construct'
  | 'demon_ta'
  | 'rien';

/** Cout associe a un choix, extrait des tags `# cout_*:N`. */
export interface Cout {
  credits: number;
  cycles: number;
  humanite: number;
}

export const COUT_NUL: Cout = { credits: 0, cycles: 0, humanite: 0 };

/** Un choix de dialogue, tel que presente a l'interface. */
export interface ChoixDialogue {
  index: number;
  texte: string;
  etiquette: Etiquette | null;
  cout: Cout;
  abordable: boolean;
}

/** Une ligne jouee, avec ses tags de mise en scene. */
export interface LigneDialogue {
  texte: string;
  locuteur: string | null;
  portrait: string | null;
  expression: string | null;
  /** Vrai si la ligne est la replique que le joueur vient de choisir. */
  replique: boolean;
}
