export type TypeNoeud =
  | 'relais'
  | 'bdd'
  | 'glace'
  | 'glace_noire'
  | 'leurre'
  | 'sanctuaire'
  | 'coeur';

export type TypeButin = 'credits' | 'plans' | 'scripts' | 'infos';

export interface Butin {
  type: TypeButin;
  /** Identifiant du plan, du script ou de l'info. Vide pour les credits. */
  id: string;
  /** Solde du portefeuille avant vol. 0 pour les autres types. */
  solde: number;
}

export interface Noeud {
  id: string;
  type: TypeNoeud;
  couche: number;
  x: number;
  y: number;
  /** Rang de la glace. 0 pour tout autre type. */
  rang: number;
  butin: Butin | null;
  voisins: string[];
  /** Visible sur la carte : le noeud courant et ses voisins directs. */
  repere: boolean;
  /** Glace cassee, ou BDD deja videe. */
  franchi: boolean;
}

export interface Graphe {
  pointAcces: string;
  graine: string;
  entree: string;
  noeuds: Record<string, Noeud>;
}

export type StatutSession = 'en_cours' | 'deconnecte' | 'ejecte' | 'flatline';

/**
 * Une entree de journal ne porte pas de texte : le code et ses valeurs sont
 * traduits a l'affichage depuis data/journal.json. Le moteur ne doit contenir
 * aucune chaine jouee.
 */
export interface Evenement {
  code: string;
  valeurs: Record<string, string | number>;
}

export interface EtatSession {
  graphe: Graphe;
  position: string;
  /** Competence de hacking figee au branchement, implants compris. */
  competence: number;
  /**
   * Plafond de trace de cette plongee : au-dela, la glace noire riposte.
   * Dans l'etat et non dans data/ parce qu'un implant le repousse.
   */
  traceMax: number;
  /** Ticks par cycle consomme. Repousse par la bande passante. */
  cyclesParTicks: number;
  /** Frappes de glace noire encore absorbables. */
  filtres: number;
  trace: number;
  integrite: number;
  ticks: number;
  /** Script -> nombre de ticks avant reutilisation. */
  recharges: Record<string, number>;
  /** Ticks pendant lesquels la trace ne monte plus. */
  traceGelee: number;
  sac: Butin[];
  statut: StatutSession;
  journal: Evenement[];
}
