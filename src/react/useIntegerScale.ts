import { useLayoutEffect, useState } from 'react';

export const VIEWPORT_W = 320;
export const VIEWPORT_H = 180;

/**
 * Echelle entiere la plus grande qui tient dans la fenetre. Une echelle
 * fractionnaire ferait baver les pixels quel que soit le reglage de rendu.
 */
export function useIntegerScale(): number {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const compute = () => {
      const s = Math.min(window.innerWidth / VIEWPORT_W, window.innerHeight / VIEWPORT_H);
      setScale(Math.max(1, Math.floor(s)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return scale;
}
