import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MoteurDialogue } from '@/dialogue/moteur';
import { useRunStore } from '@/stores/runStore';
import { useUiStore } from '@/stores/uiStore';
import { Cyberespace } from './Cyberespace';
import { Decor } from './Decor';
import { Dialogue } from './Dialogue';
import { Fin } from './Fin';
import { Etat } from './Etat';
import { Options } from './Options';
import { useIntegerScale, VIEWPORT_W, VIEWPORT_H } from './useIntegerScale';

type Niveau = 'ok' | 'warn' | 'err' | 'dim';
type Couche = 'titre' | 'jeu' | 'fiche' | 'options';
type Ligne = { texte: string; niveau: Niveau };

const CLASSE: Record<Niveau, string> = {
  ok: 'boot__ok',
  warn: 'boot__warn',
  err: 'boot__err',
  dim: 'boot__dim',
};

export function App() {
  const scale = useIntegerScale();
  const scanlines = useUiStore((e) => e.scanlines);
  const glitch = useUiStore((e) => e.glitch);
  const [options, setOptions] = useState(false);
  const [fiche, setFiche] = useState(false);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [moteur, setMoteur] = useState<MoteurDialogue | null>(null);
  const [lance, setLance] = useState(false);
  const [plongee, setPlongee] = useState(0);
  const demarre = useRef(false);

  useEffect(() => {
    // React 19 monte deux fois les effets en mode strict.
    if (demarre.current) return;
    demarre.current = true;

    const pousser = (texte: string, niveau: Niveau = 'dim') =>
      setLignes((l) => [...l, { texte, niveau }]);

    (async () => {
      pousser('CHIBA CITY / RESEAU LOCAL');
      pousser('interface neurale ......... DEGRADEE', 'warn');
      try {
        const m = await MoteurDialogue.charger();
        pousser('trame narrative ........... CHARGEE', 'ok');
        pousser('moteur ink ................ EN LIGNE', 'ok');
        setMoteur(m);
      } catch (e) {
        pousser('trame narrative ........... ECHEC', 'err');
        pousser(e instanceof Error ? e.message : String(e), 'err');
      }
    })();
  }, []);

  const demarrer = useCallback(() => {
    if (!moteur || lance) return;
    useRunStore.getState().nouvellePartie();
    setLance(true);
  }, [moteur, lance]);

  // La partie se rejoue en rechargeant : le recit Ink est une machine a etat
  // qu'on ne remet pas a zero a moitie. Repartir d'une Story neuve est la seule
  // remise a zero honnete.
  const rejouer = useCallback(() => {
    useRunStore.getState().nouvellePartie();
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!moteur || lance) return;
    const onTouche = (e: Event) => {
      // Le bouton d'options est au-dessus de l'ecran de demarrage : y cliquer
      // ne doit pas lancer la partie par la meme occasion.
      if (e.target instanceof Element && e.target.closest('.opt, .opt__ouvrir, .etat')) return;
      demarrer();
    };
    window.addEventListener('keydown', onTouche);
    window.addEventListener('pointerdown', onTouche);
    return () => {
      window.removeEventListener('keydown', onTouche);
      window.removeEventListener('pointerdown', onTouche);
    };
  }, [moteur, lance, demarrer]);

  // Quel ecran est au-dessus. Un seul ecoute le clavier : deux ecouteurs poses
  // sur `window` recoivent la meme touche, et rien dans l'ordre du DOM ne dit
  // lequel est devant. C'est ici qu'on tranche, parce que c'est ici qu'on sait
  // quel panneau est ouvert.
  const couche: Couche = !lance ? 'titre' : options ? 'options' : fiche ? 'fiche' : 'jeu';

  // Echap FERME d'abord ce qui est ouvert, et n'ouvre les options que s'il n'y
  // a rien a fermer — c'est ce que le joueur attend de cette touche. Tab
  // bascule la fiche de partie. Les panneaux gerent leur propre Echap ; celui-ci
  // ne sert qu'a l'ouvrir depuis la scene.
  useEffect(() => {
    if (couche !== 'jeu' && couche !== 'titre') return;
    const onTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOptions(true);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (lance) setFiche((v) => !v);
      }
    };
    window.addEventListener('keydown', onTouche);
    return () => window.removeEventListener('keydown', onTouche);
  }, [couche, lance]);

  return (
    <div className="stage">
      <div
        className={`viewport${scanlines ? ' scanlines' : ''}${glitch ? ' glitch' : ''}`}
        style={{ '--s': scale } as React.CSSProperties}
      >
        {lance && moteur ? (
          <Partie
            moteur={moteur}
            plongee={plongee}
            surPlongee={setPlongee}
            onRejouer={rejouer}
            actif={couche === 'jeu'}
          />
        ) : (
          <div className="boot">
            {lignes.map((l, i) => (
              <div key={i} className={`boot__line ${CLASSE[l.niveau]}`}>
                {l.texte}
              </div>
            ))}
            {moteur && (
              <>
                <img className="boot__logo" src="/assets/ui/logo_titre.png" alt="NEUROMANCER" />
                <div className="boot__sub">CHIBA CITY &middot; 12 CYCLES</div>
                <div className="boot__line boot__caret" style={{ marginTop: 10 }}>
                  {'> '}
                </div>
              </>
            )}
          </div>
        )}

        {lance && (
          <button
            className="opt__ouvrir opt__ouvrir--fiche"
            onClick={() => setFiche(true)}
            aria-label="Fiche de partie"
            title="Fiche de partie (Tab)"
          >
            ▤
          </button>
        )}
        <button
          className="opt__ouvrir"
          onClick={() => setOptions(true)}
          aria-label="Options"
          title="Options (Échap)"
        >
          ⚙
        </button>

        {fiche && lance && <Etat onFermer={() => setFiche(false)} actif={couche === 'fiche'} />}
        {options && <Options onFermer={() => setOptions(false)} actif={couche === 'options'} />}
      </div>

      <div className="filigrane">
        {VIEWPORT_W}&times;{VIEWPORT_H} &middot; &times;{scale}
      </div>
    </div>
  );
}

/**
 * Aiguillage d'une partie en cours : le recit, la matrice, ou le carton de fin.
 *
 * C'est le recit qui decide : `plonger()` ouvre la matrice et nomme le knot de
 * retour, `# ending:` ferme la partie. Le jeu n'a plus de bouton cable en dur
 * vers le cyberespace.
 */
function Partie({
  moteur,
  plongee,
  surPlongee,
  onRejouer,
  actif,
}: {
  moteur: MoteurDialogue;
  plongee: number;
  surPlongee: (f: (n: number) => number) => void;
  onRejouer: () => void;
  actif: boolean;
}) {
  const etat = useSyncExternalStore(moteur.souscrire, moteur.lire);
  const numero = useRef(plongee);

  // Le passage d'un cote a l'autre du cable merite d'etre vu. Sans lui, la rue
  // devient la matrice entre deux images et le joueur ne sait pas ce qui vient
  // de se produire — c'est le geste central du jeu, il ne doit pas etre gratuit.
  const dansLaMatrice = etat.plongee !== null;
  const [branchement, setBranchement] = useState<'entree' | 'sortie' | null>(null);
  const etaitDedans = useRef(dansLaMatrice);
  useEffect(() => {
    if (etaitDedans.current === dansLaMatrice) return;
    setBranchement(dansLaMatrice ? 'entree' : 'sortie');
    etaitDedans.current = dansLaMatrice;
    const t = window.setTimeout(() => setBranchement(null), 620);
    return () => window.clearTimeout(t);
  }, [dansLaMatrice]);

  const voile =
    branchement !== null ? (
      <div className={`jack jack--${branchement}`} aria-hidden="true" />
    ) : null;

  const sortir = useCallback(
    (flatline: boolean) => {
      surPlongee((n) => n + 1);
      moteur.terminerPlongee(flatline);
    },
    [moteur, surPlongee],
  );

  if (etat.plongee !== null) {
    numero.current = plongee;
    return (
      <>
        <Cyberespace
          pointAcces={etat.plongee}
          graine={`plongee-${plongee}`}
          onSortie={sortir}
          actif={actif}
        />
        {voile}
      </>
    );
  }

  return (
    <>
      <Decor moteur={moteur} />
      <Dialogue moteur={moteur} actif={actif && etat.fin === null} />
      {etat.fin !== null && !etat.peutContinuer && (
        <Fin id={etat.fin} onRejouer={onRejouer} />
      )}
      {voile}
    </>
  );
}
