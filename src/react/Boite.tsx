import personnages from '@data/personnages.json';
import type { LigneDialogue } from '@/types/jeu';

interface Personnage {
  nom: string;
  portrait: string | null;
}

const PERSONNAGES = personnages as unknown as Record<string, Personnage>;

/**
 * La boite de dialogue, a la maniere d'un RPG au tour par tour.
 *
 * Une seule replique a la fois, en bas de l'ecran, laissant la scene visible
 * au-dessus. Une parole porte le nom et le portrait de qui la prononce ; la
 * narration n'en porte pas, et c'est ce qui les distingue au premier coup
 * d'oeil — sans avoir a lire pour deviner qui parle.
 */
export function Boite({
  ligne,
  texte,
  peutContinuer,
  onContinuer,
}: {
  ligne: LigneDialogue;
  /** Texte a afficher : partiel tant que la machine a ecrire n'a pas fini. */
  texte: string;
  peutContinuer: boolean;
  onContinuer: () => void;
}) {
  const perso = ligne.locuteur ? PERSONNAGES[ligne.locuteur] : undefined;
  const nom = ligne.dite ? (perso?.nom ?? null) : null;
  const portrait = ligne.dite ? (ligne.portrait ?? perso?.portrait ?? null) : null;

  return (
    <div
      className={[
        'boite',
        ligne.dite ? 'boite--dite' : 'boite--recit',
        ligne.locuteur === 'fragment' ? 'boite--fragment' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onContinuer}
      role="presentation"
    >
      {nom && <span className="boite__nom">{nom}</span>}

      <div className="boite__corps">
        {portrait && (
          <div
            className="boite__portrait"
            style={{ backgroundImage: `url(/assets/portraits/${portrait}.png)` }}
            aria-hidden="true"
          />
        )}
        <p className="boite__texte">{texte}</p>
      </div>

      {peutContinuer && <span className="boite__suite" aria-hidden="true" />}
    </div>
  );
}
