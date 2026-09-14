import { describe, it, expect, beforeEach } from 'vitest';
import { compileInk } from '../../tools/compile-ink.mjs';
import { MoteurDialogue } from '@/dialogue/moteur';
import { useProfileStore } from '@/stores/profileStore';
import { useRunStore } from '@/stores/runStore';

const { json, errors } = compileInk();
const neuf = () => MoteurDialogue.depuisJson(json as string);

/** Fait defiler le texte jusqu'a la prochaine palette de choix. */
function epuiser(m: MoteurDialogue): void {
  let garde = 0;
  while (m.lire().peutContinuer && garde++ < 200) m.continuer();
}

describe('trame narrative', () => {
  it('compile sans erreur', () => {
    expect(errors).toEqual([]);
    expect(json).not.toBeNull();
  });
});

/** Amene le moteur au hub, texte epuise, choix affiches. */
function auHub(m: MoteurDialogue): void {
  m.demarrer();
  m.reprendre('hub');
  epuiser(m);
}

/** Index du choix dont le libelle contient ce fragment. */
function choixNomme(m: MoteurDialogue, fragment: string): number {
  const i = m.lire().choix.findIndex((c) => c.texte.includes(fragment));
  expect(i).toBeGreaterThanOrEqual(0);
  return i;
}

describe('boucle de partie', () => {
  beforeEach(() => {
    useRunStore.getState().nouvellePartie();
    useProfileStore.getState().reinitialiser();
  });

  it('reprendre() rouvre le recit a un knot nomme', () => {
    const m = neuf();
    auHub(m);
    // Le hub propose des lieux, pas des repliques : c'est la signature du hub.
    expect(m.lire().choix.map((c) => c.texte).join(' ')).toContain('Finn');
  });

  it('le recit reclame la plongee, et la matrice ne s’ouvre pas avant la fin du texte', () => {
    const m = neuf();
    auHub(m);
    m.choisir(choixNomme(m, 'cabine'));
    // La replique de branchement doit encore se lire : tant qu'il reste du
    // texte, le jeu ne bascule pas dans la matrice.
    expect(m.lire().plongee).toBeNull();
    epuiser(m);
    expect(m.lire().plongee).toBe('chatsubo');
  });

  it('terminerPlongee() rend la main au knot que le recit a nomme', () => {
    const m = neuf();
    auHub(m);
    m.choisir(choixNomme(m, 'cabine'));
    epuiser(m);
    m.terminerPlongee(false);
    expect(m.lire().plongee).toBeNull();
    expect(m.lire().ligne?.texte).toContain('Il revint dans son corps');
  });

  it('un flatline dans la matrice termine la partie', () => {
    const m = neuf();
    auHub(m);
    m.choisir(choixNomme(m, 'cabine'));
    epuiser(m);
    m.terminerPlongee(true);
    expect(m.lire().fin).toBe('flatline');
    expect(useRunStore.getState().terminee).toBe(true);
    expect(useProfileStore.getState().finsVues).toEqual(['flatline']);
  });

  it('l’horloge tombee a zero tue, au passage suivant par le hub', () => {
    const m = neuf();
    m.demarrer();
    useRunStore.setState({ cycles: 0 });
    m.reprendre('hub');
    epuiser(m);
    expect(m.lire().fin).toBe('flatline');
  });

  it('un cout en cycles annonce est preleve sur l’horloge du jeu', () => {
    const m = neuf();
    auHub(m);
    const avant = useRunStore.getState().cycles;
    const i = choixNomme(m, 'Finn');
    expect(m.lire().choix[i]?.cout.cycles).toBe(1);
    m.choisir(i);
    epuiser(m);
    expect(useRunStore.getState().cycles).toBe(avant - 1);
  });

  it('la fin n’est enregistree qu’une fois, meme en relisant la scene', () => {
    const m = neuf();
    m.demarrer();
    m.reprendre('fin_toxine');
    epuiser(m);
    expect(useProfileStore.getState().parties).toBe(1);
  });
});

describe('MoteurDialogue', () => {
  beforeEach(() => {
    useRunStore.getState().nouvellePartie();
  });

  it('ouvre sur une seule réplique, pas sur toute la scène', () => {
    const m = neuf();
    m.demarrer();
    const etat = m.lire();
    expect(etat.ligne?.texte).toBeTruthy();
    expect(etat.peutContinuer).toBe(true);
    // Tant qu'il reste du texte, aucun choix ne doit etre propose : ils
    // s'afficheraient sous une replique que le joueur n'a pas encore lue.
    expect(etat.choix).toEqual([]);
  });

  it('continuer() avance d’exactement une réplique', () => {
    const m = neuf();
    m.demarrer();
    const premiere = m.lire().ligne?.texte;
    m.continuer();
    const seconde = m.lire().ligne?.texte;
    expect(seconde).toBeTruthy();
    expect(seconde).not.toBe(premiere);
  });

  // Regression : avant l'avance d'une replique, `peutContinuer` valait
  // `story.canContinue`, qui reste vrai pour du contenu sans texte (tags seuls,
  // fin de knot). Le chevron s'affichait alors sur la derniere replique d'une
  // scene, et la pression suivante n'y changeait rien — le joueur croyait avoir
  // rate son clic.
  it('le chevron ne ment jamais : toute pression change la réplique', () => {
    const m = neuf();
    m.demarrer();
    let garde = 0;
    for (let saut = 0; saut < 12; saut++) {
      while (m.lire().peutContinuer && garde++ < 400) {
        const avant = m.lire().ligne?.texte;
        m.continuer();
        expect(m.lire().ligne?.texte).not.toBe(avant);
      }
      const choix = m.lire().choix;
      if (choix.length === 0) break;
      m.choisir(choix.findIndex((c) => c.abordable));
    }
    expect(garde).toBeGreaterThan(20);
  });

  it('ne propose les choix qu’une fois le texte épuisé', () => {
    const m = neuf();
    m.demarrer();
    epuiser(m);
    expect(m.lire().peutContinuer).toBe(false);
    expect(m.lire().choix.length).toBeGreaterThan(0);
  });

  it('demarrer() est idempotent', () => {
    // React 19 monte deux fois les effets en mode strict. Sans garde, le second
    // appel relancait la lecture et sautait la premiere replique.
    const m = neuf();
    m.demarrer();
    const premiere = m.lire().ligne?.texte;
    m.demarrer();
    expect(m.lire().ligne?.texte).toBe(premiere);
  });

  it('attribue la réplique du joueur à Sable, pas à son interlocuteur', () => {
    const m = neuf();
    m.demarrer();
    epuiser(m);
    m.choisir(0);
    const ligne = m.lire().ligne;
    expect(ligne?.replique).toBe(true);
    expect(ligne?.locuteur).toBe('sable');
    expect(ligne?.dite).toBe(true);
  });

  it('applique les effets d’un choix au fil de la lecture', () => {
    const m = neuf();
    m.demarrer();
    epuiser(m);
    m.choisir(0);
    epuiser(m);
    m.choisir(0);
    epuiser(m);
    // Le choix FRAGMENT du reveil coute 5 d'humanite.
    const avant = useRunStore.getState().humanite;
    m.choisir(0);
    epuiser(m);
    expect(useRunStore.getState().humanite).toBe(avant - 5);
  });

  it('distingue une parole d’une narration', () => {
    const m = neuf();
    m.demarrer();
    // L'ouverture commence par de la narration : pas de tiret cadratin.
    expect(m.lire().ligne?.dite).toBe(false);
  });

  it('pose le décor et le carton d’entracte de la première scène', () => {
    const m = neuf();
    m.demarrer();
    expect(m.lire().decor).toBe('matrice');
    expect(m.lire().entracte).toBe('CHIBA CITY — IL Y A TROIS ANS');
  });

  it('l’ouverture donne une compétence de départ selon la façon de mourir', () => {
    const m = neuf();
    m.demarrer();
    epuiser(m);
    m.choisir(0);
    epuiser(m);
    expect(m.lire().choix.length).toBe(3);

    const avant = useRunStore.getState().competence('hacking');
    // Le premier choix de la scene de glace est « Forcer » -> hacking.
    m.choisir(0);
    // Les effets du corps d'un choix s'appliquent au fil de la lecture et non
    // au clic : il faut derouler la replique pour que le `~` soit evalue.
    epuiser(m);
    expect(useRunStore.getState().competence('hacking')).toBe(avant + 1);
  });
});

describe('mise en scene — ce qui colle et ce qui ne colle pas', () => {
  beforeEach(() => {
    useRunStore.getState().nouvellePartie();
    useProfileStore.getState().reinitialiser();
  });

  /** Deroule tout le recit accessible en prenant toujours le premier choix. */
  function parcourir(m: MoteurDialogue, visiter: (e: ReturnType<MoteurDialogue['lire']>) => void) {
    m.demarrer();
    for (let pas = 0; pas < 400; pas++) {
      visiter(m.lire());
      if (m.lire().peutContinuer) {
        m.continuer();
        continue;
      }
      if (m.lire().choix.length === 0) break;
      m.choisir(0);
    }
  }

  // Le portrait appartient a qui parle, jamais a la scene. Un `# portrait:`
  // pose dans le prologue restait colle jusqu'a la fin de la partie : la
  // plaque affichait MAELCUM et la boite montrait le visage de Molly.
  //
  // Le parcours compte : il faut d'abord traverser une scene qui impose un
  // portrait, puis changer de locuteur. Un test qui se contente de dérouler le
  // recit depuis le hub ne voit jamais la faute, faute d'avoir joue le
  // prologue — verifie en reintroduisant la faute a la main.
  it('un changement de locuteur annule le portrait impose au precedent', () => {
    const m = neuf();
    let impose: string | null = null;
    parcourir(m, (e) => {
      if (e.ligne?.portrait) impose = e.ligne.portrait;
    });
    // Le dernier portrait impose du prologue. C'est celui qui restait colle.
    expect(impose).toBe('port_molly');

    m.reprendre('hub');
    epuiser(m);
    m.choisir(choixNomme(m, 'Ratz'));
    epuiser(m);
    const l = m.lire().ligne;
    expect(l?.locuteur).toBe('ratz');
    // `ligne.portrait` est une DEROGATION, pas le portrait par defaut : celui-ci
    // vient de data/personnages.json et se resout dans la boite. Ratz ne
    // deroge a rien, donc null — et surtout pas le portrait de Molly.
    expect(l?.portrait).toBeNull();
  });

  // Un son est un evenement, pas un decor : le garder dans la mise en scene
  // faisait rejouer le declic de branchement sur toutes les repliques suivantes.
  it('un son ne vaut que pour la replique qui le porte', () => {
    const m = neuf();
    let suites = 0;
    let precedent = false;
    parcourir(m, (e) => {
      if (e.sfx !== null && precedent) suites++;
      precedent = e.sfx !== null;
    });
    expect(suites).toBe(0);
  });
});

describe('acte III — les frictions par paire', () => {
  beforeEach(() => {
    useRunStore.getState().nouvellePartie();
    useProfileStore.getState().reinitialiser();
  });

  /** Toutes les repliques lues depuis le knot donne, en prenant le choix i. */
  function lireDepuis(m: MoteurDialogue, knot: string, choix = 0): string {
    m.demarrer();
    m.reprendre(knot);
    const lues: string[] = [];
    for (let pas = 0; pas < 60; pas++) {
      const e = m.lire();
      if (e.ligne) lues.push(e.ligne.texte);
      if (e.peutContinuer) {
        m.continuer();
        continue;
      }
      if (e.choix.length === 0) break;
      m.choisir(Math.min(choix, e.choix.length - 1));
    }
    return lues.join('\n');
  }

  // Six candidats pour trois places font vingt equipes : une scene par PAIRE
  // couvre beaucoup plus de terrain qu'une scene par personne. Encore faut-il
  // qu'elle se declenche, et un outil qui joue au hasard ne recrute personne.
  it('une paire embarquee declenche sa scene a Freeside', () => {
    const r = useRunStore.getState();
    r.recruter('riviera');
    r.recruter('molly');
    const m = neuf();
    expect(lireDepuis(m, 'freeside')).toContain('je te coupe les mains');
  });

  it('une autre paire donne une autre scene', () => {
    const r = useRunStore.getState();
    r.recruter('finn');
    r.recruter('yonderboy');
    const m = neuf();
    expect(lireDepuis(m, 'freeside')).toContain('Une émeute');
  });

  // Deux disputes d'affilee feraient une sitcom : `friction_jouee` verrouille.
  it('une equipe sans paire ecrite traverse sans friction', () => {
    useRunStore.getState().recruter('molly');
    const m = neuf();
    const lu = lireDepuis(m, 'freeside');
    expect(lu).toContain('rue Jules-Verne');
    expect(lu).not.toContain('je te coupe les mains');
  });
});

// --- L'atelier du Finn -----------------------------------------------------
//
// C'est la seule chose qui relie un plan vole a autre chose qu'une ligne
// d'inventaire. Le recit lit `a_plan()`, paie en clair, et appelle
// `poser_implant()` : les trois maillons se testent ensemble, parce qu'il
// suffit qu'un seul lache pour que le butin redevienne mort.
describe('acte II — la pose d’implants', () => {
  beforeEach(() => {
    useRunStore.getState().nouvellePartie();
    useProfileStore.getState().reinitialiser();
  });

  /** Amene le moteur devant la paillasse du Finn. */
  function aLAtelier(m: MoteurDialogue): void {
    m.demarrer();
    m.reprendre('finn');
    epuiser(m);
    m.choisir(choixNomme(m, 'Faire poser'));
    epuiser(m);
  }

  it('sans plan volé, la paillasse ne propose rien', () => {
    const m = neuf();
    aLAtelier(m);
    expect(m.lire().choix).toHaveLength(1);
    expect(m.lire().choix[0]?.texte).toContain('rhabiller');
  });

  it('le plan volé ouvre la pose, et la pose écrit dans la partie', () => {
    const run = useRunStore.getState();
    run.acquerir('plans', 'coprocesseur');
    useRunStore.setState({ credits: 5000 });

    const m = neuf();
    aLAtelier(m);
    const humaniteAvant = useRunStore.getState().humanite;
    m.choisir(choixNomme(m, 'Coprocesseur'));
    epuiser(m);

    const apres = useRunStore.getState();
    expect(apres.implants).toContain('coprocesseur');
    expect(apres.credits).toBe(5000 - 2400);
    expect(apres.humanite).toBe(humaniteAvant - 8);
    // Un plan reste au dossier : c'est de l'information, pas une piece.
    expect(apres.plans).toContain('coprocesseur');
  });

  it('un implant déjà posé ne se repropose pas', () => {
    useRunStore.getState().acquerir('plans', 'coprocesseur');
    useRunStore.getState().acquerir('implants', 'coprocesseur');
    useRunStore.setState({ credits: 5000 });

    const m = neuf();
    aLAtelier(m);
    expect(m.lire().choix.map((c) => c.texte).join(' ')).not.toContain('Coprocesseur');
  });

  // L'etiquette IMPLANT decrit une porte que seul un implant DEJA pose ouvre
  // (data/gloses.json). Elle est restee longtemps sans emploi dans le recit.
  it('l’implant posé ouvre une réplique que rien d’autre n’ouvre', () => {
    const m = neuf();
    m.demarrer();
    m.reprendre('approche');
    epuiser(m);
    const sans = m.lire().choix.map((c) => c.texte).join(' ');
    expect(sans).not.toContain('sans regarder personne');

    useRunStore.getState().acquerir('implants', 'lentilles_molly');
    const n = neuf();
    n.demarrer();
    n.reprendre('approche');
    epuiser(n);
    const avec = n.lire().choix;
    const i = avec.findIndex((c) => c.texte.includes('sans regarder personne'));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(avec[i]?.etiquette).toBe('IMPLANT');
  });
});
