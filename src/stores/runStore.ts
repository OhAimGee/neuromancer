import equipage from '@data/equipage.json';
import equilibrage from '@data/equilibrage.json';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { replacer, reviver } from '@/save/serialize';
import type { Cout, IdentiteFragment, Palier } from '@/types/jeu';

export const VERSION_RUN = 1;

/** Horloge de depart. Les sacs de toxine se dissolvent au bout de 12 cycles. */
export const CYCLES_DEPART = equilibrage.run.cyclesDepart;

/** Trois places pour six candidats : c'est la que se joue la rejouabilite. */
export const MEMBRES_MAX = equipage.places;

/**
 * Etat de la partie en cours. Jetable : remis a zero a chaque nouvelle partie.
 * Persiste tout de meme, pour qu'une partie puisse etre reprise apres
 * fermeture de l'onglet.
 */
interface RunEtat {
  cycles: number;
  humanite: number;
  credits: number;
  confiance: number;
  soupcon: number;
  competences: Record<string, number>;
  implants: string[];
  plans: string[];
  scripts: string[];
  equipage: string[];
  drapeaux: Record<string, boolean>;
  issues: Record<string, Palier>;
  fragmentIdentite: IdentiteFragment;
  terminee: boolean;
}

interface RunActions {
  nouvellePartie: () => void;
  competence: (nom: string) => number;
  ameliorerCompetence: (nom: string, n: number) => void;
  aImplant: (id: string) => boolean;
  equipagePresent: (id: string) => boolean;
  peutPayer: (cout: Cout) => boolean;
  payer: (cout: Cout) => boolean;
  reinitJauges: () => void;
  ajusterJauges: (confiance: number, soupcon: number) => void;
  enregistrerIssue: (scene: string, palier: Palier) => void;
  consommerCycles: (n: number) => void;
  recruter: (id: string) => void;
  /** Places d'equipage encore libres. Lu par le recit avant de proposer. */
  placesLibres: () => number;
  gagnerCredits: (n: number) => void;
  acquerir: (categorie: 'plans' | 'scripts' | 'implants', id: string) => void;
  terminer: () => void;
}

const ETAT_INITIAL: RunEtat = {
  cycles: CYCLES_DEPART,
  humanite: equilibrage.run.humaniteDepart,
  credits: 0,
  confiance: 0,
  soupcon: 0,
  competences: { hacking: 1, social: 1, combat: 1 },
  implants: [],
  plans: [],
  scripts: ['perce_glace'],
  equipage: [],
  drapeaux: {},
  issues: {},
  fragmentIdentite: '',
  terminee: false,
};

export const useRunStore = create<RunEtat & RunActions>()(
  persist(
    (set, get) => ({
      ...ETAT_INITIAL,

      nouvellePartie: () =>
        set({
          ...ETAT_INITIAL,
          competences: { ...ETAT_INITIAL.competences },
          scripts: [...ETAT_INITIAL.scripts],
          implants: [],
          plans: [],
          equipage: [],
          drapeaux: {},
          issues: {},
        }),

      competence: (nom) => get().competences[nom] ?? 0,

      ameliorerCompetence: (nom, n) =>
        set((e) => ({ competences: { ...e.competences, [nom]: (e.competences[nom] ?? 0) + n } })),
      aImplant: (id) => get().implants.includes(id),
      equipagePresent: (id) => get().equipage.includes(id),

      peutPayer: ({ credits, cycles, humanite }) => {
        const e = get();
        return e.credits >= credits && e.cycles >= cycles && e.humanite >= humanite;
      },

      payer: (cout) => {
        if (!get().peutPayer(cout)) return false;
        set((e) => ({
          credits: e.credits - cout.credits,
          cycles: e.cycles - cout.cycles,
          humanite: e.humanite - cout.humanite,
        }));
        return true;
      },

      reinitJauges: () => set({ confiance: 0, soupcon: 0 }),

      ajusterJauges: (confiance, soupcon) => set({ confiance, soupcon }),

      enregistrerIssue: (scene, palier) =>
        set((e) => ({ issues: { ...e.issues, [scene]: palier } })),

      consommerCycles: (n) => set((e) => ({ cycles: Math.max(0, e.cycles - n) })),

      // Recruter applique l'apport du membre : un equipier n'est pas un nom sur
      // une liste, il change ce que Sable sait faire — et cela se voit dans la
      // matrice comme dans les dialogues.
      recruter: (id) =>
        set((e) => {
          if (e.equipage.includes(id) || e.equipage.length >= MEMBRES_MAX) return e;
          const m = (equipage.membres as Record<string, { competence: string; bonus: number }>)[id];
          if (!m) return { equipage: [...e.equipage, id] };
          return {
            equipage: [...e.equipage, id],
            competences: {
              ...e.competences,
              [m.competence]: (e.competences[m.competence] ?? 0) + m.bonus,
            },
          };
        }),

      placesLibres: () => Math.max(0, MEMBRES_MAX - get().equipage.length),

      gagnerCredits: (n) => set((e) => ({ credits: e.credits + n })),

      acquerir: (categorie, id) =>
        set((e) => (e[categorie].includes(id) ? e : { [categorie]: [...e[categorie], id] })),

      terminer: () => set({ terminee: true }),
    }),
    {
      name: 'neuromancer-run',
      version: VERSION_RUN,
      storage: createJSONStorage(() => localStorage, { replacer, reviver }),
      migrate: (etat) => ({ ...ETAT_INITIAL, ...(etat as Partial<RunEtat>) }) as RunEtat & RunActions,
    },
  ),
);
