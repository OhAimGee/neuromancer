import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { Tileset } from '@/engine/tileset';
import type { EtatSession, Noeud } from './types';

const TAILLE = 24;

/** Couleurs des liens, reprises de la palette verrouillee. */
const LIEN = 0x0a6e7a;
const LIEN_OUVERT = 0x12b5c4;
const PIP = 0x5bf0ff;

/**
 * Trace un segment pixel par pixel, par l'algorithme de Bresenham.
 *
 * Pixi sait tracer des lignes, mais un stroke de 1 px avec antialias: false
 * disparait purement et simplement des que le segment est oblique — verifie a
 * l'ecran : seuls les liens horizontaux s'affichaient. Poser les pixels
 * soi-meme est de toute facon la bonne reponse en pixel art, une diagonale
 * lissee jurerait au milieu des sprites.
 */
function segment(g: Graphics, x0: number, y0: number, x1: number, y1: number): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xf = Math.round(x1);
  const yf = Math.round(y1);
  const dx = Math.abs(xf - x);
  const dy = -Math.abs(yf - y);
  const sx = x < xf ? 1 : -1;
  const sy = y < yf ? 1 : -1;
  let erreur = dx + dy;

  for (let garde = 0; garde < 1024; garde++) {
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

/**
 * Rendu du graphe du cyberespace.
 *
 * Reconstruit entierement a chaque changement d'etat plutot que diffuse : un
 * reseau fait au plus une trentaine de noeuds, et un rendu sans etat interne
 * ne peut pas se desynchroniser de la session.
 */
export class RenduCyberespace {
  readonly couche = new Container({ label: 'cyberespace' });
  private planche: Tileset | null = null;
  // Un Graphics par style : tous les segments d'un meme style sont poses en
  // rectangles puis remplis d'un seul fill.
  private liensSourds = new Graphics();
  private liensOuverts = new Graphics();
  private noeuds = new Container();
  private surClic: (id: string) => void = () => {};

  constructor() {
    this.couche.addChild(this.liensSourds, this.liensOuverts, this.noeuds);
  }

  async charger(): Promise<void> {
    this.planche = await Tileset.charger('sp_net', 'sprites');
  }

  auClic(rappel: (id: string) => void): void {
    this.surClic = rappel;
  }

  private texture(nom: string): Texture | null {
    return this.planche ? this.planche.texture(nom) : null;
  }

  /** Le leurre emprunte l'icone de la BDD tant qu'il n'a pas mordu. */
  private iconeDe(n: Noeud): string {
    if (n.type === 'leurre') return n.franchi ? 'leurre' : 'bdd';
    return n.type;
  }

  dessiner(etat: EtatSession): void {
    if (!this.planche) return;
    const { noeuds } = etat.graphe;
    const visible = (n: Noeud) => n.repere;

    this.liensSourds.clear();
    this.liensOuverts.clear();
    const traces = new Set<string>();
    for (const n of Object.values(noeuds)) {
      if (!visible(n)) continue;
      for (const idVoisin of n.voisins) {
        const v = noeuds[idVoisin];
        if (!v || !visible(v)) continue;
        const cle = [n.id, v.id].sort().join('-');
        if (traces.has(cle)) continue;
        traces.add(cle);

        const ouvert = n.id === etat.position || v.id === etat.position;
        segment(ouvert ? this.liensOuverts : this.liensSourds, n.x, n.y, v.x, v.y);
      }
    }
    this.liensSourds.fill({ color: LIEN, alpha: 0.6 });
    this.liensOuverts.fill({ color: LIEN_OUVERT });

    this.noeuds.removeChildren();
    for (const n of Object.values(noeuds)) {
      if (!visible(n)) continue;
      const tex = this.texture(this.iconeDe(n));
      if (!tex) continue;

      const s = new Sprite({ texture: tex, x: n.x - TAILLE / 2, y: n.y - TAILLE / 2 });
      // Une glace percee reste visible mais cesse de crier.
      s.alpha = n.franchi && (n.type === 'glace' || n.type === 'glace_noire') ? 0.4 : 1;
      s.eventMode = 'static';
      s.cursor = 'pointer';
      s.on('pointertap', () => this.surClic(n.id));
      this.noeuds.addChild(s);

      // Rang de la glace en pastilles : un chiffre en police systeme jurerait
      // au milieu du pixel art, et Pixi ne rend pas de bitmap font ici.
      if (n.rang > 0 && !n.franchi) {
        const pips = new Graphics();
        for (let i = 0; i < n.rang; i++) {
          pips.rect(n.x - n.rang * 2 + i * 4, n.y + TAILLE / 2 - 1, 2, 2).fill(PIP);
        }
        this.noeuds.addChild(pips);
      }
    }

    // Sonde pour tools/plonger.mjs : les noeuds sont dessines sur un canvas,
    // que Playwright ne sait pas interroger. Developpement uniquement.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>)['__noeudsVisibles'] = Object.values(noeuds)
        .filter(visible)
        .map((n) => ({ id: n.id, x: n.x, y: n.y, type: n.type }));
    }

    const ici = noeuds[etat.position];
    const reticule = this.texture('avatar');
    if (ici && reticule) {
      this.noeuds.addChild(
        new Sprite({ texture: reticule, x: ici.x - TAILLE / 2, y: ici.y - TAILLE / 2 }),
      );
    }
  }

  detruire(): void {
    this.couche.destroy({ children: true });
  }
}
