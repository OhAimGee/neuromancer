import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from '@/stores/profileStore';
import { useRunStore, CYCLES_DEPART } from '@/stores/runStore';

describe('profileStore — la meta-progression est une connaissance', () => {
  beforeEach(() => useProfileStore.getState().reinitialiser());

  it('retient une information apprise', () => {
    useProfileStore.getState().apprendre('employeur_omniscient');
    expect(useProfileStore.getState().connait('employeur_omniscient')).toBe(true);
  });

  it('ignore un doublon sans casser la reference', () => {
    const { apprendre } = useProfileStore.getState();
    apprendre('toxine_posee');
    const apres1 = useProfileStore.getState().connaissances;
    apprendre('toxine_posee');
    expect(useProfileStore.getState().connaissances).toBe(apres1);
    expect(useProfileStore.getState().connaissances.size).toBe(1);
  });

  it('ecrit reellement le Set dans le stockage persistant', () => {
    useProfileStore.getState().apprendre('molly_rencontre');
    const brut = localStorage.getItem('neuromancer-profil');
    expect(brut).toContain('molly_rencontre');
    expect(brut).toContain('__Set__');
  });

  it('ne compte pas deux fois la meme fin mais compte les parties', () => {
    const { enregistrerFin } = useProfileStore.getState();
    enregistrerFin('la_rue', 3);
    enregistrerFin('la_rue', 7);
    const e = useProfileStore.getState();
    expect(e.finsVues).toEqual(['la_rue']);
    expect(e.parties).toBe(2);
    expect(e.meilleursCycles).toBe(7);
  });
});

describe('runStore — economie de la partie', () => {
  beforeEach(() => useRunStore.getState().nouvellePartie());

  it('demarre a 12 cycles', () => {
    expect(useRunStore.getState().cycles).toBe(CYCLES_DEPART);
  });

  it("refuse un cout qu'on ne peut pas payer et ne debite rien", () => {
    const paye = useRunStore.getState().payer({ credits: 500, cycles: 0, humanite: 0 });
    expect(paye).toBe(false);
    expect(useRunStore.getState().credits).toBe(0);
  });

  it('debite un cout abordable', () => {
    useRunStore.setState({ credits: 300 });
    const paye = useRunStore.getState().payer({ credits: 200, cycles: 1, humanite: 5 });
    expect(paye).toBe(true);
    const e = useRunStore.getState();
    expect(e.credits).toBe(100);
    expect(e.cycles).toBe(CYCLES_DEPART - 1);
    expect(e.humanite).toBe(95);
  });

  it("ne descend pas sous zero cycle", () => {
    useRunStore.getState().consommerCycles(99);
    expect(useRunStore.getState().cycles).toBe(0);
  });

  it('ne recrute pas deux fois le meme equipier', () => {
    const { recruter } = useRunStore.getState();
    recruter('molly');
    recruter('molly');
    expect(useRunStore.getState().equipage).toEqual(['molly']);
  });

  it("competence() rend 0 pour une competence inconnue", () => {
    expect(useRunStore.getState().competence('pilotage')).toBe(0);
    expect(useRunStore.getState().competence('hacking')).toBe(1);
  });
});
