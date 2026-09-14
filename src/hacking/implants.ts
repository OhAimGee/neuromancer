import donnees from '@data/implants.json';

export interface EffetImplant {
  /** Ajoute a la competence de hacking, le temps d'une plongee. */
  competence?: number;
  /** Repousse le plafond de trace au-dela duquel la glace noire riposte. */
  traceMax?: number;
  /** Ticks par cycle consomme : plus il est haut, moins la plongee coute. */
  cyclesParTicks?: number;
  /** Frappes de glace noire absorbees, une par filtre. */
  filtres?: number;
}

export interface Implant {
  id: string;
  nom: string;
  resume: string;
  coutCredits: number;
  coutCycles: number;
  coutHumanite: number;
  effet: EffetImplant;
}

export const IMPLANTS: Implant[] = donnees.implants;

export function implant(id: string): Implant | null {
  return IMPLANTS.find((i) => i.id === id) ?? null;
}

/**
 * Somme des effets des implants poses.
 *
 * Deux implants qui touchent au meme levier s'additionnent : rien n'interdit
 * de les cumuler, et le plafonnement est deja dans le prix — trois implants
 * coutent plus d'humanite que Sable n'en a.
 */
export function effetsCumules(ids: readonly string[]): Required<EffetImplant> {
  const total = { competence: 0, traceMax: 0, cyclesParTicks: 0, filtres: 0 };
  for (const id of ids) {
    const e = implant(id)?.effet;
    if (!e) continue;
    total.competence += e.competence ?? 0;
    total.traceMax += e.traceMax ?? 0;
    total.cyclesParTicks += e.cyclesParTicks ?? 0;
    total.filtres += e.filtres ?? 0;
  }
  return total;
}
