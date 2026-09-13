import { describe, it, expect } from 'vitest';
import { serialiser, deserialiser } from '@/save/serialize';

describe('serialisation des sauvegardes', () => {
  it('fait survivre un Set a un aller-retour', () => {
    const avant = { connaissances: new Set(['molly_rencontre', 'toxine_posee']) };
    const apres = deserialiser<typeof avant>(serialiser(avant));

    expect(apres.connaissances).toBeInstanceOf(Set);
    expect(apres.connaissances.has('molly_rencontre')).toBe(true);
    expect(apres.connaissances.size).toBe(2);
  });

  it('gere un Set vide', () => {
    const apres = deserialiser<{ s: Set<string> }>(serialiser({ s: new Set<string>() }));
    expect(apres.s).toBeInstanceOf(Set);
    expect(apres.s.size).toBe(0);
  });

  it('gere un Set imbrique', () => {
    const avant = { profil: { niveau2: { s: new Set(['a']) } } };
    const apres = deserialiser<typeof avant>(serialiser(avant));
    expect(apres.profil.niveau2.s.has('a')).toBe(true);
  });

  it('laisse intacts les types ordinaires', () => {
    const avant = { n: 12, t: 'sable', b: true, arr: [1, 2], nul: null };
    expect(deserialiser(serialiser(avant))).toEqual(avant);
  });

  it("preserve l'ordre d'insertion des connaissances", () => {
    const avant = { s: new Set(['c', 'a', 'b']) };
    const apres = deserialiser<typeof avant>(serialiser(avant));
    expect([...apres.s]).toEqual(['c', 'a', 'b']);
  });
});
