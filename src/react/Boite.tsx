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
  peutContinuer,
  onContinuer,
}: {
  ligne: LigneDialogue;
  peutContinuer: boolean;
  onContinuer: () => void;
}) {
  const perso = ligne.locuteur ? PERSONNAGES[ligne.locuteur] : undefined;
  const nom = ligne.dite ? (perso?.nom ?? null) : null;
  const portrait = ligne.dite ? (ligne.portrait ?? perso?.portrait ?? null) : null;

  return (
    <div
      className={ligne.dite ? 'boite boite--dite' : 'boite boite--recit'}
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
        <p className="boite__texte">{ligne.texte}</p>
      </div>

      {peutContinuer && <span className="boite__suite" aria-hidden="true" />}
    </div>
  );
}
