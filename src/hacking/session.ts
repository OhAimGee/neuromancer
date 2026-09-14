import donnees from '@data/hacking.json';
import { pointAcces } from './graphe';
import type { Butin, EtatSession, Evenement, Graphe, Noeud } from './types';

export interface Script {
  id: string;
  nom: string;
  rang: number;
  recharge: number;
  trace: number;
  geleTrace?: number;
  affaiblit?: number;
}

export const SCRIPTS: Script[] = donnees.scripts;

export function script(id: string): Script | null {
  return SCRIPTS.find((s) => s.id === id) ?? null;
}

/**
 * Part du solde qu'un portefeuille laisse prelever.
 *
 * Le plafond existe pour que le hacking ne remplace jamais le recit : au
 * maximum de competence on vole la moitie d'un portefeuille, jamais tout.
 */
export function pourcentageVol(competenceHacking: number): number {
  const { base, parNiveau, max } = donnees.vol;
  return Math.min(max, base + parNiveau * competenceHacking);
}

const evt = (code: string, valeurs: Record<string, string | number> = {}): Evenement => ({
  code,
  valeurs,
});

export function demarrer(graphe: Graphe, competence: number, scripts: string[]): EtatSession {
  return {
    graphe: structuredClone(graphe),
    position: graphe.entree,
    competence,
    trace: 0,
    integrite: donnees.integrite.max,
    ticks: 0,
    recharges: Object.fromEntries(scripts.map((id) => [id, 0])),
    traceGelee: 0,
    sac: [],
    statut: 'en_cours',
    journal: [evt('branchement', { region: pointAcces(graphe.pointAcces).nom })],
  };
}

function noeud(e: EtatSession, id: string): Noeud | undefined {
  return e.graphe.noeuds[id];
}

export function courant(e: EtatSession): Noeud {
  const n = noeud(e, e.position);
  if (!n) throw new Error(`Position invalide : ${e.position}`);
  return n;
}

/** Voisins du noeud courant, tels que la carte les montre. */
export function voisins(e: EtatSession): Noeud[] {
  return courant(e)
    .voisins.map((id) => noeud(e, id))
    .filter((n): n is Noeud => n !== undefined);
}

function reperer(e: EtatSession): void {
  const n = noeud(e, e.position);
  if (!n) return;
  n.repere = true;
  for (const v of n.voisins) {
    const voisin = noeud(e, v);
    if (voisin) voisin.repere = true;
  }
}

/**
 * Applique un delta de trace, puis la riposte s'il y a lieu.
 *
 * La riposte frappe a chaque tick passe au plafond, et non une seule fois :
 * sinon atteindre 100 n'aurait aucune consequence tant qu'on plonge vite.
 */
function tracer(e: EtatSession, delta: number): void {
  if (delta > 0 && e.traceGelee > 0) return;
  const avant = e.trace;
  e.trace = Math.max(0, Math.min(donnees.trace.max, e.trace + delta));

  if (avant < donnees.trace.seuilAlerte && e.trace >= donnees.trace.seuilAlerte) {
    e.journal.push(evt('alerte_trace', { trace: e.trace }));
  }
  if (e.trace >= donnees.trace.max) {
    e.integrite -= donnees.trace.riposte;
    e.journal.push(evt('riposte', { integrite: Math.max(0, e.integrite) }));
    if (e.integrite <= 0) {
      e.integrite = 0;
      e.statut = 'flatline';
      e.sac = [];
      e.journal.push(evt('flatline'));
    }
  }
}

function tick(e: EtatSession): void {
  e.ticks += 1;
  if (e.traceGelee > 0) e.traceGelee -= 1;
  for (const id of Object.keys(e.recharges)) {
    e.recharges[id] = Math.max(0, (e.recharges[id] ?? 0) - 1);
  }
}

/** Toutes les actions sont pures : elles rendent un nouvel etat. */
function agir(etat: EtatSession, action: (e: EtatSession) => void): EtatSession {
  if (etat.statut !== 'en_cours') return etat;
  const e = structuredClone(etat);
  action(e);
  return e;
}

export function deplacer(etat: EtatSession, cible: string): EtatSession {
  return agir(etat, (e) => {
    const n = noeud(e, cible);
    if (!n || !courant(e).voisins.includes(cible)) {
      e.journal.push(evt('deplacement_refuse'));
      return;
    }
    // Une glace est un mur, pas une destination : il faut la percer d'a cote.
    if (!n.franchi && (n.type === 'glace' || n.type === 'glace_noire')) {
      e.journal.push(evt('glace_bloque', { rang: n.rang }));
      return;
    }

    e.position = cible;
    tick(e);
    tracer(e, donnees.noeuds[n.type].traceEntree);
    reperer(e);

    if (n.type === 'leurre' && !n.franchi) {
      n.franchi = true;
      n.butin = null;
      e.journal.push(evt('leurre'));
    } else if (n.type === 'sanctuaire') {
      e.trace = 0;
      e.journal.push(evt('sanctuaire'));
    } else {
      e.journal.push(evt('deplacement', { noeud: n.id }));
    }
  });
}

export function piller(etat: EtatSession): EtatSession {
  return agir(etat, (e) => {
    const n = courant(e);
    if (!n.butin || n.franchi) {
      e.journal.push(evt('bdd_videe'));
      return;
    }
    tick(e);
    tracer(e, donnees.pillage[n.butin.type]);
    n.franchi = true;

    if (n.butin.type === 'credits') {
      const vol = Math.floor(n.butin.solde * pourcentageVol(e.competence));
      e.sac.push({ type: 'credits', id: '', solde: vol });
      e.journal.push(evt('butin_credits', { solde: n.butin.solde, vol }));
    } else {
      const butin: Butin = { ...n.butin };
      e.sac.push(butin);
      e.journal.push(evt(`butin_${butin.type}`, { id: butin.id }));
    }
    n.butin = null;
  });
}

export function executer(etat: EtatSession, idScript: string, cible?: string): EtatSession {
  return agir(etat, (e) => {
    const s = script(idScript);
    const restant = e.recharges[idScript];
    // Ne pas posseder le script et viser la mauvaise cible sont deux fautes
    // differentes ; les confondre rend le retour incomprehensible.
    if (!s || restant === undefined) {
      e.journal.push(evt('script_absent', { id: idScript }));
      return;
    }
    if (restant > 0) {
      e.journal.push(evt('script_indisponible', { ticks: restant }));
      return;
    }

    const cibleNoeud = cible ? noeud(e, cible) : undefined;
    const estGlace =
      cibleNoeud !== undefined &&
      (cibleNoeud.type === 'glace' || cibleNoeud.type === 'glace_noire') &&
      !cibleNoeud.franchi &&
      courant(e).voisins.includes(cibleNoeud.id);

    if (s.rang > 0 || s.affaiblit !== undefined) {
      if (!estGlace || !cibleNoeud) {
        e.journal.push(evt('script_hors_portee'));
        return;
      }
    }

    tick(e);
    e.recharges[idScript] = s.recharge;
    tracer(e, s.trace);
    if (e.statut !== 'en_cours') return;

    if (s.geleTrace !== undefined) {
      e.traceGelee = s.geleTrace;
      e.journal.push(evt('trace_gelee', { ticks: s.geleTrace }));
      return;
    }
    if (s.affaiblit !== undefined && cibleNoeud) {
      cibleNoeud.rang = Math.max(1, cibleNoeud.rang - s.affaiblit);
      e.journal.push(evt('glace_affaiblie', { rang: cibleNoeud.rang }));
      return;
    }
    if (s.rang === 0) {
      e.journal.push(evt('trace_reduite'));
      return;
    }

    if (!cibleNoeud) return;
    const portee = s.rang + e.competence;
    if (portee >= cibleNoeud.rang) {
      cibleNoeud.franchi = true;
      e.journal.push(evt('glace_cassee', { rang: cibleNoeud.rang }));
    } else {
      e.journal.push(evt('glace_resiste', { rang: cibleNoeud.rang, portee }));
      const sanction = donnees.noeuds[cibleNoeud.type];
      tracer(e, sanction.traceEchec);
      if (e.statut !== 'en_cours') return;
      e.integrite -= sanction.degatsEchec;
      if (e.integrite <= 0) {
        e.integrite = 0;
        e.statut = 'flatline';
        e.sac = [];
        e.journal.push(evt('flatline'));
      }
    }
  });
}

export function deconnecter(etat: EtatSession): EtatSession {
  return agir(etat, (e) => {
    e.statut = 'deconnecte';
    e.journal.push(evt('deconnexion', { butin: e.sac.length }));
  });
}
