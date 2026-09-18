import { useEffect, useState } from 'react';

export interface OptionsNavigation {
  /**
   * Un seul ecran ecoute le clavier a la fois.
   *
   * Sans cette regle, `Entree` validait un choix de dialogue ET fermait la
   * fiche posee par-dessus : deux ecouteurs poses sur `window` recoivent la
   * meme touche, et rien dans l'ordre du DOM ne dit lequel est au-dessus.
   * C'est `App` qui tranche, parce que c'est lui qui sait quel panneau est
   * ouvert.
   */
  actif: boolean;
  nombre: number;
  surValider?: (index: number) => void;
  surFermer?: () => void;
  /** Touches propres a l'ecran. Rendre `true` si la touche a ete consommee. */
  surTouche?: (e: KeyboardEvent) => boolean;
  /** Les fleches horizontales naviguent aussi : onglets, rayons, grilles. */
  horizontal?: boolean;
}

/**
 * Navigation au clavier d'une liste : fleches, `Entree`, `Echap`, et les
 * chiffres pour atteindre directement une entree.
 *
 * Rend l'index VISE, que l'appelant pose en classe `--vise`. Le pointeur et le
 * clavier partagent cet index : survoler a la souris deplace le curseur clavier
 * et inversement. Deux curseurs concurrents — un survol et une selection — sont
 * la faute classique de ce genre de refonte : on ne sait plus lequel `Entree`
 * va valider.
 *
 * Une entree desactivee reste visable. Le joueur doit pouvoir lire un choix
 * qu'il ne peut pas payer et voir ce qui lui manque ; la sauter le ferait
 * disparaitre du parcours clavier alors qu'il est a l'ecran.
 */
export function useNavigationClavier({
  actif,
  nombre,
  surValider,
  surFermer,
  surTouche,
  horizontal = false,
}: OptionsNavigation): { vise: number; viser: (index: number) => void } {
  const [vise, setVise] = useState(0);

  // La liste change (nouvelle replique, nouveau rayon) : le curseur revient en
  // tete plutot que de pointer une entree qui n'existe plus.
  useEffect(() => {
    setVise((v) => (v >= nombre ? 0 : v));
  }, [nombre]);

  useEffect(() => {
    if (!actif) return;

    const onTouche = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (surTouche?.(e)) {
        e.preventDefault();
        return;
      }

      const suivant = e.key === 'ArrowDown' || (horizontal && e.key === 'ArrowRight');
      const precedent = e.key === 'ArrowUp' || (horizontal && e.key === 'ArrowLeft');

      if (suivant || precedent) {
        if (nombre === 0) return;
        e.preventDefault();
        setVise((v) => (v + (suivant ? 1 : -1) + nombre) % nombre);
        return;
      }

      if (e.key === 'Enter' && surValider && nombre > 0) {
        e.preventDefault();
        surValider(vise);
        return;
      }

      if (e.key === 'Escape' && surFermer) {
        e.preventDefault();
        surFermer();
        return;
      }

      // Les chiffres ne sont pas un raccourci de confort : dans une palette de
      // sept lieux, atteindre le septieme demande six fleches, et c'est la
      // palette qu'on traverse le plus souvent de toute la partie.
      if (/^[1-9]$/.test(e.key) && surValider) {
        const index = Number(e.key) - 1;
        if (index < nombre) {
          e.preventDefault();
          setVise(index);
          surValider(index);
        }
      }
    };

    window.addEventListener('keydown', onTouche);
    return () => window.removeEventListener('keydown', onTouche);
  }, [actif, nombre, vise, horizontal, surValider, surFermer, surTouche]);

  return { vise, viser: setVise };
}
