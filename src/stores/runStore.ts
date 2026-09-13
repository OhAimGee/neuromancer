import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { replacer, reviver } from '@/save/serialize';
import type { Cout, IdentiteFragment, Palier } from '@/types/jeu';

export const VERSION_RUN = 1;

/** Horloge de depart. Les sacs de toxine se dissolvent au bout de 12 cycles. */
export const CYCLES_DEPART = 12;

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
  aImplant: (id: string) => boolean;
  equipagePresent: (id: string) => boolean;
  peutPayer: (cout: Cout) => boolean;
  payer: (cout: Cout) => boolean;
  reinitJauges: () => void;
  ajusterJauges: (confiance: number, soupcon: number) => void;
  enregistrerIssue: (scene: string, palier: Palier) => void;
  consommerCycles: (n: number) => void;
  recruter: (id: string) => void;
  terminer: () => void;
}

const ETAT_INITIAL: RunEtat = {
  cycles: CYCLES_DEPART,
  humanite: 100,
  credits: 0,
  confiance: 0,
  soupcon: 0,
  competences: { hacking: 1, social: 1, combat: 1 },
  implants: [],
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
          equipage: [],
          drapeaux: {},
          issues: {},
        }),

      competence: (nom) => get().competences[nom] ?? 0,
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

      recruter: (id) =>
        set((e) => (e.equipage.includes(id) ? e : { equipage: [...e.equipage, id] })),

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
