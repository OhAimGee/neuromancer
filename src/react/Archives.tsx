import { useMemo, useState } from 'react';
import fins from '@data/fins.json';
import hackingData from '@data/hacking.json';
import infosData from '@data/infos.json';
import personnages from '@data/personnages.json';
import { useProfileStore } from '@/stores/profileStore';
import { useNavigationClavier } from './useNavigationClavier';

interface Info {
  titre: string;
  source: string;
  texte: string;
  ouvre: string;
}

interface Personnage {
  nom: string;
  portrait: string | null;
  carnet?: string;
}

interface Fin {
  nom: string;
  sous_titre: string;
}

const INFOS = infosData as unknown as Record<string, Info>;
const PERSONNAGES = personnages as unknown as Record<string, Personnage>;
const FINS = fins as unknown as Record<string, Fin>;

const ONGLETS = ['CE QUE TU SAIS', 'CARNET', 'FINS'] as const;

/**
 * Une silhouette a la longueur du vrai titre.
 *
 * Montrer qu'il reste quelque chose, et combien, sans rien reveler : c'est le
 * moteur de rejouabilite rendu visible. Une case vide ne donne envie de rien ;
 * un titre casse a la bonne longueur, si.
 */
function silhouette(texte: string): string {
  return texte.replace(/[^\s—·/]/g, '█');
}

export function Archives({ onFermer, actif = true }: { onFermer: () => void; actif?: boolean }) {
  const connaissances = useProfileStore((e) => e.connaissances);
  const rencontres = useProfileStore((e) => e.rencontres);
  const finsVues = useProfileStore((e) => e.finsVues);
  const parties = useProfileStore((e) => e.parties);
  const [onglet, setOnglet] = useState(0);

  const carnet = useMemo(
    () =>
      Object.entries(PERSONNAGES).filter(
        ([id, p]) => !id.startsWith('_') && p.portrait !== null && p.carnet !== undefined,
      ),
    [],
  );
  const idsFins = useMemo(() => Object.keys(FINS).filter((id) => !id.startsWith('_')), []);

  useNavigationClavier({
    actif,
    nombre: 0,
    surFermer: onFermer,
    surTouche: (e) => {
      if (e.key === 'ArrowRight') {
        setOnglet((o) => (o + 1) % ONGLETS.length);
        return true;
      }
      if (e.key === 'ArrowLeft') {
        setOnglet((o) => (o - 1 + ONGLETS.length) % ONGLETS.length);
        return true;
      }
      return false;
    },
  });

  const comptes = [
    `${hackingData.infos.filter((id) => connaissances.has(id)).length}/${hackingData.infos.length}`,
    `${carnet.filter(([id]) => rencontres.has(id)).length}/${carnet.length}`,
    `${finsVues.length}/${idsFins.length}`,
  ];

  return (
    <div className="arch" role="dialog" aria-label="Archives">
      <div className="arch__haut">
        <span className="arch__titre">ARCHIVES</span>
        <span className="arch__parties">
          {parties} partie{parties > 1 ? 's' : ''}
        </span>
      </div>

      <div className="arch__onglets">
        {ONGLETS.map((o, i) => (
          <button
            key={o}
            className={`arch__onglet${i === onglet ? ' arch__onglet--actif' : ''}`}
            onClick={() => setOnglet(i)}
          >
            {o} {comptes[i]}
          </button>
        ))}
      </div>

      <div className="arch__corps">
        {onglet === 0 &&
          hackingData.infos.map((id) => {
            const info = INFOS[id];
            if (!info) return null;
            const su = connaissances.has(id);
            return (
              <article key={id} className={su ? 'arch__fiche' : 'arch__fiche arch__fiche--inconnue'}>
                <h3 className="arch__plaque">{su ? info.titre : silhouette(info.titre)}</h3>
                {/* La source reste lisible meme inconnue : elle dit ou chercher,
                  * et c'est ce qui fait la difference entre une case vide et un
                  * objectif. */}
                <p className="arch__source">{info.source}</p>
                {su && (
                  <>
                    <p className="arch__texte">{info.texte}</p>
                    <p className="arch__ouvre">↳ {info.ouvre}</p>
                  </>
                )}
              </article>
            );
          })}

        {onglet === 1 &&
          carnet.map(([id, p]) => {
            const vu = rencontres.has(id);
            return (
              <article key={id} className={vu ? 'arch__tete' : 'arch__tete arch__tete--inconnue'}>
                <i
                  className="arch__portrait"
                  style={{ backgroundImage: `url(/assets/portraits/${p.portrait}.png)` }}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="arch__plaque">{vu ? p.nom : silhouette(p.nom)}</h3>
                  <p className="arch__texte">{vu ? p.carnet : 'Jamais croisé.'}</p>
                </div>
              </article>
            );
          })}

        {onglet === 2 &&
          idsFins.map((id) => {
            const fin = FINS[id];
            if (!fin) return null;
            const vue = finsVues.includes(id);
            return (
              <article
                key={id}
                className={vue ? 'arch__fiche' : 'arch__fiche arch__fiche--inconnue'}
              >
                <h3 className="arch__plaque">{vue ? fin.nom : silhouette(fin.nom)}</h3>
                {/* Le sous-titre d'une fin inconnue n'est pas mis en silhouette :
                  * il est ecrit en Jersey 10, dont le bloc plein n'a pas la meme
                  * chasse que les autres glyphes — la barre se brisait en
                  * morceaux de hauteurs differentes et se lisait comme un bug. */}
                <p className="arch__texte">{vue ? fin.sous_titre : 'Jamais atteinte.'}</p>
              </article>
            );
          })}
      </div>

      <div className="arch__bas">
        <span className="arch__aide">← → onglets</span>
        <button className="net__bouton arch__fermer" onClick={onFermer}>
          FERMER
        </button>
      </div>
    </div>
  );
}
