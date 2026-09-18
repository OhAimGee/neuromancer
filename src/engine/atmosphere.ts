import { Container, Graphics } from 'pixi.js';

export interface Halo {
  x: number;
  y: number;
  r: number;
  /** Couleur en hexadecimal, comme dans data/decors.json. */
  couleur: string;
}

export interface Ambiance {
  brume?: number;
  vignette?: number;
  halos?: readonly Halo[];
}

/** Nombre de bandes. Voir `brume` pour la raison. */
const BANDES = 7;

/**
 * Ce qui se pose PAR-DESSUS le decor et ne depend ni des tuiles ni des plans :
 * la brume, la vignette, et le halo des enseignes.
 *
 * Tout est trace en bandes ou en anneaux d'alpha constant, jamais en degrade
 * continu. Un degrade lisse sur du pixel art se voit immediatement — il
 * fabrique a l'ecran des centaines de valeurs intermediaires que la palette de
 * trente-deux couleurs n'a jamais contenues, et le decor se met a ressembler a
 * une photo assombrie. Sept bandes suffisent a lire une profondeur, et elles
 * restent du pixel.
 */
export class Atmosphere {
  readonly couche = new Container({ label: 'atmosphere' });
  private readonly halos: { g: Graphics; base: number; phase: number }[] = [];
  private temps = 0;

  static construire(ambiance: Ambiance, largeur: number, hauteur: number): Atmosphere {
    const a = new Atmosphere();

    if (ambiance.brume && ambiance.brume > 0) {
      const g = new Graphics({ label: 'brume' });
      const h = Math.ceil(hauteur / BANDES);
      for (let i = 0; i < BANDES; i++) {
        // La brume est plus epaisse en haut : c'est la ou la profondeur se
        // joue. Le bas de l'image est le sol, a deux metres du joueur.
        const force = ambiance.brume * (1 - i / BANDES);
        g.rect(0, i * h, largeur, h).fill({ color: 0x1a2438, alpha: force });
      }
      a.couche.addChild(g);
    }

    if (ambiance.vignette && ambiance.vignette > 0) {
      const g = new Graphics({ label: 'vignette' });
      const anneaux = 8;
      const pas = 3;
      for (let i = 0; i < anneaux; i++) {
        const e = i * pas;
        const alpha = (ambiance.vignette * (anneaux - i)) / anneaux / anneaux;
        g.rect(e, e, largeur - 2 * e, hauteur - 2 * e)
          .stroke({ width: pas, color: 0x05060a, alpha, alignment: 0 });
      }
      a.couche.addChild(g);
    }

    for (const halo of ambiance.halos ?? []) {
      // Additif : une enseigne ajoute de la lumiere, elle n'en retire pas. En
      // melange normal, un disque sombre sur un mur sombre ne se voit pas, et
      // un disque clair fait une pastille de peinture.
      const g = new Graphics({ label: 'halo' });
      const couleur = Number(halo.couleur);
      for (let i = halo.r; i > 0; i -= 2) {
        g.circle(halo.x, halo.y, i).fill({ color: couleur, alpha: 0.03 });
      }
      g.blendMode = 'add';
      a.couche.addChild(g);
      a.halos.push({ g, base: g.alpha, phase: (halo.x * 7 + halo.y * 13) % 100 / 100 });
    }

    return a;
  }

  /**
   * Le halo respire. Une enseigne au neon n'est jamais parfaitement stable, et
   * c'est le seul mouvement de la scene quand il ne pleut pas.
   *
   * La phase est tiree de la position du halo et non du hasard : deux enseignes
   * qui palpitent a l'unisson se lisent comme un clignotant d'interface.
   */
  animer(dt: number): void {
    this.temps += dt;
    for (const halo of this.halos) {
      const t = this.temps * 0.9 + halo.phase * Math.PI * 2;
      halo.g.alpha = halo.base * (0.82 + 0.18 * Math.sin(t) + 0.06 * Math.sin(t * 3.7));
    }
  }

  detruire(): void {
    this.couche.destroy({ children: true });
  }
}
