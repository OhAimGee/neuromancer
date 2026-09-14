import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import gloses from '@data/gloses.json';
import type { MoteurDialogue } from '@/dialogue/moteur';
import { useProfileStore } from '@/stores/profileStore';
import { useRunStore } from '@/stores/runStore';
import type { Etiquette } from '@/types/jeu';

const GLOSES = gloses as Record<string, string>;

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

  const [entracteLu, setEntracteLu] = useState<string | null>(null);
  const [glosesNeuves, setGlosesNeuves] = useState<string[]>([]);
  const [rabEnBas, setRabEnBas] = useState(false);
  const signature = useRef('');

  useEffect(() => {
    moteur.demarrer();
  }, [moteur]);

  // Se caler sur la PREMIERE ligne nouvelle, et non sur le bas du journal :
  // un bloc de recit qui arrive d'un coup doit se lire depuis son debut, sinon
  // le joueur ne voit que sa derniere phrase.
  const lignesVues = useRef(0);
  useLayoutEffect(() => {
    const el = journalRef.current;
    if (!el) return;
    const premiereNouvelle = el.querySelector<HTMLElement>(
      `[data-ligne="${lignesVues.current}"]`,
    );
    if (premiereNouvelle) {
      // getBoundingClientRect et non offsetTop : les deux elements ne partagent
      // pas forcement le meme offsetParent.
      el.scrollTop +=
        premiereNouvelle.getBoundingClientRect().top - el.getBoundingClientRect().top;
    } else {
      el.scrollTop = el.scrollHeight;
    }
    lignesVues.current = etat.lignes.length;
    mesurerRab();
  }, [etat.lignes.length, etat.choix.length]);

  // Un pave de recit pousse les choix hors de l'ecran. Sans reperé, le joueur
  // croit la scene bloquee — il faut lui dire qu'il reste quelque chose dessous.
  const mesurerRab = useCallback(() => {
    const el = journalRef.current;
    if (!el) return;
    setRabEnBas(el.scrollHeight - el.scrollTop - el.clientHeight > 2);
  }, []);

  // Les explications de regle n'apparaissent qu'une fois par profil, au moment
  // ou la notion se presente. La signature evite que le double montage des
  // effets en mode strict ne consomme la glose avant qu'elle ne s'affiche.
  useEffect(() => {
    const sig = `${etat.lignes.length}|${etat.choix.map((c) => c.texte).join('|')}`;
    if (sig === signature.current) return;
    signature.current = sig;

    const profil = useProfileStore.getState();
    const candidats: string[] = [];
    for (const c of etat.choix) {
      if (c.etiquette) candidats.push(`etq:${c.etiquette}`);
      if (c.cout.humanite > 0) candidats.push('cout:humanite');
      if (c.cout.credits > 0) candidats.push('cout:credits');
      if (c.cout.cycles > 0) candidats.push('cout:cycles');
    }
    if (etat.termine) candidats.push('horloge');

    const neuves = [...new Set(candidats)].filter((id) => GLOSES[id] && !profil.aVuGlose(id));
    for (const id of neuves) profil.marquerGlose(id);
    setGlosesNeuves(neuves);
  }, [etat]);

  const entracte = etat.entracte !== null && etat.entracte !== entracteLu ? etat.entracte : null;
  const fermerEntracte = useCallback(() => setEntracteLu(etat.entracte), [etat.entracte]);

  useEffect(() => {
    if (entracte === null) return;
    const onTouche = () => fermerEntracte();
    window.addEventListener('keydown', onTouche);
    return () => window.removeEventListener('keydown', onTouche);
  }, [entracte, fermerEntracte]);

  const locuteur = etat.lignes.at(-1)?.locuteur ?? null;
  const dejaRendu = new Set<string>();

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

        <div className="dlg__journal" ref={journalRef} onScroll={mesurerRab}>
          {etat.lignes.map((l, i) => {
            // Le tiret cadratin en tete est la convention du projet pour une
            // parole ; le reste est de la narration. Les distinguer a l'oeil
            // evite au joueur de devoir deviner qui parle.
            const classes = l.replique
              ? 'dlg__ligne dlg__ligne--replique'
              : l.texte.startsWith('—')
                ? 'dlg__ligne dlg__ligne--dit'
                : 'dlg__ligne';
            return (
              <p key={i} className={classes} data-ligne={i}>
                {l.texte}
              </p>
            );
          })}

          {etat.choix.length > 0 && (
            <div className="dlg__choix">
              {etat.choix.map((c) => {
                const miennes: string[] = [];
                const reclamer = (id: string) => {
                  if (glosesNeuves.includes(id) && !dejaRendu.has(id)) {
                    dejaRendu.add(id);
                    miennes.push(id);
                  }
                };
                if (c.etiquette) reclamer(`etq:${c.etiquette}`);
                if (c.cout.humanite > 0) reclamer('cout:humanite');
                if (c.cout.credits > 0) reclamer('cout:credits');
                if (c.cout.cycles > 0) reclamer('cout:cycles');

                return (
                  <div key={c.index}>
                    <button
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
                    {miennes.map((id) => (
                      <p key={id} className="dlg__glose">
                        {GLOSES[id]}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {etat.termine && (
            <div className="dlg__fin">
              <p>— FIN DE SCÈNE —</p>
              {glosesNeuves.includes('horloge') && (
                <p className="dlg__glose dlg__glose--large">{GLOSES['horloge']}</p>
              )}
              {onBrancher && (
                <button className="net__bouton" onClick={onBrancher}>
                  SE BRANCHER SUR LA CABINE
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {rabEnBas && <div className="dlg__suite" aria-hidden="true" />}

      {entracte !== null && (
        <div className="entracte" onClick={fermerEntracte} role="presentation">
          <p className="entracte__texte">{entracte}</p>
          <p className="entracte__aide">appuie sur une touche</p>
        </div>
      )}
    </div>
  );
}
