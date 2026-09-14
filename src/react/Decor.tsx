import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { MoteurDialogue } from '@/dialogue/moteur';
import { SceneJeu } from '@/engine/scene';

/**
 * Unique point de contact entre React et Pixi. React monte l'hote et transmet
 * l'identifiant de decor ; il ne re-rend jamais le contenu du canvas.
 */
export function Decor({ moteur }: { moteur: MoteurDialogue }) {
  const hote = useRef<HTMLDivElement>(null);
  const scene = useRef<SceneJeu | null>(null);
  const decor = useSyncExternalStore(moteur.souscrire, () => moteur.lire().decor);

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

  return <div className="decor" ref={hote} aria-hidden="true" />;
}
