import { useSyncExternalStore } from 'react';
import decors from '@data/decors.json';
import type { MoteurDialogue } from '@/dialogue/moteur';
import { useDecor } from './useDecor';

const DECORS = decors as Record<string, { pluie?: boolean } | undefined>;

/**
 * Unique point de contact entre React et Pixi. React monte l'hote et transmet
 * l'identifiant de decor ; il ne re-rend jamais le contenu du canvas.
 */
export function Decor({ moteur }: { moteur: MoteurDialogue }) {
  const decor = useSyncExternalStore(moteur.souscrire, () => moteur.lire().decor);
  const hote = useDecor(decor);

  // La pluie est une nappe DOM et non un filtre Pixi : c'est une tuile de 16
  // pixels que le CSS fait glisser par pas d'un pixel, donc elle suit
  // l'echelle entiere du reste de l'interface sans etre re-echantillonnee.
  const pluie = decor !== null && DECORS[decor]?.pluie === true;

  return (
    <>
      <div className="decor" ref={hote} aria-hidden="true" />
      {pluie && <div className="pluie" aria-hidden="true" />}
    </>
  );
}
