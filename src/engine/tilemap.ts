import { Container, Sprite } from 'pixi.js';
import { Tileset } from './tileset';

/**
 * Une tilemap est de la donnee, jamais du pixel : des rangees d'art ASCII et
 * une legende qui associe chaque caractere a un nom de tuile. C'est la meme
 * convention que les generateurs Lua, et un decor se relit d'un coup d'oeil.
 */
export interface DonneesTilemap {
  tileset: string;
  legende: Record<string, string>;
  lignes: string[];
}

export async function chargerTilemap(id: string): Promise<Container> {
  const reponse = await fetch(`/assets/tilemaps/${id}.json`);
  if (!reponse.ok) throw new Error(`Tilemap ${id} introuvable (HTTP ${reponse.status})`);
  const donnees: DonneesTilemap = await reponse.json();
  const tileset = await Tileset.charger(donnees.tileset);

  const calque = new Container({ label: id });
  const t = tileset.taille;

  donnees.lignes.forEach((ligne, y) => {
    for (let x = 0; x < ligne.length; x++) {
      const cle = ligne[x];
      if (cle === undefined || cle === ' ') continue;
      const nom = donnees.legende[cle];
      if (!nom) throw new Error(`Tilemap ${id} : caractere '${cle}' absent de la legende`);
      calque.addChild(
        new Sprite({ texture: tileset.texture(nom), x: x * t, y: y * t }),
      );
    }
  });

  return calque;
}
