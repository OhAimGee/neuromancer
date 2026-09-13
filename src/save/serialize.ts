/**
 * (De)serialisation des sauvegardes.
 *
 * JSON ne sait pas representer un Set, et profileStore.knowledge en est un.
 * Sans ces deux fonctions, les connaissances debloquees se perdent
 * silencieusement au rechargement — le pire bug possible sur un jeu dont toute
 * la meta-progression repose la-dessus.
 */

const MARQUEUR_SET = '__Set__';

interface SetSerialise {
  [MARQUEUR_SET]: string[];
}

function estSetSerialise(v: unknown): v is SetSerialise {
  return (
    typeof v === 'object' &&
    v !== null &&
    MARQUEUR_SET in v &&
    Array.isArray((v as SetSerialise)[MARQUEUR_SET])
  );
}

export function replacer(_cle: string, valeur: unknown): unknown {
  if (valeur instanceof Set) {
    return { [MARQUEUR_SET]: [...valeur].map(String) } satisfies SetSerialise;
  }
  return valeur;
}

export function reviver(_cle: string, valeur: unknown): unknown {
  if (estSetSerialise(valeur)) return new Set(valeur[MARQUEUR_SET]);
  return valeur;
}

export function serialiser(etat: unknown): string {
  return JSON.stringify(etat, replacer);
}

export function deserialiser<T>(brut: string): T {
  return JSON.parse(brut, reviver) as T;
}
