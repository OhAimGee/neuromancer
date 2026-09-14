import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { MoteurDialogue } from '@/dialogue/moteur';
import { useRunStore } from '@/stores/runStore';
import type { Etiquette } from '@/types/jeu';

const COULEUR_ETIQUETTE: Record<Etiquette, string> = {
  MENSONGE: 'var(--o2)',
  MENACE: 'var(--r2)',
  CONNAISSANCE: 'var(--c3)',
  FRAGMENT: 'var(--m3)',
  IMPLANT: 'var(--v2)',
  ACTION: 'var(--g0)',
};

interface Props {
  moteur: MoteurDialogue;
  /** Propose de se brancher une fois la scene close. */
  onBrancher?: () => void;
}

export function Dialogue({ moteur, onBrancher }: Props) {
  const etat = useSyncExternalStore(moteur.souscrire, moteur.lire);
  const cycles = useRunStore((e) => e.cycles);
  const humanite = useRunStore((e) => e.humanite);
  const journalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    moteur.demarrer();
  }, [moteur]);

  useLayoutEffect(() => {
    const el = journalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [etat.lignes.length, etat.choix.length]);

  const locuteur = etat.lignes.at(-1)?.locuteur ?? null;

  return (
    <div className="dlg">
      <div className="dlg__hud">
        <span>
          CYCLES <b>{cycles}</b>
        </span>
        <span>
          HUMANITÉ <b>{humanite}</b>
        </span>
      </div>

      <div className="dlg__corps">
        {locuteur && (
          <div className="dlg__portrait" data-perso={locuteur}>
            <span>{locuteur}</span>
          </div>
        )}

        <div className="dlg__journal" ref={journalRef}>
          {etat.lignes.map((l, i) => (
            <p key={i} className={l.replique ? 'dlg__ligne dlg__ligne--replique' : 'dlg__ligne'}>
              {l.texte}
            </p>
          ))}

          {etat.choix.length > 0 && (
            <div className="dlg__choix">
              {etat.choix.map((c) => (
                <button
                  key={c.index}
                  className="dlg__bouton"
                  disabled={!c.abordable}
                  onClick={() => moteur.choisir(c.index)}
                >
                  {c.etiquette && (
                    <span
                      className="dlg__etq"
                      style={{ color: COULEUR_ETIQUETTE[c.etiquette] }}
                    >
                      [{c.etiquette}]
                    </span>
                  )}
                  <span>{c.texte}</span>
                  {c.cout.humanite > 0 && (
                    <span className="dlg__cout">-{c.cout.humanite} HUM</span>
                  )}
                  {c.cout.credits > 0 && <span className="dlg__cout">-{c.cout.credits} cr</span>}
                </button>
              ))}
            </div>
          )}

          {etat.termine && (
            <div className="dlg__fin">
              <p>— FIN DE SCÈNE —</p>
              {onBrancher && (
                <button className="net__bouton" onClick={onBrancher}>
                  SE BRANCHER
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
