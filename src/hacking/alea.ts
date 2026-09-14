/**
 * Generateur pseudo-aleatoire deterministe, ensemence par une chaine.
 *
 * Le cyberespace est regenere a chaque partie, mais une meme graine doit
 * toujours rendre le meme reseau : c'est ce qui rend la generation testable, et
 * ce qui permettra de rejouer une plongee a l'identique pour la debuguer.
 */
export function alea(graine: string): () => number {
  // fnv-1a, puis mulberry32.
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) {
    h ^= graine.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let etat = h >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entier dans [0, n[. */
export function entier(hasard: () => number, n: number): number {
  return Math.floor(hasard() * n);
}

/** Tire un element d'une liste ordonnee ponderee. */
export function tirage<T>(hasard: () => number, elements: readonly T[], poids: readonly number[]): T {
  const total = poids.reduce((a, b) => a + b, 0);
  let seuil = hasard() * total;
  for (let i = 0; i < elements.length; i++) {
    seuil -= poids[i] ?? 0;
    if (seuil < 0) return elements[i] as T;
  }
  return elements[elements.length - 1] as T;
}
