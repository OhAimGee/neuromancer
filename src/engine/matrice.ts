import { Container, Graphics } from 'pixi.js';
import { alea } from '@/hacking/alea';
import { segment } from './trait';

const LARGEUR = 320;
const HAUTEUR = 180;
const HORIZON = 64;

const GRILLE = 0x04333d;
const HORIZON_COULEUR = 0x0a6e7a;
const DONNEE = 0x12b5c4;
const DONNEE_VIVE = 0xc41e7f;

/**
 * Fond de la matrice : la grille et les constellations de donnees.
 *
 * Ce decor-la ne peut pas etre une tilemap — c'est une perspective, pas un
 * assemblage de tuiles. Il est donc construit en geometrie, mais toujours en
 * 320x180 et au pixel, comme le reste.
 */
export function construireMatrice(): Container {
  const couche = new Container({ label: 'matrice' });
  const grille = new Graphics();
  const hasard = alea('matrice');

  // Fuyantes : elles partent du point de fuite et s'ouvrent vers le bas.
  const fuite = { x: LARGEUR / 2, y: HORIZON };
  for (let i = -7; i <= 7; i++) {
    segment(grille, fuite.x, fuite.y, fuite.x + i * 58, HAUTEUR);
  }

  // Traverses : l'ecart croit en carre, ce qui suffit a donner la profondeur.
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const y = Math.round(HORIZON + (HAUTEUR - HORIZON) * (i / n) ** 2);
    segment(grille, 0, y, LARGEUR - 1, y);
  }
  grille.fill({ color: GRILLE });

  const ligneHorizon = new Graphics();
  segment(ligneHorizon, 0, HORIZON, LARGEUR - 1, HORIZON);
  ligneHorizon.fill({ color: HORIZON_COULEUR });

  // Grappes de donnees au-dessus de l'horizon : « comme des lumieres de ville,
  // qui s'eloignent ». Graine fixe — le fond ne doit pas scintiller au remount.
  const grappes = new Graphics();
  const vives = new Graphics();
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hasard() * LARGEUR);
    const y = Math.floor(hasard() * (HORIZON - 6));
    const h = 1 + Math.floor(hasard() * 8);
    const cible = hasard() < 0.15 ? vives : grappes;
    cible.rect(x, Math.max(0, y - h), 1, h);
  }
  grappes.fill({ color: DONNEE, alpha: 0.7 });
  vives.fill({ color: DONNEE_VIVE });

  couche.addChild(grille, ligneHorizon, grappes, vives);
  return couche;
}
