import { Story } from 'inkjs';
import { useRunStore } from '@/stores/runStore';
import { useProfileStore } from '@/stores/profileStore';
import { calculerPalier } from './paliers';
import { parseTagsChoix, parseTagsLigne, type MiseEnScene } from './tags';
import type { ChoixDialogue, LigneDialogue } from '@/types/jeu';

export interface EtatDialogue {
  /** La replique courante. Une seule a la fois : la boite n'est pas un journal. */
  ligne: LigneDialogue | null;
  choix: ChoixDialogue[];
  decor: string | null;
  entracte: string | null;
  /** Il reste du texte : le joueur doit valider pour passer a la suite. */
  peutContinuer: boolean;
  /** Le recit reclame une plongee sur ce point d'acces physique. */
  plongee: string | null;
  /** Identifiant de la fin atteinte. Non nul = la partie est finie. */
  fin: string | null;
  /** Explication de regle reclamee par le recit, a montrer une fois par profil. */
  glose: string | null;
  termine: boolean;
}

const ETAT_VIDE: EtatDialogue = {
  ligne: null,
  choix: [],
  decor: null,
  entracte: null,
  peutContinuer: false,
  plongee: null,
  fin: null,
  glose: null,
  termine: false,
};

/**
 * Une replique, accompagnee de la mise en scene qui valait a sa lecture.
 *
 * La mise en scene est copiee et non partagee : le moteur lit toujours une
 * replique d'avance, et celle-ci peut porter un `# bg:` ou un `# entracte:`
 * qui ne doit surtout pas s'appliquer a la replique encore a l'ecran.
 */
interface Beat {
  ligne: LigneDialogue;
  scene: MiseEnScene;
}

/** Une plongee demandee par le recit, et le knot ou il reprendra ensuite. */
interface Plongee {
  point: string;
  retour: string;
}

/**
 * Les deux seuls chemins que le moteur emprunte de sa propre initiative.
 *
 * Tout le reste du routage vit dans le recit : c'est `plonger()` qui nomme son
 * knot de retour. Un flatline fait exception, parce qu'il n'y a plus personne
 * pour choisir.
 */
const KNOT_FLATLINE = 'fin_flatline_reseau';
const KNOT_HUB = 'hub';

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
    entracte: null,
    fin: null,
    glose: null,
  };
  /**
   * La replique affichee, et celle d'apres, deja lue.
   *
   * Le moteur garde UNE replique d'avance : c'est la seule facon de savoir s'il
   * reste quelque chose a lire, donc d'afficher le chevron a bon escient. Sans
   * cette avance, une fin de knot faisait clignoter le chevron puis avalait une
   * pression du joueur sans rien changer a l'ecran.
   */
  private courant: Beat | null = null;
  private suivant: Beat | null = null;
  /** Texte du choix qui vient d'etre pris ; sert a marquer son echo. */
  private repliqueAttendue: string | null = null;
  private sceneAResoudre: string | null = null;
  private plongeeDemandee: Plongee | null = null;
  private finEnregistree = false;
  private demarre = false;

  private constructor(story: Story) {
    this.story = story;
    this.lierExternes();
    this.observerVariables();
  }

  static async charger(url = '/content/main.ink.json'): Promise<MoteurDialogue> {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`Trame narrative introuvable (HTTP ${reponse.status})`);
    return MoteurDialogue.depuisJson(await reponse.json());
  }

  /** Meme moteur, sans reseau : c'est par la que passent les tests. */
  static depuisJson(json: string | Record<string, unknown>): MoteurDialogue {
    // Story surcharge string et objet ; l'union ne resout aucune des deux.
    return new MoteurDialogue(typeof json === 'string' ? new Story(json) : new Story(json));
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

    // L'ouverture laisse le joueur choisir comment il est mort ; ce choix
    // definit la competence qu'il a gardee. C'est la seule ecriture du recit
    // vers les competences.
    lier('boost_competence', ((nom: string) => {
      useRunStore.getState().ameliorerCompetence(String(nom), 1);
      return 0;
    }) as never);

    // Le recit rend la main au jeu. La demande est mise de cote et non honoree
    // sur-le-champ : le moteur lit une replique d'avance, et la plongee doit
    // attendre que le joueur ait fini de lire ce qui est a l'ecran.
    lier('plonger', ((point: string, retour: string) => {
      this.plongeeDemandee = { point: String(point), retour: String(retour) };
      return 0;
    }) as never);

    lier('acquerir_script', ((id: string) => {
      useRunStore.getState().acquerir('scripts', String(id));
      return 0;
    }) as never);

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
    // Sans cet observateur, un choix qui annonce `# cout_cycles:1` decrementait
    // la variable Ink et laissait l'horloge du jeu intacte : le compte a rebours
    // ne descendait jamais hors des plongees.
    this.story.ObserveVariable('cycles_restants', (_n, v) =>
      useRunStore.setState({ cycles: Number(v) }),
    );
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

  /**
   * Idempotent, et ce n'est pas un detail : React 19 monte deux fois les effets
   * en mode strict. Sans cette garde, le second appel remettait `lignes` a vide
   * alors que l'histoire etait deja arrivee au premier choix — tout le recit
   * d'ouverture disparaissait de l'ecran sans la moindre erreur.
   */
  demarrer(): void {
    if (this.demarre) return;
    this.demarre = true;
    this.pousserEtatVersInk();
    this.etat = ETAT_VIDE;
    this.recharger();
  }

  /** Passe a la replique suivante. Sans effet s'il n'y a plus rien a lire. */
  continuer(): void {
    if (this.suivant === null) return;
    this.courant = this.suivant;
    this.suivant = this.consommer();
    this.publier();
  }

  choisir(i: number): void {
    const choix = this.etat.choix[i];
    if (!choix || !choix.abordable) return;
    this.repliqueAttendue = choix.texte;
    this.story.ChooseChoiceIndex(i);
    this.recharger();
  }

  /**
   * Reprend le recit a un knot nomme. C'est ce qui rend la structure en hub
   * possible : chaque scene finit par `-> DONE`, et le jeu redonne la main au
   * recit la ou il le decide.
   */
  reprendre(knot: string): void {
    this.pousserEtatVersInk();
    this.story.ChoosePathString(knot);
    this.recharger();
  }

  /**
   * Fin de plongee. Le recit reprend ou il l'avait dit — sauf si Sable y est
   * reste : un flatline ne laisse personne pour choisir la suite.
   */
  terminerPlongee(flatline: boolean): void {
    const demande = this.plongeeDemandee;
    this.plongeeDemandee = null;
    this.reprendre(flatline ? KNOT_FLATLINE : (demande?.retour ?? KNOT_HUB));
  }

  /** Reprend la lecture apres un saut : replique courante, puis son avance. */
  private recharger(): void {
    const beat = this.consommer();
    if (beat !== null) this.courant = beat;
    this.suivant = this.consommer();
    this.publier();
  }

  /**
   * Consomme exactement UNE replique, ou rend null si le recit n'en a plus.
   *
   * Le moteur ne deroule plus la scene d'un trait : la boite de dialogue en
   * montre une a la fois, comme dans un RPG au tour par tour, et c'est le
   * joueur qui demande la suite.
   */
  private consommer(): Beat | null {
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

      // Les lignes vides ne sont pas des repliques : on les saute sans compter.
      if (!texte) continue;

      const replique = this.repliqueAttendue !== null && texte === this.repliqueAttendue;
      if (replique) this.repliqueAttendue = null;

      return {
        ligne: {
          texte,
          // Une replique du joueur est prononcee par Sable, jamais par le PNJ
          // dont la mise en scene est encore en place.
          locuteur: replique ? 'sable' : this.miseEnScene.locuteur,
          portrait: replique ? null : this.miseEnScene.portrait,
          expression: this.miseEnScene.expression,
          replique,
          dite: replique || texte.startsWith('\u2014'),
        },
        scene: { ...this.miseEnScene },
      };
    }
    return null;
  }

  private publier(): void {
    if (this.sceneAResoudre !== null) this.resoudreScene(this.sceneAResoudre);

    // Les choix n'existent qu'une fois le texte epuise : sinon ils
    // s'afficheraient sous une replique que le joueur n'a pas encore lue.
    const enAttenteDeLecture = this.suivant !== null;
    const run = useRunStore.getState();
    const choix: ChoixDialogue[] = enAttenteDeLecture
      ? []
      : this.story.currentChoices.map((c, i) => {
          const { etiquette, cout } = parseTagsChoix(c.tags ?? []);
          return { index: i, texte: c.text, etiquette, cout, abordable: run.peutPayer(cout) };
        });

    const fin = this.courant?.scene.fin ?? null;
    if (fin !== null && !this.finEnregistree) {
      this.finEnregistree = true;
      useProfileStore.getState().enregistrerFin(fin, run.cycles);
      run.terminer();
    }

    // La plongee attend que le joueur ait lu ce qui est a l'ecran : sinon la
    // matrice s'ouvrirait sous une replique qu'il n'a pas encore vue.
    const plongee = !enAttenteDeLecture && fin === null ? (this.plongeeDemandee?.point ?? null) : null;

    this.etat = {
      ligne: this.courant?.ligne ?? null,
      choix,
      decor: this.courant?.scene.decor ?? null,
      entracte: this.courant?.scene.entracte ?? null,
      peutContinuer: enAttenteDeLecture,
      plongee,
      fin,
      glose: this.courant?.scene.glose ?? null,
      termine: !enAttenteDeLecture && choix.length === 0 && plongee === null && fin === null,
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
