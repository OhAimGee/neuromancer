import { Application, Container } from 'pixi.js';
import { chargerTilemap } from './tilemap';

export const LARGEUR = 320;
export const HAUTEUR = 180;

/**
 * Le canvas de jeu, pilote en imperatif.
 *
 * React ne touche jamais a ce qui suit : il monte l'hote une fois, puis se
 * contente d'appeler afficherDecor(). Le rendu se fait reellement en 320x180
 * avec resolution: 1 — c'est le navigateur qui agrandit le canvas en plus
 * proche voisin. Un futur filtre CRT posé sur le stage s'executera donc sur ces
 * 320x180 pixels, et non sur des pixels deja agrandis.
 */
export class SceneJeu {
  private app: Application | null = null;
  private detruit = false;
  private decorActuel: string | null = null;
  private jeton = 0;
  private cache = new Map<string, Container>();

  async monter(hote: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({
      width: LARGEUR,
      height: HAUTEUR,
      resolution: 1,
      antialias: false,
      roundPixels: true,
      backgroundAlpha: 0,
      preference: 'webgl',
    });
    // Le montage est asynchrone, et React 19 monte deux fois les effets en
    // mode strict : detruire() a pu passer avant que init() ne rende la main.
    if (!this.detruit && this.app === null && hote.isConnected) {
      this.app = app;
      hote.appendChild(app.canvas);
    } else {
      app.destroy(true);
    }
  }

  /** Racine du canvas, pour les couches que la scene ne gere pas elle-meme. */
  racine(): Container | null {
    return this.app?.stage ?? null;
  }

  /** Attache une couche construite ailleurs (le graphe du cyberespace). */
  poser(couche: Container): boolean {
    if (!this.app || this.detruit) return false;
    this.app.stage.addChild(couche);
    return true;
  }

  async afficherDecor(id: string | null): Promise<void> {
    if (id === this.decorActuel) return;
    this.decorActuel = id;

    const jeton = ++this.jeton;
    const calque = id ? this.cache.get(id) ?? (await chargerTilemap(id)) : null;
    // Un decor demande plus recemment a pris la main pendant le chargement.
    if (jeton !== this.jeton || !this.app || this.detruit) return;
    if (id && calque) this.cache.set(id, calque);

    this.app.stage.removeChildren();
    if (calque) this.app.stage.addChild(calque);
  }

  detruire(): void {
    this.detruit = true;
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.cache.clear();
    this.decorActuel = null;
  }
}
