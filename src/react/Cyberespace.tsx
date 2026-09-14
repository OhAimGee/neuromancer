import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import donnees from '@data/hacking.json';
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

const LIGNES_JOURNAL = 3;

interface Props {
  pointAcces: string;
  graine: string;
  onSortie: () => void;
}

export function Cyberespace({ pointAcces: idPointAcces, graine, onSortie }: Props) {
  const competence = useRunStore((e) => e.competences['hacking'] ?? 0);
  const scriptsPossedes = useRunStore((e) => e.scripts);

  const [etat, setEtat] = useState<EtatSession>(() =>
    demarrer(genererGraphe(idPointAcces, graine), competence, scriptsPossedes),
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

  const ici = etat.graphe.noeuds[etat.position];
  const voisin = cible !== null && ici ? ici.voisins.includes(cible) : false;
  const noeudCible = cible !== null ? etat.graphe.noeuds[cible] : undefined;
  const enCours = etat.statut === 'en_cours';

  const scripts = useMemo(
    () => SCRIPTS.filter((s) => scriptsPossedes.includes(s.id)),
    [scriptsPossedes],
  );

  const cyclesConsommes =
    donnees.coutCycles.base + Math.floor(etat.ticks / donnees.coutCycles.parTicks);

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
    onSortie();
  }, [encaisse, etat.sac, cyclesConsommes, onSortie]);

  const region = pointAcces(idPointAcces);
  const pctTrace = Math.round((etat.trace / donnees.trace.max) * 100);
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
        ) : (
          <div className="net__actions">
            <span className="net__bilan">
              {etat.statut === 'flatline'
                ? 'FLATLINE — butin perdu'
                : `${etat.sac.length} objet(s) · ${cyclesConsommes} cycle(s)`}
            </span>
            <button className="net__bouton net__bouton--sortie" onClick={encaisser}>
              SORTIR
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
