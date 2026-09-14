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
