import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '@/audio/bus';
import { etalage, type Article } from '@/boutique/catalogue';
import { implant } from '@/hacking/implants';
import { useRunStore } from '@/stores/runStore';
import { toucheGlobale, useNavigationClavier } from './useNavigationClavier';

const PLANCHE: Record<Article['type'], string> = {
  script: 'items_scripts',
  implant: 'items_implants',
};

/** Une case d'une planche d'icones de 16x16, designee par son rang. */
function Vignette({ article }: { article: Article }) {
  return (
    <i
      className="vignette"
      style={{
        backgroundImage: `url(/assets/ui/${PLANCHE[article.type]}.png)`,
        backgroundPositionX: `calc(${-16 * article.rang} * var(--px))`,
      }}
      aria-hidden="true"
    />
  );
}

/** Ce que l'implant change, en chiffres. Un resume ne suffit pas a comparer. */
function effetChiffre(article: Article): string | null {
  if (article.type !== 'implant') return null;
  const e = implant(article.id)?.effet;
  if (!e) return null;
  const morceaux: string[] = [];
  if (e.competence) morceaux.push(`hacking +${e.competence}`);
  if (e.traceMax) morceaux.push(`trace max +${e.traceMax}`);
  if (e.cyclesParTicks) morceaux.push(`${e.cyclesParTicks} ticks par cycle`);
  if (e.filtres) morceaux.push(`${e.filtres} frappe(s) absorbée(s)`);
  return morceaux.length > 0 ? morceaux.join(' · ') : null;
}

function Prix({ article }: { article: Article }) {
  const { credits, cycles, humanite } = article.cout;
  return (
    <span className="bout__prix">
      {credits > 0 && <span className="bout__cr">{credits}</span>}
      {cycles > 0 && <span className="bout__cy">{cycles}c</span>}
      {humanite > 0 && <span className="bout__hu">-{humanite}h</span>}
    </span>
  );
}

/**
 * Le comptoir du Finn.
 *
 * Il existe parce qu'un marchand n'est pas une liste de repliques : comparer
 * trois prix, lire un effet chiffre et voir ce qui manque pour acheter sont des
 * gestes d'inventaire, et les faire tenir dans des choix Ink obligeait a ecrire
 * « Acheter un MIMIC. Huit cents. » — une phrase que Sable prononce ensuite a
 * voix haute, parce qu'un libelle de choix EST sa replique.
 *
 * Le recit garde les scenes (le testament, l'antidote, le recrutement) et cede
 * les transactions. C'est la meme frontiere que `plonger()`.
 */
export function Boutique({
  marchand,
  onFermer,
  actif = true,
  onFiche,
}: {
  marchand: string;
  onFermer: () => void;
  actif?: boolean;
  onFiche?: () => void;
}) {
  const run = useRunStore();
  const [rayon, setRayon] = useState(0);
  const [accueil] = useState(() => Math.floor(Math.random() * 3));

  const comptoir = useMemo(
    () => etalage(marchand, { scripts: run.scripts, implants: run.implants, plans: run.plans }),
    [marchand, run.scripts, run.implants, run.plans],
  );

  const rayons = comptoir?.rayons ?? [];
  const courant = rayons[Math.min(rayon, rayons.length - 1)];
  const articles = courant?.articles ?? [];

  const acheter = (i: number) => {
    const a = articles[i];
    if (!a) return;
    const categorie = a.type === 'script' ? 'scripts' : 'implants';
    if (!a.disponible || !run.peutPayer(a.cout) || !run.acheter(categorie, a.id, a.cout)) {
      audio.effet('ui_refus');
      return;
    }
    audio.effet('ui_valide');
  };

  // Six implants pour une fenetre de 180 pixels : la liste defile, et une liste
  // qui defile sous un curseur clavier doit suivre le curseur. Sans cela, la
  // fleche bas emmene la selection hors de l'ecran et le joueur achete a
  // l'aveugle.
  const liste = useRef<HTMLUListElement>(null);

  const { vise, viser } = useNavigationClavier({
    actif,
    nombre: articles.length,
    surValider: acheter,
    surFermer: onFermer,
    // Les rayons se changent aux fleches horizontales, la liste aux verticales.
    // Passer `horizontal` melangerait les deux sur le meme index.
    surTouche: (e) => {
      if (rayons.length < 2) return toucheGlobale(e, { onFiche });
      if (e.key === 'ArrowRight') {
        setRayon((r) => (r + 1) % rayons.length);
        return true;
      }
      if (e.key === 'ArrowLeft') {
        setRayon((r) => (r - 1 + rayons.length) % rayons.length);
        return true;
      }
      // Pas d'options a Echap ici : `surFermer` s'en charge, et le comptoir est
      // justement l'ecran ou les deux se disputaient la touche.
      return toucheGlobale(e, { onFiche });
    },
  });

  useEffect(() => {
    liste.current?.children[vise]?.scrollIntoView({ block: 'nearest' });
  }, [vise, rayon]);

  if (!comptoir || !courant) return null;
  const choisi = articles[Math.min(vise, articles.length - 1)] ?? null;

  return (
    <div className="bout" role="dialog" aria-label={comptoir.nom}>
      <div className="bout__haut">
        <span className="bout__nom">{comptoir.nom}</span>
        <span className="bout__solde">
          <span className="bout__cr">{run.credits}</span>
          <span className="bout__cy">{run.cycles}c</span>
          <span className="bout__hu">{run.humanite}h</span>
        </span>
      </div>

      <div className="bout__rayons">
        {rayons.map((r, i) => (
          <button
            key={r.id}
            className={`bout__rayon${i === rayon ? ' bout__rayon--actif' : ''}`}
            onClick={() => setRayon(i)}
          >
            {r.titre}
          </button>
        ))}
        <span className="bout__compte">
          {articles.length > 0 ? `\u2195 ${vise + 1}/${articles.length}` : ''}
        </span>
      </div>

      <ul className="bout__liste" ref={liste}>
        {articles.map((a, i) => (
          <li key={a.id}>
            <button
              className={`bout__article${i === vise ? ' bout__article--vise' : ''}${
                a.disponible && run.peutPayer(a.cout) ? '' : ' bout__article--hors'
              }`}
              onPointerEnter={() => viser(i)}
              onClick={() => {
                viser(i);
                acheter(i);
              }}
            >
              <Vignette article={a} />
              <span className="bout__titre">{a.nom}</span>
              <Prix article={a} />
            </button>
          </li>
        ))}
      </ul>

      <div className="bout__fiche">
        {choisi === null ? (
          <p className="bout__vide">Rien à vendre aujourd&apos;hui.</p>
        ) : (
          <>
            <p className="bout__resume">{choisi.resume}</p>
            {effetChiffre(choisi) && <p className="bout__effet">{effetChiffre(choisi)}</p>}
            {/* Le refus se lit : un article grise sans raison laisse croire a
              * une panne. Celui-ci dit ce qui manque, et souvent ou aller le
              * chercher. */}
            {choisi.refus !== null && <p className="bout__refus">{choisi.refus}</p>}
          </>
        )}
      </div>

      <div className="bout__bas">
        {/* Le Finn commente ce qu'on regarde. Une phrase d'accueil qui ne
          * change jamais serait un decor ; celle-ci est la seule chose qui
          * rende un catalogue bavard. */}
        <span className="bout__dit">{choisi?.reglisse || comptoir.accueil[accueil]}</span>
        <button className="net__bouton bout__sortir" onClick={onFermer}>
          SORTIR
        </button>
      </div>
    </div>
  );
}
