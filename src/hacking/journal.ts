import formules from '@data/journal.json';
import type { Evenement } from './types';

const FORMULES = formules as Record<string, string>;

/**
 * Traduit un evenement de plongee en ligne affichable.
 *
 * Le moteur n'emet que des codes : toute la formulation vit dans
 * data/journal.json. Un code sans formule est une faute de donnees, pas une
 * raison de faire disparaitre l'evenement — on l'affiche brut.
 */
export function formuler(evenement: Evenement): string {
  const modele = FORMULES[evenement.code];
  if (modele === undefined) return evenement.code;
  return modele.replace(/\{(\w+)\}/g, (brut, cle: string) => {
    const valeur = evenement.valeurs[cle];
    return valeur === undefined ? brut : String(valeur);
  });
}
