import { useEffect, useRef, useState } from 'react';
import { Story } from 'inkjs';
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
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [pret, setPret] = useState(false);
  const lance = useRef(false);

  useEffect(() => {
    // React 19 monte deux fois les effets en mode strict.
    if (lance.current) return;
    lance.current = true;

    const pousser = (texte: string, niveau: Niveau = 'dim') =>
      setLignes((l) => [...l, { texte, niveau }]);

    (async () => {
      pousser('CHIBA CITY / RESEAU LOCAL');
      pousser('interface neurale ......... DEGRADEE', 'warn');

      try {
        const reponse = await fetch('/content/main.ink.json');
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
        const story = new Story(await reponse.json());
        const knots = story.mainContentContainer.namedContent.size;
        pousser(`trame narrative ........... ${knots} noeuds`, 'ok');
        pousser('moteur ink ................ EN LIGNE', 'ok');
        setPret(true);
      } catch (e) {
        pousser(`trame narrative ........... ECHEC`, 'err');
        pousser(e instanceof Error ? e.message : String(e), 'err');
      }
    })();
  }, []);

  return (
    <div className="stage">
      <div className="viewport scanlines" style={{ transform: `scale(${scale})` }}>
        <div className="boot">
          {lignes.map((l, i) => (
            <div key={i} className={`boot__line ${CLASSE[l.niveau]}`}>
              {l.texte}
            </div>
          ))}

          {pret && (
            <>
              <div className="boot__title">NEUROMANCER</div>
              <div className="boot__sub">CHIBA CITY &middot; 12 CYCLES</div>
              <div className="boot__line boot__caret" style={{ marginTop: 10 }}>
                {'> '}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 6,
          right: 8,
          fontSize: 10,
          color: 'var(--n4)',
        }}
      >
        {VIEWPORT_W}&times;{VIEWPORT_H} &middot; &times;{scale}
      </div>
    </div>
  );
}
