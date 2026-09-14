import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import gloses from '@data/gloses.json';
import type { MoteurDialogue } from '@/dialogue/moteur';
import { useProfileStore } from '@/stores/profileStore';
import { useRunStore } from '@/stores/runStore';
import type { Etiquette } from '@/types/jeu';
import { Boite } from './Boite';

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

  const [entracteLu, setEntracteLu] = useState<string | null>(null);
  const [glosesNeuves, setGlosesNeuves] = useState<string[]>([]);
  const signature = useRef('');

  useEffect(() => {
    moteur.demarrer();
  }, [moteur]);

  // Les explications de regle n'apparaissent qu'une fois par profil, au moment
  // ou la notion se presente. La signature evite que le double montage des
  // effets en mode strict ne consomme la glose avant qu'elle ne s'affiche.
  useEffect(() => {
    const sig = `${etat.ligne?.texte ?? ''}|${etat.choix.map((c) => c.texte).join('|')}`;
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
  const continuer = useCallback(() => moteur.continuer(), [moteur]);

  // Espace et Entree font avancer la replique, comme dans tout RPG au tour par
  // tour. Le clic sur la boite fait la meme chose.
  useEffect(() => {
    const onTouche = (e: KeyboardEvent) => {
      if (entracte !== null) {
        fermerEntracte();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        continuer();
      }
    };
    window.addEventListener('keydown', onTouche);
    return () => window.removeEventListener('keydown', onTouche);
  }, [entracte, fermerEntracte, continuer]);

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

      <div className="dlg__bas">
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
                    <span className="dlg__etq" style={{ color: COULEUR_ETIQUETTE[c.etiquette] }}>
                      [{c.etiquette}]
                    </span>
                  )}
                  <span>{c.texte}</span>
                  {c.cout.humanite > 0 && <span className="dlg__cout">-{c.cout.humanite} HUM</span>}
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

      {etat.ligne && (
        <Boite ligne={etat.ligne} peutContinuer={etat.peutContinuer} onContinuer={continuer} />
      )}
      </div>

      {entracte !== null && (
        <div className="entracte" onClick={fermerEntracte} role="presentation">
          <p className="entracte__texte">{entracte}</p>
          <p className="entracte__aide">appuie sur une touche</p>
        </div>
      )}
    </div>
  );
}
