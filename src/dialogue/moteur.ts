import { Story } from 'inkjs';
import { useRunStore } from '@/stores/runStore';
import { useProfileStore } from '@/stores/profileStore';
import { calculerPalier } from './paliers';
import { parseTagsChoix, parseTagsLigne, type MiseEnScene } from './tags';
import type { ChoixDialogue, LigneDialogue } from '@/types/jeu';

export interface EtatDialogue {
  lignes: LigneDialogue[];
  choix: ChoixDialogue[];
  decor: string | null;
  termine: boolean;
}

const ETAT_VIDE: EtatDialogue = { lignes: [], choix: [], decor: null, termine: false };

/**
 * Pont entre inkjs et les stores.
 *
 * Repartition des responsabilites : le store est la source de verite ENTRE les
 * scenes, Ink l'est PENDANT une scene. Au demarrage d'une scene on pousse
 * l'etat du store dans les variables Ink ; en cours de scene, les observateurs
 * de variables ramenent les changements vers le store.
 */
export class MoteurDialogue {
  private story: Story;
  private etat: EtatDialogue = ETAT_VIDE;
  private ecouteurs = new Set<() => void>();
  private miseEnScene: MiseEnScene = {
    locuteur: null,
    portrait: null,
    expression: null,
    decor: null,
    musique: null,
    sfx: null,
  };
  /** Texte du choix qui vient d'etre pris ; sert a marquer son echo. */
  private repliqueAttendue: string | null = null;
  private sceneAResoudre: string | null = null;

  private constructor(story: Story) {
    this.story = story;
    this.lierExternes();
    this.observerVariables();
  }

  static async charger(url = '/content/main.ink.json'): Promise<MoteurDialogue> {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`Trame narrative introuvable (HTTP ${reponse.status})`);
    return new MoteurDialogue(new Story(await reponse.json()));
  }

  // --- Pont Ink -> jeu (lecture) ------------------------------------------

  private lierExternes(): void {
    const lier = (nom: string, fn: (...args: never[]) => unknown) =>
      this.story.BindExternalFunction(nom, fn as (...args: unknown[]) => unknown, false);

    lier('knows', ((id: string) => useProfileStore.getState().connait(String(id))) as never);
    lier('skill', ((nom: string) => useRunStore.getState().competence(String(nom))) as never);
    lier('has_implant', ((id: string) => useRunStore.getState().aImplant(String(id))) as never);
    lier('crew_present', ((id: string) =>
      useRunStore.getState().equipagePresent(String(id))) as never);

    lier('learn', ((id: string) => {
      useProfileStore.getState().apprendre(String(id));
      return 0;
    }) as never);

    // La resolution est differee : modifier les variables Ink pendant un
    // Continue() en cours corromprait l'etat du recit.
    lier('resolve_scene', ((id: string) => {
      this.sceneAResoudre = String(id);
      return 0;
    }) as never);
  }

  // --- Pont jeu -> Ink (ecriture) -----------------------------------------

  private observerVariables(): void {
    this.story.ObserveVariable('confiance', (_n, v) =>
      useRunStore.setState({ confiance: Number(v) }),
    );
    this.story.ObserveVariable('soupcon', (_n, v) => useRunStore.setState({ soupcon: Number(v) }));
    this.story.ObserveVariable('humanite', (_n, v) =>
      useRunStore.setState({ humanite: Number(v) }),
    );
    this.story.ObserveVariable('credits', (_n, v) => useRunStore.setState({ credits: Number(v) }));
  }

  private pousserEtatVersInk(): void {
    const r = useRunStore.getState();
    this.story.variablesState['humanite'] = r.humanite;
    this.story.variablesState['credits'] = r.credits;
    this.story.variablesState['cycles_restants'] = r.cycles;
    this.story.variablesState['confiance'] = r.confiance;
    this.story.variablesState['soupcon'] = r.soupcon;
  }

  // --- Boucle -------------------------------------------------------------

  demarrer(): void {
    this.pousserEtatVersInk();
    this.etat = { ...ETAT_VIDE, lignes: [] };
    this.avancer();
  }

  choisir(i: number): void {
    const choix = this.etat.choix[i];
    if (!choix || !choix.abordable) return;
    this.repliqueAttendue = choix.texte;
    this.story.ChooseChoiceIndex(i);
    this.avancer();
  }

  private avancer(): void {
    const lignes = [...this.etat.lignes];

    while (this.story.canContinue) {
      const texte = (this.story.Continue() ?? '').trim();
      const tags = this.story.currentTags ?? [];

      if (tags.length > 0) {
        const maj = parseTagsLigne(tags);
        // Les tags ne sont poses qu'a la premiere ligne d'un knot ; la mise en
        // scene reste donc valable pour les lignes suivantes.
        for (const cle of Object.keys(maj) as (keyof MiseEnScene)[]) {
          if (maj[cle] !== null) this.miseEnScene[cle] = maj[cle];
        }
      }

      if (!texte) continue;

      const replique = this.repliqueAttendue !== null && texte === this.repliqueAttendue;
      if (replique) this.repliqueAttendue = null;

      lignes.push({
        texte,
        locuteur: this.miseEnScene.locuteur,
        portrait: this.miseEnScene.portrait,
        expression: this.miseEnScene.expression,
        replique,
      });
    }

    if (this.sceneAResoudre !== null) this.resoudreScene(this.sceneAResoudre);

    const run = useRunStore.getState();
    const choix: ChoixDialogue[] = this.story.currentChoices.map((c, i) => {
      const { etiquette, cout } = parseTagsChoix(c.tags ?? []);
      return { index: i, texte: c.text, etiquette, cout, abordable: run.peutPayer(cout) };
    });

    this.etat = {
      lignes,
      choix,
      decor: this.miseEnScene.decor,
      termine: choix.length === 0 && !this.story.canContinue,
    };
    this.notifier();
  }

  private resoudreScene(scene: string): void {
    this.sceneAResoudre = null;
    const r = useRunStore.getState();
    r.enregistrerIssue(scene, calculerPalier(r.confiance, r.soupcon));
    r.reinitJauges();
    this.story.variablesState['confiance'] = 0;
    this.story.variablesState['soupcon'] = 0;
  }

  // --- Abonnement (useSyncExternalStore) ----------------------------------

  souscrire = (fn: () => void): (() => void) => {
    this.ecouteurs.add(fn);
    return () => this.ecouteurs.delete(fn);
  };

  lire = (): EtatDialogue => this.etat;

  private notifier(): void {
    for (const fn of this.ecouteurs) fn();
  }
}
