import { describe, it, expect } from 'vitest';
import donnees from '@data/hacking.json';
import journal from '@data/journal.json';
import { BANDE_BAS, BANDE_HAUT, genererGraphe, POINTS_ACCES } from '@/hacking/graphe';
import {
  courant,
  deconnecter,
  demarrer,
  deplacer,
  executer,
  piller,
  pourcentageVol,
} from '@/hacking/session';
import type { Graphe, Noeud } from '@/hacking/types';

const TOUS_SCRIPTS = donnees.scripts.map((s) => s.id);

function atteignables(g: Graphe): Set<string> {
  const vus = new Set([g.entree]);
  const pile = [g.entree];
  while (pile.length > 0) {
    const id = pile.pop() as string;
    for (const v of g.noeuds[id]?.voisins ?? []) {
      if (!vus.has(v)) {
        vus.add(v);
        pile.push(v);
      }
    }
  }
  return vus;
}

function trouver(g: Graphe, predicat: (n: Noeud) => boolean): Noeud | undefined {
  return Object.values(g.noeuds).find(predicat);
}

describe('génération du graphe', () => {
  it('est déterministe : même point d’accès et même graine, même réseau', () => {
    const a = genererGraphe('sense_net', 'partie-7');
    const b = genererGraphe('sense_net', 'partie-7');
    expect(a).toEqual(b);
  });

  it('change de topologie quand la graine change', () => {
    const a = genererGraphe('sense_net', 'partie-7');
    const b = genererGraphe('sense_net', 'partie-8');
    expect(a).not.toEqual(b);
  });

  it('ne laisse jamais de nœud orphelin, sur tous les points d’accès', () => {
    for (const p of POINTS_ACCES) {
      for (let i = 0; i < 40; i++) {
        const g = genererGraphe(p.id, `graine-${i}`);
        expect(atteignables(g).size).toBe(Object.keys(g.noeuds).length);
      }
    }
  });

  it('tient les nœuds dans la bande jouable, hors HUD et panneau', () => {
    for (const p of POINTS_ACCES) {
      for (let i = 0; i < 20; i++) {
        for (const n of Object.values(genererGraphe(p.id, `cadre-${i}`).noeuds)) {
          expect(n.x).toBeGreaterThanOrEqual(12);
          expect(n.x).toBeLessThanOrEqual(308);
          expect(n.y).toBeGreaterThanOrEqual(BANDE_HAUT);
          expect(n.y).toBeLessThanOrEqual(BANDE_BAS);
        }
      }
    }
  });

  it('ne place pas de glace noire près d’un jack de quartier', () => {
    for (let i = 0; i < 60; i++) {
      const g = genererGraphe('chatsubo', `sûr-${i}`);
      expect(trouver(g, (n) => n.type === 'glace_noire')).toBeUndefined();
    }
  });

  it('en place dans une région dangereuse', () => {
    const avecNoire = Array.from({ length: 40 }, (_, i) =>
      genererGraphe('maas_biolabs', `danger-${i}`),
    ).filter((g) => trouver(g, (n) => n.type === 'glace_noire'));
    expect(avecNoire.length).toBeGreaterThan(0);
  });

  it('ne propose jamais deux fois le même plan ou la même info dans une plongée', () => {
    for (const p of POINTS_ACCES) {
      for (let i = 0; i < 40; i++) {
        const g = genererGraphe(p.id, `doublon-${i}`);
        const ids = Object.values(g.noeuds)
          .filter((n) => n.type !== 'leurre')
          .map((n) => n.butin)
          .filter((b) => b && b.type !== 'credits')
          .map((b) => b?.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('pose au plus un sanctuaire', () => {
    for (let i = 0; i < 60; i++) {
      const g = genererGraphe('maas_biolabs', `sanctuaire-${i}`);
      const n = Object.values(g.noeuds).filter((x) => x.type === 'sanctuaire').length;
      expect(n).toBeLessThanOrEqual(1);
    }
  });
});

describe('vol de crypto', () => {
  it('suit la table d’équilibrage', () => {
    expect(pourcentageVol(0)).toBeCloseTo(donnees.vol.base);
    expect(pourcentageVol(1)).toBeCloseTo(donnees.vol.base + donnees.vol.parNiveau);
  });

  it('plafonne : on ne vide jamais un portefeuille', () => {
    expect(pourcentageVol(99)).toBe(donnees.vol.max);
    expect(donnees.vol.max).toBeLessThan(1);
  });
});

describe('session de plongée', () => {
  const graphe = genererGraphe('sense_net', 'session');

  it('ne mute jamais l’état qu’on lui passe', () => {
    const e = demarrer(graphe, 3, TOUS_SCRIPTS);
    const avant = structuredClone(e);
    deplacer(e, courant(e).voisins[0] as string);
    expect(e).toEqual(avant);
  });

  it('refuse un déplacement vers un nœud non voisin', () => {
    const e = demarrer(graphe, 3, TOUS_SCRIPTS);
    const lointain = Object.values(e.graphe.noeuds).find(
      (n) => n.couche > 1 && !courant(e).voisins.includes(n.id),
    );
    const apres = deplacer(e, lointain?.id ?? 'inexistant');
    expect(apres.position).toBe(e.position);
    expect(apres.journal.at(-1)?.code).toBe('deplacement_refuse');
  });

  it('une glace bloque le passage tant qu’elle n’est pas percée', () => {
    // Un réseau profond finit toujours par proposer une glace au contact.
    const g = genererGraphe('maas_biolabs', 'glace');
    let e = demarrer(g, 0, TOUS_SCRIPTS);
    const glace = Object.values(g.noeuds).find(
      (n) => n.type === 'glace' && g.noeuds[g.entree]?.voisins.includes(n.id),
    );
    if (!glace) return; // topologie sans glace au contact : rien à prouver ici

    e = deplacer(e, glace.id);
    expect(e.position).toBe(g.entree);
    expect(e.journal.at(-1)?.code).toBe('glace_bloque');

    expect(executer(e, 'kuang_mk11', g.entree).journal.at(-1)?.code).toBe('script_hors_portee');
    expect(executer(e, 'script_fantome', glace.id).journal.at(-1)?.code).toBe('script_absent');

    e = executer(e, 'kuang_mk11', glace.id);
    expect(e.journal.at(-1)?.code).toBe('glace_cassee');
    e = deplacer(e, glace.id);
    expect(e.position).toBe(glace.id);
  });

  it('un script en recharge ne repart pas au tick suivant', () => {
    const g = genererGraphe('chatsubo', 'recharge');
    let e = demarrer(g, 1, ['mimic']);
    e = executer(e, 'mimic');
    expect(e.recharges['mimic']).toBe(3);
    e = deplacer(e, courant(e).voisins[0] as string);
    expect(e.recharges['mimic']).toBe(2);
    const refus = executer(e, 'mimic');
    expect(refus.journal.at(-1)?.code).toBe('script_indisponible');
  });

  it('la trace au plafond riposte, et le flatline vide le sac', () => {
    let e = demarrer(graphe, 5, TOUS_SCRIPTS);
    e = { ...e, trace: donnees.trace.max - 1, sac: [{ type: 'credits', id: '', solde: 900 }] };
    for (let i = 0; i < 20 && e.statut === 'en_cours'; i++) {
      e = deplacer(e, courant(e).voisins[0] as string);
    }
    expect(e.statut).toBe('flatline');
    expect(e.integrite).toBe(0);
    expect(e.sac).toEqual([]);
  });

  it('une session terminée n’accepte plus rien', () => {
    const e = deconnecter(demarrer(graphe, 3, TOUS_SCRIPTS));
    expect(e.statut).toBe('deconnecte');
    expect(deplacer(e, courant(e).voisins[0] as string)).toBe(e);
    expect(piller(e)).toBe(e);
  });

  it('ne prélève qu’un pourcentage du portefeuille, et une seule fois', () => {
    const g = genererGraphe('sense_net', 'butin');
    const bdd = Object.values(g.noeuds).find(
      (n) => n.butin?.type === 'credits' && g.noeuds[g.entree]?.voisins.includes(n.id),
    );
    if (!bdd) return;

    let e = demarrer(g, 2, TOUS_SCRIPTS);
    e = deplacer(e, bdd.id);
    const solde = bdd.butin?.solde ?? 0;
    e = piller(e);
    expect(e.sac[0]?.solde).toBe(Math.floor(solde * pourcentageVol(2)));

    const encore = piller(e);
    expect(encore.sac).toHaveLength(1);
    expect(encore.journal.at(-1)?.code).toBe('bdd_videe');
  });
});

describe('journal de plongée', () => {
  it('chaque événement que le moteur émet a une formulation', () => {
    // Fuzzing : jouer beaucoup de plongées au hasard fait sortir les codes que
    // relire le code laisserait passer, à commencer par ceux construits par
    // concaténation (butin_credits, butin_infos...).
    const emis = new Set<string>();
    let graine = 1;
    const hasard = () => {
      graine = (graine * 1103515245 + 12345) % 2147483648;
      return graine / 2147483648;
    };

    for (const p of POINTS_ACCES) {
      for (let partie = 0; partie < 25; partie++) {
        const g = genererGraphe(p.id, `fuzz-${partie}`);
        let e = demarrer(g, Math.floor(hasard() * 5), TOUS_SCRIPTS);
        for (let coup = 0; coup < 60 && e.statut === 'en_cours'; coup++) {
          const d = hasard();
          const vs = courant(e).voisins;
          if (d < 0.5 && vs.length > 0) {
            e = deplacer(e, vs[Math.floor(hasard() * vs.length)] as string);
          } else if (d < 0.7) {
            e = piller(e);
          } else {
            const s = TOUS_SCRIPTS[Math.floor(hasard() * TOUS_SCRIPTS.length)] as string;
            e = executer(e, s, vs[Math.floor(hasard() * vs.length)]);
          }
        }
        e = deconnecter(e);
        for (const ev of e.journal) emis.add(ev.code);
      }
    }

    const formules = new Set(Object.keys(journal).filter((k) => !k.startsWith('_')));
    expect([...emis].filter((c) => !formules.has(c))).toEqual([]);
    // Au moins toute la mécanique principale doit avoir été traversée.
    for (const attendu of ['glace_cassee', 'butin_credits', 'riposte', 'deconnexion']) {
      expect(emis).toContain(attendu);
    }
  });
});
