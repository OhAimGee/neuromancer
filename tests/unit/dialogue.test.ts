import { describe, it, expect } from 'vitest';
import { parseTagsChoix, parseTagsLigne } from '@/dialogue/tags';
import { calculerPalier } from '@/dialogue/paliers';

describe('parseTagsChoix', () => {
  it('lit une étiquette et un coût', () => {
    const r = parseTagsChoix(['etq:FRAGMENT', 'cout_humanite:10']);
    expect(r.etiquette).toBe('FRAGMENT');
    expect(r.cout).toEqual({ credits: 0, cycles: 0, humanite: 10 });
  });

  it('cumule plusieurs coûts', () => {
    const r = parseTagsChoix(['cout_credits:200', 'cout_cycles:1']);
    expect(r.cout).toEqual({ credits: 200, cycles: 1, humanite: 0 });
  });

  it('ignore une étiquette inconnue plutôt que de la propager', () => {
    expect(parseTagsChoix(['etq:BAVARDAGE']).etiquette).toBeNull();
  });

  it('ignore un coût non numérique', () => {
    expect(parseTagsChoix(['cout_credits:beaucoup']).cout.credits).toBe(0);
  });

  it('rend un coût nul sans tags', () => {
    const r = parseTagsChoix([]);
    expect(r.etiquette).toBeNull();
    expect(r.cout).toEqual({ credits: 0, cycles: 0, humanite: 0 });
  });
});

describe('parseTagsLigne', () => {
  it('sépare le portrait de son expression', () => {
    const r = parseTagsLigne(['speaker:molly', 'portrait:port_molly:menacante']);
    expect(r.locuteur).toBe('molly');
    expect(r.portrait).toBe('port_molly');
    expect(r.expression).toBe('menacante');
  });

  it("retombe sur l'expression neutre si elle est omise", () => {
    expect(parseTagsLigne(['portrait:port_ratz']).expression).toBe('neutre');
  });

  it('lit décor, musique et bruitage', () => {
    const r = parseTagsLigne(['bg:map_chatsubo', 'musique:ambiance', 'sfx:porte_pluie']);
    expect(r.decor).toBe('map_chatsubo');
    expect(r.musique).toBe('ambiance');
    expect(r.sfx).toBe('porte_pluie');
  });
});

describe('calculerPalier — le soupçon plafonne la réussite', () => {
  it('accorde le critique quand la confiance est haute et le soupçon bas', () => {
    expect(calculerPalier(7, 1)).toBe('critique');
  });

  it('rétrograde en succès dès que le soupçon dépasse le seuil critique', () => {
    expect(calculerPalier(7, 3)).toBe('succes');
  });

  it('rétrograde en neutre quand le soupçon monte encore', () => {
    expect(calculerPalier(7, 5)).toBe('neutre');
  });

  it('échoue si le soupçon est trop haut, quelle que soit la confiance', () => {
    expect(calculerPalier(20, 7)).toBe('echec');
  });

  it('reste neutre sur une scène sans engagement', () => {
    expect(calculerPalier(0, 0)).toBe('neutre');
  });

  it('traite les seuils exacts comme atteints', () => {
    expect(calculerPalier(6, 2)).toBe('critique');
    expect(calculerPalier(3, 4)).toBe('succes');
  });
});
