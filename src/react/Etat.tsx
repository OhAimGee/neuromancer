import equipage from '@data/equipage.json';
import hackingData from '@data/hacking.json';
import { SCRIPTS } from '@/hacking/session';
import { useProfileStore } from '@/stores/profileStore';
import { MEMBRES_MAX, useRunStore } from '@/stores/runStore';

interface Membre {
  nom: string;
  role: string;
  competence: string;
  bonus: number;
  loyaute: string;
}

const MEMBRES = equipage.membres as unknown as Record<string, Membre>;
const NOM_SCRIPT = new Map(SCRIPTS.map((s) => [s.id, s.nom]));

/**
 * Fiche de partie : ce que Sable a, sait et emmene.
 *
 * Un RPG narratif sans cet ecran oblige a se souvenir de ce qu'on a pillé trois
 * plongees plus tot. Les connaissances y figurent parce qu'elles sont la vraie
 * progression du jeu — elles survivent a la partie, pas l'inventaire.
 */
export function Etat({ onFermer }: { onFermer: () => void }) {
  const run = useRunStore();
  const connaissances = useProfileStore((e) => e.connaissances);
  const infosConnues = hackingData.infos.filter((id) => connaissances.has(id));

  return (
    <div className="etat" role="dialog" aria-label="Fiche de partie">
      <p className="etat__titre">SABLE</p>

      <div className="etat__grille">
        <span className="etat__cle">CYCLES</span>
        <span className="etat__val">{run.cycles}</span>
        <span className="etat__cle">HUMANITÉ</span>
        <span className="etat__val">{run.humanite}</span>
        <span className="etat__cle">CRÉDITS</span>
        <span className="etat__val">{run.credits}</span>
      </div>

      <p className="etat__section">COMPÉTENCES</p>
      <div className="etat__grille">
        {Object.entries(run.competences).map(([nom, n]) => (
          <span key={nom} className="etat__paire">
            <span className="etat__cle">{nom.toUpperCase()}</span>
            <span className="etat__val">{n}</span>
          </span>
        ))}
      </div>

      <p className="etat__section">
        ÉQUIPAGE {run.equipage.length}/{MEMBRES_MAX}
      </p>
      {run.equipage.length === 0 ? (
        <p className="etat__vide">Personne. Tu fais ça seul.</p>
      ) : (
        <ul className="etat__liste">
          {run.equipage.map((id) => (
            <li key={id}>
              <b>{MEMBRES[id]?.nom ?? id.toUpperCase()}</b> — {MEMBRES[id]?.role ?? '?'}
            </li>
          ))}
        </ul>
      )}

      <p className="etat__section">SCRIPTS</p>
      <p className="etat__ligne">{run.scripts.map((s) => NOM_SCRIPT.get(s) ?? s).join(' · ')}</p>

      {run.plans.length > 0 && (
        <>
          <p className="etat__section">PLANS</p>
          <p className="etat__ligne">{run.plans.join(' · ')}</p>
        </>
      )}

      <p className="etat__section">CE QUE TU SAIS ({infosConnues.length}/{hackingData.infos.length})</p>
      {infosConnues.length === 0 ? (
        <p className="etat__vide">Rien qu'on ne t'ait dit.</p>
      ) : (
        <ul className="etat__liste">
          {infosConnues.map((id) => (
            <li key={id}>{id.replace(/_/g, ' ')}</li>
          ))}
        </ul>
      )}

      <button className="net__bouton etat__fermer" onClick={onFermer}>
        FERMER
      </button>
    </div>
  );
}
