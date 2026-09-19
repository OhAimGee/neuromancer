import donnees from '@data/boutique.json';
import { IMPLANTS, implant } from '@/hacking/implants';
import { SCRIPTS } from '@/hacking/session';
import { COUT_NUL, type Cout } from '@/types/jeu';

export type TypeRayon = 'script' | 'implant';

interface ArticleBrut {
  id: string;
  prix?: Partial<Cout>;
  resume?: string;
  reglisse?: string;
}

interface RayonBrut {
  id: string;
  titre: string;
  type: TypeRayon;
  requiert?: string;
  articles: ArticleBrut[];
}

interface MarchandBrut {
  nom: string;
  portrait: string;
  accueil: string[];
  adieu: string;
  rayons: RayonBrut[];
}

/** Ce que le joueur voit d'un article, une fois l'etat de partie applique. */
export interface Article {
  id: string;
  type: TypeRayon;
  nom: string;
  cout: Cout;
  resume: string;
  reglisse: string;
  /** Rang dans la planche d'icones du type. L'ordre de data/*.json fait foi. */
  rang: number;
  /** Faux si le Finn ne peut rien en faire : deja acquis, ou plan manquant. */
  disponible: boolean;
  /** Pourquoi il ne l'est pas. Affiche tel quel : un refus muet est pire. */
  refus: string | null;
}

export interface Rayon {
  id: string;
  titre: string;
  type: TypeRayon;
  articles: Article[];
}

export interface Marchand {
  nom: string;
  portrait: string;
  accueil: string[];
  adieu: string;
  rayons: Rayon[];
}

const MARCHANDS = donnees as unknown as Record<string, MarchandBrut | undefined>;

const RANG_SCRIPT = new Map(SCRIPTS.map((s, i) => [s.id, i]));
const NOM_SCRIPT = new Map(SCRIPTS.map((s) => [s.id, s.nom]));
const RANG_IMPLANT = new Map(IMPLANTS.map((i, r) => [i.id, r]));

/** Etat de partie dont depend l'etalage. Passe en argument : rien n'est lu ici. */
export interface EtatAchat {
  scripts: readonly string[];
  implants: readonly string[];
  plans: readonly string[];
}

function cout(partiel: Partial<Cout> | undefined): Cout {
  return {
    credits: partiel?.credits ?? COUT_NUL.credits,
    cycles: partiel?.cycles ?? COUT_NUL.cycles,
    humanite: partiel?.humanite ?? COUT_NUL.humanite,
  };
}

/**
 * Resout un article : son nom, son prix et la raison pour laquelle il est
 * eventuellement hors d'atteinte.
 *
 * Le prix d'un implant vient de `data/implants.json` et JAMAIS du catalogue :
 * la fiche d'implant porte deja les trois monnaies et l'effet chiffre, et
 * recopier un prix dans deux fichiers est la facon la plus sure de les voir
 * diverger — le joueur paierait alors un prix que l'equilibrage ignore.
 */
function resoudre(brut: ArticleBrut, rayon: RayonBrut, etat: EtatAchat): Article | null {
  if (rayon.type === 'script') {
    const nom = NOM_SCRIPT.get(brut.id);
    if (nom === undefined) return null;
    const possede = etat.scripts.includes(brut.id);
    return {
      id: brut.id,
      type: 'script',
      nom,
      cout: cout(brut.prix),
      resume: brut.resume ?? '',
      reglisse: brut.reglisse ?? '',
      rang: RANG_SCRIPT.get(brut.id) ?? 0,
      disponible: !possede,
      refus: possede ? 'Déjà dans le deck.' : null,
    };
  }

  const fiche = implant(brut.id);
  if (fiche === null) return null;
  const pose = etat.implants.includes(brut.id);
  const plan = etat.plans.includes(brut.id);
  return {
    id: brut.id,
    type: 'implant',
    nom: fiche.nom,
    cout: { credits: fiche.coutCredits, cycles: fiche.coutCycles, humanite: fiche.coutHumanite },
    resume: fiche.resume,
    reglisse: brut.reglisse ?? '',
    rang: RANG_IMPLANT.get(brut.id) ?? 0,
    disponible: !pose && plan,
    refus: pose ? 'Déjà sous la peau.' : plan ? null : 'Le Finn n’a pas le plan. Vole-le.',
  };
}

/** L'etalage tel qu'il se presente a cet instant de cette partie. */
export function etalage(marchand: string, etat: EtatAchat): Marchand | null {
  const brut = MARCHANDS[marchand];
  if (!brut) return null;
  return {
    nom: brut.nom,
    portrait: brut.portrait,
    accueil: brut.accueil,
    adieu: brut.adieu,
    rayons: brut.rayons.map((r) => ({
      id: r.id,
      titre: r.titre,
      type: r.type,
      articles: r.articles
        .map((a) => resoudre(a, r, etat))
        .filter((a): a is Article => a !== null),
    })),
  };
}
