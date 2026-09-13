// Vitest tourne en environnement Node : les stores persistes ont besoin d'un
// localStorage. Un shim en memoire suffit et rend les tests deterministes.

class MemoryStorage implements Storage {
  private donnees = new Map<string, string>();

  get length(): number {
    return this.donnees.size;
  }
  clear(): void {
    this.donnees.clear();
  }
  getItem(cle: string): string | null {
    return this.donnees.get(cle) ?? null;
  }
  key(i: number): string | null {
    return [...this.donnees.keys()][i] ?? null;
  }
  removeItem(cle: string): void {
    this.donnees.delete(cle);
  }
  setItem(cle: string, valeur: string): void {
    this.donnees.set(cle, valeur);
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
});
