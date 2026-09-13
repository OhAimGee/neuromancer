import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiEtat {
  /** Effets CRT et glitch. Desactivables : risque photosensible reel. */
  glitch: boolean;
  scanlines: boolean;
  /** Vitesse d'apparition du texte, en caracteres par seconde. 0 = instantane. */
  vitesseTexte: number;

  // Ephemere — jamais persiste (voir partialize).
  sceneActive: string | null;
  enTransition: boolean;
}

interface UiActions {
  basculerGlitch: () => void;
  basculerScanlines: () => void;
  setVitesseTexte: (v: number) => void;
  setSceneActive: (id: string | null) => void;
  setTransition: (v: boolean) => void;
}

export const useUiStore = create<UiEtat & UiActions>()(
  persist(
    (set) => ({
      glitch: true,
      scanlines: true,
      vitesseTexte: 45,
      sceneActive: null,
      enTransition: false,

      basculerGlitch: () => set((e) => ({ glitch: !e.glitch })),
      basculerScanlines: () => set((e) => ({ scanlines: !e.scanlines })),
      setVitesseTexte: (v) => set({ vitesseTexte: Math.max(0, v) }),
      setSceneActive: (id) => set({ sceneActive: id }),
      setTransition: (v) => set({ enTransition: v }),
    }),
    {
      name: 'neuromancer-options',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Seules les preferences survivent au rechargement ; l'etat d'interface
      // en cours est reconstruit a chaque demarrage.
      partialize: (e) => ({
        glitch: e.glitch,
        scanlines: e.scanlines,
        vitesseTexte: e.vitesseTexte,
      }),
    },
  ),
);
