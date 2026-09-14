import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MoteurDialogue } from '@/dialogue/moteur';
import { useRunStore } from '@/stores/runStore';
import { useUiStore } from '@/stores/uiStore';
import { Cyberespace } from './Cyberespace';
import { Decor } from './Decor';
import { Dialogue } from './Dialogue';
import { Fin } from './Fin';
import { useIntegerScale, VIEWPORT_W, VIEWPORT_H } from './useIntegerScale';

type Niveau = 'ok' | 'warn' | 'err' | 'dim';
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
    const onTouche = () => demarrer();
    window.addEventListener('keydown', onTouche);
    window.addEventListener('pointerdown', onTouche);
    return () => {
      window.removeEventListener('keydown', onTouche);
      window.removeEventListener('pointerdown', onTouche);
    };
  }, [moteur, lance, demarrer]);

  return (
    <div className="stage">
      <div
        className={scanlines ? 'viewport scanlines' : 'viewport'}
        style={{ '--s': scale } as React.CSSProperties}
      >
        {lance && moteur ? (
          <Partie moteur={moteur} plongee={plongee} surPlongee={setPlongee} onRejouer={rejouer} />
        ) : (
          <div className="boot">
            {lignes.map((l, i) => (
              <div key={i} className={`boot__line ${CLASSE[l.niveau]}`}>
                {l.texte}
              </div>
            ))}
            {moteur && (
              <>
                <div className="boot__title">NEUROMANCER</div>
                <div className="boot__sub">CHIBA CITY &middot; 12 CYCLES</div>
                <div className="boot__line boot__caret" style={{ marginTop: 10 }}>
                  {'> '}
                </div>
              </>
            )}
          </div>
        )}
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
}: {
  moteur: MoteurDialogue;
  plongee: number;
  surPlongee: (f: (n: number) => number) => void;
  onRejouer: () => void;
}) {
  const etat = useSyncExternalStore(moteur.souscrire, moteur.lire);
  const numero = useRef(plongee);

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
      <Cyberespace
        pointAcces={etat.plongee}
        graine={`plongee-${plongee}`}
        onSortie={sortir}
      />
    );
  }

  return (
    <>
      <Decor moteur={moteur} />
      <Dialogue moteur={moteur} />
      {etat.fin !== null && !etat.peutContinuer && (
        <Fin id={etat.fin} onRejouer={onRejouer} />
      )}
    </>
  );
}
