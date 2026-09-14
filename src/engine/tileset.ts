import { Assets, Rectangle, Texture } from 'pixi.js';

/** Manifeste ecrit par les generateurs Lua, a cote du PNG. */
interface Manifeste {
  tuile: number;
  colonnes: number;
  noms: string[];
}

/**
 * Une bande de tuiles decoupee en textures, adressables par nom.
 *
 * L'adressage par nom et non par index est deliberé : l'ordre des tuiles dans
 * le generateur Lua fait foi, mais une tilemap qui citerait des index bruts
 * deviendrait illisible et se casserait au moindre ajout mal place.
 */
export class Tileset {
  readonly taille: number;
  private readonly parNom = new Map<string, Texture>();

  private constructor(taille: number) {
    this.taille = taille;
  }

  static async charger(nom: string): Promise<Tileset> {
    const base = `/assets/tilesets/${nom}`;
    const [planche, manifeste] = await Promise.all([
      Assets.load<Texture>(`${base}.png`),
      fetch(`${base}.json`).then((r) => {
        if (!r.ok) throw new Error(`Manifeste ${nom} introuvable (HTTP ${r.status})`);
        return r.json() as Promise<Manifeste>;
      }),
    ]);

    // Sans cela Pixi interpole a l'agrandissement et le pixel art devient flou.
    planche.source.scaleMode = 'nearest';

    const ts = new Tileset(manifeste.tuile);
    const t = manifeste.tuile;
    manifeste.noms.forEach((nomTuile, i) => {
      ts.parNom.set(
        nomTuile,
        new Texture({
          source: planche.source,
          frame: new Rectangle((i % manifeste.colonnes) * t, Math.floor(i / manifeste.colonnes) * t, t, t),
        }),
      );
    });
    return ts;
  }

  texture(nom: string): Texture {
    const tex = this.parNom.get(nom);
    if (!tex) throw new Error(`Tuile inconnue : ${nom}`);
    return tex;
  }
}
