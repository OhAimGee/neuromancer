import { useEffect, useRef, useState } from 'react';

/**
 * Fait apparaitre le texte caractere par caractere, comme un RPG au tour par
 * tour. Le rythme vient des options : a 0, tout s'affiche d'un coup.
 *
 * Rend le texte partiel, l'etat d'avancement, et de quoi tout reveler — parce
 * que la premiere pression du joueur doit finir la replique, et la seconde
 * seulement passer a la suivante. L'inverse fait perdre des lignes a qui
 * appuie vite.
 */
export function useMachineAEcrire(texte: string, vitesse: number, cle: unknown) {
  const [reveles, setReveles] = useState(0);
  const debut = useRef(0);

  useEffect(() => {
    debut.current = performance.now();
    setReveles(vitesse <= 0 ? texte.length : 0);
  }, [cle, texte, vitesse]);

  useEffect(() => {
    if (vitesse <= 0 || reveles >= texte.length) return;
    let vivant = true;
    let image = 0;

    // requestAnimationFrame et non setInterval : le nombre de caracteres se
    // deduit du temps ecoule, donc un onglet ralenti ne desynchronise rien.
    const tic = () => {
      if (!vivant) return;
      const ecoule = (performance.now() - debut.current) / 1000;
      const n = Math.min(texte.length, Math.floor(ecoule * vitesse));
      setReveles(n);
      if (n < texte.length) image = requestAnimationFrame(tic);
    };
    image = requestAnimationFrame(tic);

    return () => {
      vivant = false;
      cancelAnimationFrame(image);
    };
  }, [texte, vitesse, reveles]);

  return {
    affiche: reveles >= texte.length ? texte : texte.slice(0, reveles),
    complet: reveles >= texte.length,
    toutReveler: () => setReveles(texte.length),
  };
}
