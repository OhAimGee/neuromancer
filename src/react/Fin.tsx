import fins from '@data/fins.json';
import { useProfileStore } from '@/stores/profileStore';

interface Carton {
  nom: string;
  sous_titre: string;
}

const FINS = fins as unknown as Record<string, Carton>;
/** Le `_note` du JSON n'est pas une fin : il ne compte pas au denominateur. */
const TOTAL_PREVU = 8;

/**
 * Carton de fin de partie. Le recit de la fin est joue dans la boite de
 * dialogue comme n'importe quelle scene ; ce panneau ne fait que nommer ce
 * qu'on vient d'atteindre et proposer de recommencer.
 */
export function Fin({ id, onRejouer }: { id: string; onRejouer: () => void }) {
  const carton = FINS[id];
  const finsVues = useProfileStore((e) => e.finsVues);
  const parties = useProfileStore((e) => e.parties);

  return (
    <div className="fin">
      <p className="fin__etiquette">FIN ATTEINTE</p>
      <p className="fin__nom">{carton?.nom ?? id.toUpperCase()}</p>
      {carton && <p className="fin__sous">{carton.sous_titre}</p>}
      <p className="fin__compte">
        {finsVues.length}/{TOTAL_PREVU} FINS &middot; {parties} PARTIE{parties > 1 ? 'S' : ''}
      </p>
      <button className="net__bouton" onClick={onRejouer}>
        RECOMMENCER
      </button>
    </div>
  );
}
