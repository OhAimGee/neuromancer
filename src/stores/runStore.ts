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
  /**
   * Faux tant que la toxine n'a pas ete posee. L'ouverture est un flashback de
   * trois ans plus tot : y afficher une fiole pleine et douze cycles annonce un
   * compte a rebours qui n'a pas commence.
   */
  horlogeLancee: boolean;
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
  /** Achat au comptoir : paie les trois monnaies et pose l'objet, ou rien. */
  acheter: (categorie: 'scripts' | 'implants', id: string, cout: Cout) => boolean;
  demarrerHorloge: () => void;
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
  horlogeLancee: false,
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
          horlogeLancee: false,
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

      // Un seul endroit paie. Le prix se prelevait jusqu'ici dans le corps du
      // choix Ink, en clair, pour que le validateur puisse comparer le cout
      // affiche a l'arithmetique ; le comptoir sort ces achats du recit, et
      // c'est le catalogue que le validateur controle desormais.
      acheter: (categorie, id, cout) => {
        if (get()[categorie].includes(id)) return false;
        if (!get().payer(cout)) return false;
        get().acquerir(categorie, id);
        return true;
      },

      demarrerHorloge: () => set({ horlogeLancee: true }),

      terminer: () => set({ terminee: true }),
    }),
    {
      name: 'neuromancer-run',
      version: VERSION_RUN,
      storage: createJSONStorage(() => localStorage, { replacer, reviver }),
      // `horlogeLancee: true` en repli : une partie sauvegardee avant ce champ
      // a forcement passe le prologue, donc son horloge tourne deja.
      migrate: (etat) =>
        ({ ...ETAT_INITIAL, horlogeLancee: true, ...(etat as Partial<RunEtat>) }) as RunEtat &
          RunActions,
    },
  ),
);

// Sonde de developpement, comme `window.__noeudsVisibles` cote cyberespace :
// l'etat de partie est jetable et ne passe pas par localStorage au demarrage,
// donc un outil de verification n'a aucun autre moyen de poser un butin avant
// d'ouvrir l'atelier du Finn. Retiree du build.
// `typeof window` et pas seulement DEV : ce bloc s'execute au chargement du
// module, et les tests unitaires tournent sans DOM.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)['__runStore'] = useRunStore;
}
