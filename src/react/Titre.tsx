import { useEffect, useState } from 'react';
import { useDecor } from './useDecor';
import { useNavigationClavier } from './useNavigationClavier';

export type Niveau = 'ok' | 'warn' | 'err' | 'dim';
export interface LigneBoot {
  texte: string;
  niveau: Niveau;
}

const CLASSE: Record<Niveau, string> = {
  ok: 'boot__ok',
  warn: 'boot__warn',
  err: 'boot__err',
  dim: 'boot__dim',
};

/**
 * Le faux journal de demarrage ne coute rien et il installe le ton : on entre
 * dans le jeu par une machine qui se plaint. Deux secondes, et la premiere
 * touche le saute — une sequence d'ouverture qu'on ne peut pas passer devient
 * une punition des la deuxieme partie.
 */
const DUREE_BOOT = 2000;

interface Entree {
  id: string;
  libelle: string;
  faire: () => void;
  actif: boolean;
}

export function Titre(props: {
  lignes: LigneBoot[];
  pret: boolean;
  onDemarrer: () => void;
  onOptions: () => void;
  actif: boolean;
}) {
  const [phase, setPhase] = useState<'boot' | 'titre'>('boot');

  useEffect(() => {
    if (phase === 'titre') return;
    const t = window.setTimeout(() => setPhase('titre'), DUREE_BOOT);
    // Le saut ne doit pas valider l'entree de menu par la meme occasion : le
    // crochet de navigation du menu ne s'abonne qu'une fois la phase changee,
    // donc la touche qui saute le journal ne l'atteint jamais.
    const sauter = () => setPhase('titre');
    window.addEventListener('keydown', sauter);
    window.addEventListener('pointerdown', sauter);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', sauter);
      window.removeEventListener('pointerdown', sauter);
    };
  }, [phase]);

  if (phase === 'boot') {
    return (
      <div className="boot">
        {props.lignes.map((l, i) => (
          <div key={i} className={`boot__line ${CLASSE[l.niveau]}`}>
            {l.texte}
          </div>
        ))}
        <div className="boot__line boot__caret">{'> '}</div>
      </div>
    );
  }
  return <EcranTitre {...props} />;
}

/**
 * Le titre proprement dit. Composant separe, et ce n'est pas du decoupage de
 * confort : `useDecor` monte son canvas Pixi au premier effet, donc l'hote doit
 * etre dans le DOM des le premier rendu. Tant que le journal de demarrage
 * occupait l'ecran, le montage partait sans hote, `SceneJeu` notait un decor en
 * attente que plus rien ne reclamait, et le titre s'affichait sur du noir —
 * sans une erreur nulle part.
 */
function EcranTitre({
  lignes,
  pret,
  onDemarrer,
  onOptions,
  actif,
}: {
  lignes: LigneBoot[];
  pret: boolean;
  onDemarrer: () => void;
  onOptions: () => void;
  actif: boolean;
}) {
  const hote = useDecor('titre');

  const entrees: Entree[] = [
    { id: 'nouvelle', libelle: 'NOUVELLE PARTIE', faire: onDemarrer, actif: pret },
    { id: 'options', libelle: 'OPTIONS', faire: onOptions, actif: true },
  ];

  const { vise, viser } = useNavigationClavier({
    actif,
    nombre: entrees.length,
    surValider: (i) => {
      const e = entrees[i];
      if (e?.actif) e.faire();
    },
    // Echap ouvre les options depuis le titre comme depuis la partie. Il est
    // branche ICI et non dans `App` : l'ecran-titre ecoute deja le clavier, et
    // un second ecouteur pose sur le meme ecran est la faute que le crochet
    // existe pour empecher.
    surTouche: (e) => {
      if (e.key !== 'Escape') return false;
      onOptions();
      return true;
    },
  });

  const echec = lignes.some((l) => l.niveau === 'err');

  return (
    <div className="titre">
      <div className="decor" ref={hote} aria-hidden="true" />
      <div className="pluie" aria-hidden="true" />
      <div className="titre__voile" aria-hidden="true" />

      <div className="titre__bloc">
        <img className="titre__logo" src="/assets/ui/logo_titre.png" alt="NEUROMANCER" />
        <p className="titre__sous">CHIBA CITY &middot; 12 CYCLES &middot; AUCUN RETOUR</p>

        {echec ? (
          <ul className="titre__menu">
            {lignes
              .filter((l) => l.niveau === 'err')
              .map((l, i) => (
                <li key={i} className="titre__echec">
                  {l.texte}
                </li>
              ))}
          </ul>
        ) : (
          <ul className="titre__menu">
            {entrees.map((e, i) => (
              <li key={e.id}>
                <button
                  className={`titre__entree${i === vise ? ' titre__entree--vise' : ''}`}
                  disabled={!e.actif}
                  onPointerEnter={() => viser(i)}
                  onClick={() => e.actif && e.faire()}
                >
                  {e.libelle}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="titre__pied">
        Fan project non commercial &middot; d&apos;apr&egrave;s William Gibson, 1984
      </p>
    </div>
  );
}
