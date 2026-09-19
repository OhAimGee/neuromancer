import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import donnees from '@data/hacking.json';
import { audio } from '@/audio/bus';
import { SceneJeu } from '@/engine/scene';
import { genererGraphe, pointAcces } from '@/hacking/graphe';
import { formuler } from '@/hacking/journal';
import { RenduCyberespace } from '@/hacking/rendu';
import {
  SCRIPTS,
  deconnecter,
  demarrer,
  deplacer,
  executer,
  piller,
} from '@/hacking/session';
import type { EtatSession } from '@/hacking/types';
import { useProfileStore } from '@/stores/profileStore';
import { useRunStore } from '@/stores/runStore';
import { toucheGlobale, useNavigationClavier } from './useNavigationClavier';

const LIGNES_JOURNAL = 3;

interface Props {
  pointAcces: string;
  graine: string;
  /** `flatline` vrai : Sable est reste dans la matrice, le recit en tient compte. */
  onSortie: (flatline: boolean) => void;
  actif?: boolean;
  onOptions?: () => void;
  onFiche?: () => void;
}

export function Cyberespace({
  pointAcces: idPointAcces,
  graine,
  onSortie,
  actif = true,
  onOptions,
  onFiche,
}: Props) {
  const competence = useRunStore((e) => e.competences['hacking'] ?? 0);
  const scriptsPossedes = useRunStore((e) => e.scripts);
  const implantsPoses = useRunStore((e) => e.implants);

  const [etat, setEtat] = useState<EtatSession>(() =>
    demarrer(genererGraphe(idPointAcces, graine), competence, scriptsPossedes, implantsPoses),
  );
  const [cible, setCible] = useState<string | null>(null);
  const [encaisse, setEncaisse] = useState(false);

  const hote = useRef<HTMLDivElement>(null);
  const rendu = useRef<RenduCyberespace | null>(null);

  useEffect(() => {
    const scene = new SceneJeu();
    const r = new RenduCyberespace();
    rendu.current = r;
    let vivant = true;

    (async () => {
      if (hote.current) await scene.monter(hote.current);
      await r.charger();
      if (!vivant) return;
      scene.poser(r.couche);
      r.auClic((id) => setCible(id));
      setEtat((e) => {
        r.dessiner(e);
        return e;
      });
    })();

    return () => {
      vivant = false;
      rendu.current = null;
      scene.detruire();
    };
  }, []);

  useEffect(() => {
    rendu.current?.dessiner(etat);
  }, [etat]);

  useEffect(() => {
    audio.effet('jack_in');
    audio.musique('nappe_matrice');
  }, []);

  // Un seul avertissement au franchissement du seuil : le rejouer a chaque
  // tick au-dessus du seuil en ferait un bruit de fond qu'on n'entend plus.
  const alerteDonnee = useRef(false);
  useEffect(() => {
    const chaud = etat.trace >= donnees.trace.seuilAlerte;
    if (chaud && !alerteDonnee.current) audio.effet('trace_alerte');
    alerteDonnee.current = chaud;
  }, [etat.trace]);

  useEffect(() => {
    if (etat.statut === 'flatline') audio.effet('glace_noire');
  }, [etat.statut]);

  const ici = etat.graphe.noeuds[etat.position];
  const voisin = cible !== null && ici ? ici.voisins.includes(cible) : false;
  const noeudCible = cible !== null ? etat.graphe.noeuds[cible] : undefined;
  const enCours = etat.statut === 'en_cours';
  const mort = etat.statut === 'flatline';

  const scripts = useMemo(
    () => SCRIPTS.filter((s) => scriptsPossedes.includes(s.id)),
    [scriptsPossedes],
  );

  const cyclesConsommes =
    donnees.coutCycles.base + Math.floor(etat.ticks / etat.cyclesParTicks);

  // Le butin n'entre dans la partie qu'a la deconnexion : un flatline emporte
  // tout ce qui n'a pas ete ramene. C'est ce qui rend le choix de partir tendu.
  const encaisser = useCallback(() => {
    if (encaisse) return;
    setEncaisse(true);
    const run = useRunStore.getState();
    run.consommerCycles(cyclesConsommes);
    for (const butin of etat.sac) {
      if (butin.type === 'credits') run.gagnerCredits(butin.solde);
      else if (butin.type === 'infos') useProfileStore.getState().apprendre(butin.id);
      else run.acquerir(butin.type, butin.id);
    }
    onSortie(etat.statut === 'flatline');
  }, [encaisse, etat.sac, etat.statut, cyclesConsommes, onSortie]);

  // Les noeuds vivent sur un canvas : au clavier, on ne peut pas les designer,
  // on les PARCOURT. Les voisins du noeud courant sont exactement ce sur quoi
  // une action est possible — viser ailleurs ne servirait a rien.
  const voisins = useMemo(() => (ici ? [...ici.voisins].sort() : []), [ici]);
  const surTouche = useCallback(
    (e: KeyboardEvent) => {
      // Les fleches se traitent ICI et pas par la navigation de liste du
      // crochet : la cible n'est pas un index dans une liste affichee, c'est un
      // identifiant de noeud, et deux ecouteurs poses sur `window` pour le meme
      // ecran se disputeraient la touche.
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (voisins.length === 0) return true;
        const sens = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        setCible((c) => {
          const i = c === null ? -1 : voisins.indexOf(c);
          return voisins[(i + sens + voisins.length) % voisins.length] ?? null;
        });
        return true;
      }
      if (!enCours) {
        if (e.key === 'Enter' || e.key === 'Backspace') {
          encaisser();
          return true;
        }
        return false;
      }
      if (e.key === 'Enter') {
        if (cible && voisin) setEtat((s) => deplacer(s, cible));
        return true;
      }
      if (e.key === 'a' || e.key === 'A') {
        if (ici?.butin && !ici.franchi) setEtat(piller);
        return true;
      }
      if (e.key === 'Backspace') {
        setEtat(deconnecter);
        return true;
      }
      if (/^[1-9]$/.test(e.key)) {
        const s = scripts[Number(e.key) - 1];
        if (s && (etat.recharges[s.id] ?? 0) === 0) {
          setEtat((sess) => executer(sess, s.id, cible ?? undefined));
        }
        return true;
      }
      return toucheGlobale(e, { onOptions, onFiche });
    },
    [enCours, encaisser, cible, voisin, ici, scripts, etat.recharges, voisins, onOptions, onFiche],
  );

  // `nombre: 0` : cet ecran n'a pas de liste a parcourir, tout passe par
  // `surTouche`. Le crochet sert ici a la regle qu'il porte — un seul ecouteur,
  // et seulement quand l'ecran est au-dessus.
  useNavigationClavier({ actif, nombre: 0, surTouche });

  const region = pointAcces(idPointAcces);
  const pctTrace = Math.round((etat.trace / etat.traceMax) * 100);
  const alerte = etat.trace >= donnees.trace.seuilAlerte;

  return (
    <div className="net">
      <div className="net__carte" ref={hote} />

      <div className="net__hud">
        <span>{region.nom.toUpperCase()}</span>
        <span>
          TICK <b>{etat.ticks}</b>
        </span>
        <span className={alerte ? 'net__alerte' : undefined}>
          TRACE <b>{pctTrace}</b>
        </span>
        <span>
          INT <b>{etat.integrite}</b>/{donnees.integrite.max}
        </span>
      </div>

      <div className="net__jauge">
        <i style={{ width: `${pctTrace}%` }} className={alerte ? 'net__jauge--chaud' : undefined} />
      </div>

      <div className="net__bas">
        <div className="net__cible">
          {noeudCible
            ? `CIBLE ${noeudCible.id.toUpperCase()} · ${noeudCible.type.replace('_', ' ').toUpperCase()}${
                noeudCible.rang > 0 && !noeudCible.franchi ? ` · RANG ${noeudCible.rang}` : ''
              }`
            : 'AUCUNE CIBLE — CLIQUE UN NŒUD'}
        </div>

        <div className="net__journal">
          {etat.journal.slice(-LIGNES_JOURNAL).map((ev, i) => (
            <p key={`${etat.ticks}-${i}`}>{formuler(ev)}</p>
          ))}
        </div>

        {enCours ? (
          <div className="net__actions">
            <button
              className="net__bouton"
              disabled={!voisin}
              onClick={() => cible && setEtat((e) => deplacer(e, cible))}
            >
              ALLER
            </button>
            <button
              className="net__bouton"
              disabled={!ici?.butin || ici.franchi}
              onClick={() => setEtat(piller)}
            >
              PILLER
            </button>
            {scripts.map((s) => (
              <button
                key={s.id}
                className="net__bouton"
                disabled={(etat.recharges[s.id] ?? 0) > 0}
                title={s.nom}
                onClick={() => setEtat((e) => executer(e, s.id, cible ?? undefined))}
              >
                {s.nom}
                {(etat.recharges[s.id] ?? 0) > 0 ? ` ${etat.recharges[s.id]}` : ''}
              </button>
            ))}
            <button className="net__bouton net__bouton--sortie" onClick={() => setEtat(deconnecter)}>
              DÉBRANCHER
            </button>
          </div>
        ) : mort ? null : (
          <div className="net__actions">
            <span className="net__bilan">
              {`${etat.sac.length} objet(s) · ${cyclesConsommes} cycle(s)`}
            </span>
            <button className="net__bouton net__bouton--sortie" onClick={encaisser}>
              SORTIR
            </button>
          </div>
        )}
      </div>

      {/* La glace noire tue : elle merite autre chose qu'une ligne de bilan de
        * la meme couleur qu'un butin ramene. Le carton couvre la matrice, donc
        * le bilan du bas n'est pas rendu en meme temps — un seul bouton SORTIR,
        * et pas de piege au clavier. */}
      {mort && (
        <div className="mort" role="alertdialog" aria-label="Flatline">
          <p className="mort__etiquette">RIPOSTE</p>
          <p className="mort__nom">GLACE NOIRE</p>
          <p className="mort__sous">INTEGRITE 0 &middot; BUTIN PERDU</p>
          <button className="net__bouton net__bouton--sortie" onClick={encaisser}>
            SORTIR
          </button>
        </div>
      )}
    </div>
  );
}
