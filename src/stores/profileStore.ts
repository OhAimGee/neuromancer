import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { replacer, reviver } from '@/save/serialize';

export const VERSION_PROFIL = 1;

/**
 * Profil persistant — survit a toutes les parties.
 *
 * C'est le coeur de la rejouabilite : ce qui progresse d'une partie a l'autre
 * n'est pas une statistique mais une CONNAISSANCE. Une information decouverte
 * dans n'importe quelle partie debloque definitivement les options de dialogue
 * `[CONNAISSANCE]` qui la referencent.
 */
interface ProfilEtat {
  connaissances: Set<string>;
  finsVues: string[];
  parties: number;
  /** Cycles restants a la meilleure fin atteinte. null si aucune partie finie. */
  meilleursCycles: number | null;
}

interface ProfilActions {
  apprendre: (id: string) => void;
  connait: (id: string) => boolean;
  enregistrerFin: (idFin: string, cyclesRestants: number) => void;
  reinitialiser: () => void;
}

const ETAT_INITIAL: ProfilEtat = {
  connaissances: new Set<string>(),
  finsVues: [],
  parties: 0,
  meilleursCycles: null,
};

export const useProfileStore = create<ProfilEtat & ProfilActions>()(
  persist(
    (set, get) => ({
      ...ETAT_INITIAL,

      apprendre: (id) =>
        set((e) => {
          if (e.connaissances.has(id)) return e;
          return { connaissances: new Set(e.connaissances).add(id) };
        }),

      connait: (id) => get().connaissances.has(id),

      enregistrerFin: (idFin, cyclesRestants) =>
        set((e) => ({
          finsVues: e.finsVues.includes(idFin) ? e.finsVues : [...e.finsVues, idFin],
          parties: e.parties + 1,
          meilleursCycles:
            e.meilleursCycles === null
              ? cyclesRestants
              : Math.max(e.meilleursCycles, cyclesRestants),
        })),

      reinitialiser: () => set({ ...ETAT_INITIAL, connaissances: new Set<string>() }),
    }),
    {
      name: 'neuromancer-profil',
      version: VERSION_PROFIL,
      storage: createJSONStorage(() => localStorage, { replacer, reviver }),
      migrate: (etat, versionStockee) => {
        const e = etat as Partial<ProfilEtat>;
        // Une sauvegarde anterieure au marqueur de Set stockait un tableau nu.
        if (versionStockee < 1 && Array.isArray(e.connaissances)) {
          e.connaissances = new Set(e.connaissances as string[]);
        }
        return { ...ETAT_INITIAL, ...e } as ProfilEtat & ProfilActions;
      },
    },
  ),
);
