import equilibrage from '@data/equilibrage.json';
import type { Palier } from '@/types/jeu';

interface SeuilPalier {
  palier: string;
  confianceMin: number;
  soupconMax: number;
}

const SEUILS = equilibrage.paliers as SeuilPalier[];

/**
 * Issue d'une scene de dialogue.
 *
 * La confiance seule ne suffit pas : un interlocuteur peut vous apprecier tout
 * en vous soupconnant, et ca ne donne pas le meme resultat. Les seuils sont
 * evalues du plus exigeant au plus laxiste ; si aucun ne passe, c'est un echec.
 */
export function calculerPalier(confiance: number, soupcon: number): Palier {
  for (const seuil of SEUILS) {
    if (confiance >= seuil.confianceMin && soupcon <= seuil.soupconMax) {
      return seuil.palier as Palier;
    }
  }
  return 'echec';
}
