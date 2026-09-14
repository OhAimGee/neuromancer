import type { Graphics } from 'pixi.js';

/**
 * Trace un segment pixel par pixel, par l'algorithme de Bresenham.
 *
 * Pixi sait tracer des lignes, mais un stroke de 1 px avec `antialias: false`
 * disparait purement et simplement des que le segment est oblique — verifie a
 * l'ecran. Poser les pixels soi-meme est de toute facon la bonne reponse en
 * pixel art : une diagonale lissee jurerait au milieu des sprites.
 *
 * Les pixels sont empiles en rectangles de 1x1 ; l'appelant termine par un
 * seul `fill()`.
 */
export function segment(g: Graphics, x0: number, y0: number, x1: number, y1: number): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xf = Math.round(x1);
  const yf = Math.round(y1);
  const dx = Math.abs(xf - x);
  const dy = -Math.abs(yf - y);
  const sx = x < xf ? 1 : -1;
  const sy = y < yf ? 1 : -1;
  let erreur = dx + dy;

  for (let garde = 0; garde < 2048; garde++) {
    g.rect(x, y, 1, 1);
    if (x === xf && y === yf) return;
    const e2 = 2 * erreur;
    if (e2 >= dy) {
      erreur += dy;
      x += sx;
    }
    if (e2 <= dx) {
      erreur += dx;
      y += sy;
    }
  }
}
