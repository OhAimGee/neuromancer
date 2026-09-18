import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import gloses from '@data/gloses.json';
import { audio } from '@/audio/bus';
import type { MoteurDialogue } from '@/dialogue/moteur';
import { useProfileStore } from '@/stores/profileStore';
import { useRunStore } from '@/stores/runStore';
import { useUiStore } from '@/stores/uiStore';
import type { Etiquette } from '@/types/jeu';
import { Boite } from './Boite';
import { useMachineAEcrire } from './useMachineAEcrire';
import { useNavigationClavier } from './useNavigationClavier';

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
  actif?: boolean;
}

export function Dialogue({ moteur, actif = true }: Props) {
  const etat = useSyncExternalStore(moteur.souscrire, moteur.lire);
  const cycles = useRunStore((e) => e.cycles);
  const humanite = useRunStore((e) => e.humanite);
  const horlogeLancee = useRunStore((e) => e.horlogeLancee);
  const vitesseTexte = useUiStore((e) => e.vitesseTexte);

  const { affiche, complet, toutReveler } = useMachineAEcrire(
    etat.ligne?.texte ?? '',
    vitesseTexte,
    etat.ligne,
  );

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
    const sig = `${etat.ligne?.texte ?? ''}|${etat.glose ?? ''}|${etat.choix.map((c) => c.texte).join('|')}`;
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
    // Le recit peut reclamer lui-meme une explication de regle, par `# glose:`.
    if (etat.glose) candidats.push(etat.glose);

    const neuves = [...new Set(candidats)].filter((id) => GLOSES[id] && !profil.aVuGlose(id));
    for (const id of neuves) profil.marquerGlose(id);
    setGlosesNeuves(neuves);
  }, [etat]);

  // Le son suit la replique affichee, pas la lecture d'avance du moteur : la
  // dependance est l'objet `ligne`, qui ne change qu'au changement de replique.
  useEffect(() => {
    audio.musique(etat.musique);
  }, [etat.musique]);
  useEffect(() => {
    if (etat.sfx) audio.effet(etat.sfx);
  }, [etat.ligne, etat.sfx]);

  const entracte = etat.entracte !== null && etat.entracte !== entracteLu ? etat.entracte : null;
  const fermerEntracte = useCallback(() => setEntracteLu(etat.entracte), [etat.entracte]);
  // Premiere pression : finir la replique. Seconde : passer a la suivante.
  // L'inverse ferait perdre des lignes a qui appuie vite.
  const continuer = useCallback(() => {
    if (!complet) {
      toutReveler();
      return;
    }
    moteur.continuer();
  }, [moteur, complet, toutReveler]);

  const choisir = useCallback(
    (index: number) => {
      const c = etat.choix[index];
      if (!c) return;
      audio.effet(c.abordable ? 'ui_valide' : 'ui_refus');
      if (c.abordable) moteur.choisir(c.index);
    },
    [etat.choix, moteur],
  );

  // Les choix ne sont navigables qu'une fois la replique ecrite — c'est la meme
  // condition que leur affichage. Tant qu'il reste du texte, la liste est vide
  // et le crochet laisse passer Espace et Entree a la lecture.
  const choixOuverts = etat.choix.length > 0 && complet;

  // Une touche pendant un entracte ne fait que le fermer : le carton bloque la
  // scene, et laisser passer Entree jusqu'aux choix ferait valider a l'aveugle
  // un choix que le joueur n'a pas encore vu.
  const surTouche = useCallback(
    (e: KeyboardEvent) => {
      if (entracte !== null) {
        fermerEntracte();
        return true;
      }
      if (e.key === ' ' || (e.key === 'Enter' && !choixOuverts)) {
        continuer();
        return true;
      }
      return false;
    },
    [entracte, fermerEntracte, continuer, choixOuverts],
  );

  const { vise, viser } = useNavigationClavier({
    actif,
    nombre: choixOuverts ? etat.choix.length : 0,
    surValider: choisir,
    surTouche,
  });

  const dejaRendu = new Set<string>();

  return (
    <div className="dlg">
      <div className="dlg__hud">
        {/* L'ouverture est un flashback de trois ans plus tot : la toxine n'y
            est pas encore posee. Afficher une fiole pleine et douze cycles y
            annoncerait un compte a rebours qui n'a pas commence — c'est le
            recit qui le lance, par `# horloge:demarrer`. */}
        <span>
          {horlogeLancee && (
            <>
              {/* La fiole se vide avant que le chiffre n'inquiete. C'est le
                  minuteur de la partie : il merite d'etre vu, pas lu. */}
              <i
                className="hud__fiole"
                style={{
                  backgroundPositionX: `calc(${-12 * Math.max(0, Math.min(12, cycles))} * var(--px))`,
                }}
                aria-hidden="true"
              />
              CYCLES <b>{cycles}</b>
            </>
          )}
        </span>
        <span>
          HUMANITÉ <b>{humanite}</b>
        </span>
      </div>

      <div className="dlg__bas">
      {etat.choix.length > 0 && complet && (
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
                  className={`dlg__bouton${c.index === vise ? ' dlg__bouton--vise' : ''}`}
                  disabled={!c.abordable}
                  onPointerEnter={() => viser(c.index)}
                  onClick={() => choisir(c.index)}
                >
                  {c.etiquette && (
                    <span
                      className="dlg__etq"
                      style={{ backgroundColor: COULEUR_ETIQUETTE[c.etiquette] }}
                    >
                      {c.etiquette}
                    </span>
                  )}
                  <span>{c.texte}</span>
                  {(c.cout.cycles > 0 || c.cout.humanite > 0 || c.cout.credits > 0) && (
                    <span className="dlg__couts">
                      {c.cout.cycles > 0 && (
                        <span className="dlg__cout dlg__cout--horloge">-{c.cout.cycles} CYC</span>
                      )}
                      {c.cout.humanite > 0 && (
                        <span className="dlg__cout">-{c.cout.humanite} HUM</span>
                      )}
                      {c.cout.credits > 0 && <span className="dlg__cout">-{c.cout.credits} cr</span>}
                    </span>
                  )}
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

      {glosesNeuves.includes(etat.glose ?? '') && etat.glose && (
        <div className="dlg__fin">
          <p className="dlg__glose dlg__glose--large">{GLOSES[etat.glose]}</p>
        </div>
      )}

      {/* Un recit epuise sans choix, sans plongee et sans fin est un cul-de-sac :
          du contenu manque. Mieux vaut le dire que de laisser l'ecran figé. */}
      {etat.termine && (
        <div className="dlg__fin">
          <p>— FIN DE SCÈNE —</p>
        </div>
      )}

      {etat.ligne && (
        <Boite
          ligne={etat.ligne}
          texte={affiche}
          peutContinuer={etat.peutContinuer && complet}
          onContinuer={continuer}
        />
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
