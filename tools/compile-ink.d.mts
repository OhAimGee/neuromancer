/** Types pour l'outil de compilation Ink, consomme par les tests. */
export declare function compileInk(): {
  json: string | null;
  errors: string[];
  warnings: string[];
  authorMessages: string[];
};
