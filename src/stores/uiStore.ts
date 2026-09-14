import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiEtat {
  /** Effets CRT et glitch. Desactivables : risque photosensible reel. */
  glitch: boolean;
  scanlines: boolean;
  /** Vitesse d'apparition du texte, en caracteres par seconde. 0 = instantane. */
  vitesseTexte: number;
  volumeMusique: number;
  volumeEffets: number;

  // Ephemere — jamais persiste (voir partialize).
  sceneActive: string | null;
  enTransition: boolean;
}

interface UiActions {
  basculerGlitch: () => void;
  basculerScanlines: () => void;
  setVitesseTexte: (v: number) => void;
  setVolume: (bus: 'musique' | 'effets', v: number) => void;
  setSceneActive: (id: string | null) => void;
  setTransition: (v: boolean) => void;
}

/** Valeurs par defaut des seules cles persistees. */
const DEFAUTS = {
  glitch: true,
  scanlines: true,
  vitesseTexte: 45,
  volumeMusique: 0.5,
  volumeEffets: 0.7,
};

export const useUiStore = create<UiEtat & UiActions>()(
  persist(
    (set) => ({
      ...DEFAUTS,
      sceneActive: null,
      enTransition: false,

      basculerGlitch: () => set((e) => ({ glitch: !e.glitch })),
      basculerScanlines: () => set((e) => ({ scanlines: !e.scanlines })),
      setVitesseTexte: (v) => set({ vitesseTexte: Math.max(0, v) }),
      setVolume: (bus, v) => {
        const borne = Math.min(1, Math.max(0, v));
        set(bus === 'musique' ? { volumeMusique: borne } : { volumeEffets: borne });
      },
      setSceneActive: (id) => set({ sceneActive: id }),
      setTransition: (v) => set({ enTransition: v }),
    }),
    {
      name: 'neuromancer-options',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Sans migration, un changement de version fait simplement disparaitre
      // les preferences enregistrees : on complete avec les valeurs par defaut.
      migrate: (etat) => ({ ...DEFAUTS, ...(etat as object) }) as UiEtat & UiActions,
      // Seules les preferences survivent au rechargement ; l'etat d'interface
      // en cours est reconstruit a chaque demarrage.
      partialize: (e) => ({
        glitch: e.glitch,
        scanlines: e.scanlines,
        vitesseTexte: e.vitesseTexte,
        volumeMusique: e.volumeMusique,
        volumeEffets: e.volumeEffets,
      }),
    },
  ),
);
