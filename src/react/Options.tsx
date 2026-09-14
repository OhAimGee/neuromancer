import { useUiStore } from '@/stores/uiStore';

/** Rythmes proposes, en caracteres par seconde. 0 = tout d'un coup. */
const VITESSES: { libelle: string; valeur: number }[] = [
  { libelle: 'INSTANTANÉ', valeur: 0 },
  { libelle: 'RAPIDE', valeur: 80 },
  { libelle: 'NORMAL', valeur: 45 },
  { libelle: 'LENT', valeur: 22 },
];

const CRANS = [0, 0.25, 0.5, 0.75, 1];

/** Reglage de volume en cinq crans, affiche comme une barre pleine ou vide. */
function jauge(valeur: number, poser: (v: number) => void) {
  return CRANS.map((v) => (
    <button
      key={v}
      className={valeur >= v && v > 0 ? 'opt__cran opt__cran--plein' : 'opt__cran'}
      onClick={() => poser(v)}
      aria-label={`${Math.round(v * 100)} %`}
    >
      {v === 0 ? '\u00d7' : '\u2588'}
    </button>
  ));
}

/**
 * Panneau d'options. Les deux premieres lignes ne sont pas du confort : une
 * esthetique a scanlines et glitch presente un risque photosensible reel, et
 * doit pouvoir etre coupee sans quitter la partie.
 */
export function Options({ onFermer }: { onFermer: () => void }) {
  const ui = useUiStore();

  return (
    <div className="opt" role="dialog" aria-label="Options">
      <p className="opt__titre">OPTIONS</p>

      <div className="opt__ligne">
        <span className="opt__cle">SCANLINES</span>
        <button className="opt__val" onClick={ui.basculerScanlines}>
          {ui.scanlines ? 'ACTIVÉES' : 'COUPÉES'}
        </button>
      </div>

      <div className="opt__ligne">
        <span className="opt__cle">GLITCH</span>
        <button className="opt__val" onClick={ui.basculerGlitch}>
          {ui.glitch ? 'ACTIVÉ' : 'COUPÉ'}
        </button>
      </div>
      <p className="opt__note">Coupe les deux en cas de sensibilité aux images clignotantes.</p>

      <div className="opt__ligne">
        <span className="opt__cle">TEXTE</span>
        <span className="opt__choix">
          {VITESSES.map((v) => (
            <button
              key={v.valeur}
              className={ui.vitesseTexte === v.valeur ? 'opt__val opt__val--actif' : 'opt__val'}
              onClick={() => ui.setVitesseTexte(v.valeur)}
            >
              {v.libelle}
            </button>
          ))}
        </span>
      </div>

      <div className="opt__ligne">
        <span className="opt__cle">MUSIQUE</span>
        <span className="opt__choix">{jauge(ui.volumeMusique, (v) => ui.setVolume('musique', v))}</span>
      </div>

      <div className="opt__ligne">
        <span className="opt__cle">EFFETS</span>
        <span className="opt__choix">{jauge(ui.volumeEffets, (v) => ui.setVolume('effets', v))}</span>
      </div>
      <p className="opt__note">
        La banque sonore se télécharge à part — voir docs/audio.md. Le jeu tourne sans.
      </p>

      <button className="net__bouton opt__fermer" onClick={onFermer}>
        FERMER
      </button>
    </div>
  );
}
