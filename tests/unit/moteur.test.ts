import { describe, it, expect, beforeEach } from 'vitest';
import { compileInk } from '../../tools/compile-ink.mjs';
import { MoteurDialogue } from '@/dialogue/moteur';
import { useRunStore } from '@/stores/runStore';

const { json, errors } = compileInk();

describe('trame narrative', () => {
  it('compile sans erreur', () => {
    expect(errors).toEqual([]);
    expect(json).not.toBeNull();
  });
});

describe('MoteurDialogue', () => {
  beforeEach(() => {
    useRunStore.getState().nouvellePartie();
  });

  it('affiche le récit avant le premier choix', () => {
    const m = MoteurDialogue.depuisJson(json as string);
    m.demarrer();
    const etat = m.lire();
    expect(etat.lignes.length).toBeGreaterThan(0);
    expect(etat.choix.length).toBeGreaterThan(0);
  });

  it('demarrer() est idempotent', () => {
    // React 19 monte deux fois les effets en mode strict. Sans garde, le second
    // appel vidait le journal alors que l'histoire etait deja aux choix : tout
    // le recit d'ouverture disparaissait de l'ecran, sans aucune erreur.
    const m = MoteurDialogue.depuisJson(json as string);
    m.demarrer();
    const lignes = m.lire().lignes.length;
    m.demarrer();
    expect(m.lire().lignes.length).toBe(lignes);
  });

  it('pose le décor et le carton d’entracte de la première scène', () => {
    const m = MoteurDialogue.depuisJson(json as string);
    m.demarrer();
    expect(m.lire().decor).toBe('matrice');
    expect(m.lire().entracte).toBe('CHIBA CITY — IL Y A TROIS ANS');
  });

  it('l’ouverture donne une compétence de départ selon la façon de mourir', () => {
    const m = MoteurDialogue.depuisJson(json as string);
    m.demarrer();
    m.choisir(0);
    const avant = useRunStore.getState().competence('hacking');
    // Le premier choix de la scene de glace est « Forcer » -> hacking.
    m.choisir(0);
    expect(useRunStore.getState().competence('hacking')).toBe(avant + 1);
  });
});
