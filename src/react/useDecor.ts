import { useEffect, useRef, type RefObject } from 'react';
import { SceneJeu } from '@/engine/scene';

/**
 * Monte un canvas Pixi et lui demande un decor.
 *
 * Il existe parce que l'ecran-titre a besoin exactement de ce que `Decor` fait
 * pour la partie — les memes plans de parallaxe, la meme atmosphere, le meme
 * ticker — sans avoir de moteur narratif a interroger. Dupliquer le montage
 * aurait duplique le rattrapage de `decorEnAttente` et les precautions du
 * double montage de React 19 : deux endroits ou se tromper au lieu d'un.
 */
export function useDecor(decor: string | null): RefObject<HTMLDivElement | null> {
  const hote = useRef<HTMLDivElement>(null);
  const scene = useRef<SceneJeu | null>(null);

  useEffect(() => {
    const s = new SceneJeu();
    scene.current = s;
    if (hote.current) void s.monter(hote.current);
    return () => {
      s.detruire();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    void scene.current?.afficherDecor(decor);
  }, [decor]);

  return hote;
}
