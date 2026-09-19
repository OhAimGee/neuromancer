import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { replacer, reviver } from '@/save/serialize';

export const VERSION_PROFIL = 3;

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
  /** Explications de regle deja montrees. Un joueur ne relit pas un tutoriel. */
  glosesVues: Set<string>;
  /** Locuteurs deja croises, toutes parties confondues. Alimente le CARNET. */
  rencontres: Set<string>;
  finsVues: string[];
  parties: number;
  /** Cycles restants a la meilleure fin atteinte. null si aucune partie finie. */
  meilleursCycles: number | null;
}

interface ProfilActions {
  apprendre: (id: string) => void;
  aVuGlose: (id: string) => boolean;
  marquerGlose: (id: string) => void;
  connait: (id: string) => boolean;
  rencontrer: (id: string) => void;
  enregistrerFin: (idFin: string, cyclesRestants: number) => void;
  reinitialiser: () => void;
}

const ETAT_INITIAL: ProfilEtat = {
  connaissances: new Set<string>(),
  glosesVues: new Set<string>(),
  rencontres: new Set<string>(),
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

      // Une rencontre survit a la partie, comme une connaissance : le carnet
      // des archives se remplit au fil des parties, et c'est une des rares
      // choses que le joueur voit grossir.
      rencontrer: (id) =>
        set((e) => (e.rencontres.has(id) ? e : { rencontres: new Set(e.rencontres).add(id) })),

      aVuGlose: (id) => get().glosesVues.has(id),

      marquerGlose: (id) =>
        set((e) => (e.glosesVues.has(id) ? e : { glosesVues: new Set(e.glosesVues).add(id) })),

      enregistrerFin: (idFin, cyclesRestants) =>
        set((e) => ({
          finsVues: e.finsVues.includes(idFin) ? e.finsVues : [...e.finsVues, idFin],
          parties: e.parties + 1,
          meilleursCycles:
            e.meilleursCycles === null
              ? cyclesRestants
              : Math.max(e.meilleursCycles, cyclesRestants),
        })),

      reinitialiser: () =>
        set({
          ...ETAT_INITIAL,
          connaissances: new Set<string>(),
          glosesVues: new Set<string>(),
          rencontres: new Set<string>(),
        }),
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
        // v2 : glosesVues n'existait pas. Sans ce defaut, un profil deja
        // enregistre appellerait .has() sur undefined des le premier choix.
        if (!(e.glosesVues instanceof Set)) e.glosesVues = new Set<string>();
        // v3 : le carnet. Meme raison que ci-dessus — sans ce defaut, un profil
        // deja enregistre appellerait .has() sur undefined des la premiere
        // replique nominative.
        if (!(e.rencontres instanceof Set)) e.rencontres = new Set<string>();
        return { ...ETAT_INITIAL, ...e } as ProfilEtat & ProfilActions;
      },
    },
  ),
);

// Sonde de developpement, comme `window.__runStore`. Le profil se reconstruit
// en jouant plusieurs parties : un outil qui voudrait capturer des archives
// remplies devrait donc terminer le jeu trois fois avant de prendre une image.
// Retiree du build.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)['__profileStore'] = useProfileStore;
}
