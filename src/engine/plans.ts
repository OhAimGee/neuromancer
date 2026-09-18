import { Assets, Container, TilingSprite, type Texture } from 'pixi.js';

/**
 * Un plan de parallaxe : une image large posee derriere les autres.
 *
 * Les images font 112 a 688 pixels de large pour une fenetre de 320 : la marge
 * est reelle, et c'est elle qui permet de caler horizontalement une scene sans
 * rien redessiner. Un `TilingSprite` et non un `Sprite` parce que les planches
 * d'origine sont faites pour se raccorder : les plus etroites se repetent au
 * lieu de laisser du vide.
 */
export interface PlanDecor {
  image: string;
  x?: number;
  y?: number;
  /** Pixels par seconde. Volontairement minuscule — voir `Plans.animer`. */
  derive?: number;
  alpha?: number;
}

export class Plans {
  readonly couche = new Container({ label: 'plans' });
  private readonly nappes: { sprite: TilingSprite; depart: number; derive: number; parcouru: number }[] = [];

  static async construire(plans: readonly PlanDecor[], largeur: number, hauteur: number): Promise<Plans> {
    const p = new Plans();
    for (const plan of plans) {
      const texture = await Assets.load<Texture>(`/assets/parallax/${plan.image}.png`);
      texture.source.scaleMode = 'nearest';
      const sprite = new TilingSprite({
        texture,
        width: largeur,
        height: hauteur,
        alpha: plan.alpha ?? 1,
        label: plan.image,
      });
      // Le decalage vit dans la tuile et non dans la position du sprite : le
      // sprite couvre toute la fenetre, c'est le motif qui glisse dessous.
      sprite.tilePosition.set(plan.x ?? 0, plan.y ?? 0);
      p.couche.addChild(sprite);
      p.nappes.push({ sprite, depart: plan.x ?? 0, derive: plan.derive ?? 0, parcouru: 0 });
    }
    return p;
  }

  /**
   * La derive est de l'ordre d'un pixel toutes les deux secondes sur le plan le
   * plus lointain, et nulle sur le plus proche.
   *
   * Une parallaxe rapide sur une scene fixe raconte que la camera avance, ce
   * qui est faux : le joueur est arrete, il parle a quelqu'un. A cette vitesse
   * on ne voit pas la ville bouger, on la sent respirer — et le plan proche
   * immobile est ce qui ancre le tout.
   *
   * `dt` en secondes. Le cumul se fait en flottant et n'est arrondi qu'au
   * moment de poser la tuile : arrondir a chaque image figerait tout plan dont
   * la derive est inferieure a un pixel par trame, c'est-a-dire tous.
   */
  animer(dt: number): void {
    for (const nappe of this.nappes) {
      if (nappe.derive === 0) continue;
      nappe.parcouru += nappe.derive * dt;
      nappe.sprite.tilePosition.x = nappe.depart + Math.round(nappe.parcouru);
    }
  }

  detruire(): void {
    this.couche.destroy({ children: true });
  }
}
