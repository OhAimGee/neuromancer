import equipage from '@data/equipage.json';
import hackingData from '@data/hacking.json';
import { IMPLANTS } from '@/hacking/implants';
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

// L'ORDRE des planches d'icones est celui de data/hacking.json. Reordonner la
// donnee sans reordonner la planche donnerait le mauvais dessin, en silence.
const RANG_SCRIPT = new Map(SCRIPTS.map((s, i) => [s.id, i]));
const RANG_PLAN = new Map(hackingData.plans.map((id, i) => [id, i]));
const RANG_IMPLANT = new Map(IMPLANTS.map((i, rang) => [i.id, rang]));
const NOM_IMPLANT = new Map(IMPLANTS.map((i) => [i.id, i.nom]));

/** Une case d'une planche d'icones de 16x16, designee par son rang. */
function Vignette({ planche, rang }: { planche: string; rang: number }) {
  return (
    <i
      className="vignette"
      style={{
        backgroundImage: `url(/assets/ui/${planche}.png)`,
        backgroundPositionX: `calc(${-16 * rang} * var(--px))`,
      }}
      aria-hidden="true"
    />
  );
}

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
        {/* Meme regle que le HUD : pas d'horloge avant que le recit ne la
          * lance. La fiche est atteignable des l'ouverture. */}
        {run.horlogeLancee && (
          <>
            <span className="etat__cle">CYCLES</span>
            <span className="etat__val">{run.cycles}</span>
          </>
        )}
        <span className="etat__cle">HUMANITÉ</span>
        <span className="etat__val">{run.humanite}</span>
        <span className="etat__cle">CRÉDITS</span>
        <span className="etat__val">{run.credits}</span>
      </div>

      <p className="etat__section">
        <span>COMPÉTENCES</span>
      </p>
      <div className="etat__grille">
        {Object.entries(run.competences).map(([nom, n]) => (
          <span key={nom} className="etat__paire">
            <span className="etat__cle">{nom.toUpperCase()}</span>
            <span className="etat__val">{n}</span>
          </span>
        ))}
      </div>

      <p className="etat__section">
        <span>
          ÉQUIPAGE {run.equipage.length}/{MEMBRES_MAX}
        </span>
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

      <p className="etat__section">
        <i className="icone icone--scripts" aria-hidden="true" />
        <span>SCRIPTS</span>
      </p>
      <ul className="etat__objets">
        {run.scripts.map((id) => (
          <li key={id}>
            <Vignette planche="items_scripts" rang={RANG_SCRIPT.get(id) ?? 0} />
            {NOM_SCRIPT.get(id) ?? id}
          </li>
        ))}
      </ul>

      {run.implants.length > 0 && (
        <>
          <p className="etat__section">
            <i className="icone icone--plans" aria-hidden="true" />
            <span>IMPLANTS POSÉS</span>
          </p>
          <ul className="etat__objets">
            {run.implants.map((id) => (
              <li key={id}>
                <Vignette planche="items_implants" rang={RANG_IMPLANT.get(id) ?? 0} />
                {NOM_IMPLANT.get(id) ?? id.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Un plan deja pose reste au dossier : c'est de l'information volee, pas
        * une piece consommee. Le montrer deux fois serait faux, d'ou le filtre. */}
      {run.plans.some((id) => !run.implants.includes(id)) && (
        <>
          <p className="etat__section">
            <i className="icone icone--plans" aria-hidden="true" />
            <span>PLANS</span>
          </p>
          <ul className="etat__objets">
            {run.plans
              .filter((id) => !run.implants.includes(id))
              .map((id) => (
                <li key={id}>
                  <Vignette planche="items_plans" rang={RANG_PLAN.get(id) ?? 0} />
                  {NOM_IMPLANT.get(id) ?? id.replace(/_/g, ' ')}
                </li>
              ))}
          </ul>
        </>
      )}

      <p className="etat__section">
        <i className="icone icone--infos" aria-hidden="true" />
        <span>
          CE QUE TU SAIS ({infosConnues.length}/{hackingData.infos.length})
        </span>
      </p>
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
