import { Howl, Howler } from 'howler';
import table from '@data/audio.json';
import { useUiStore } from '@/stores/uiStore';

interface Definition {
  bus: 'musique' | 'effets';
  fichier: string;
  boucle: boolean;
  volume: number;
}

const SONS = table.sons as unknown as Record<string, Definition>;
const RACINE = '/assets/audio/';

/**
 * Bus audio.
 *
 * Il est monte des le depart mais les fichiers sont facultatifs : le projet est
 * jouable sans un seul son, et un fichier manquant se signale une fois dans la
 * console au lieu de casser une scene. C'est ce qui permet de developper le jeu
 * et de constituer la banque sonore en parallele.
 */
class BusAudio {
  private charges = new Map<string, Howl>();
  private manquants = new Set<string>();
  private musiqueEnCours: { id: string; howl: Howl } | null = null;
  private debloque = false;

  constructor() {
    // Les navigateurs refusent le son avant une interaction. On ne tente donc
    // rien avant, et on rejoue l'ambiance demandee entre-temps.
    const enAttente = () => {
      this.debloque = true;
      const veut = this.musiqueVoulue;
      this.musiqueVoulue = null;
      if (veut) this.musique(veut);
      window.removeEventListener('pointerdown', enAttente);
      window.removeEventListener('keydown', enAttente);
    };
    window.addEventListener('pointerdown', enAttente, { once: true });
    window.addEventListener('keydown', enAttente, { once: true });

    useUiStore.subscribe(() => this.appliquerVolumes());
  }

  private musiqueVoulue: string | null = null;

  private definition(id: string): Definition | null {
    const d = SONS[id];
    if (!d && !this.manquants.has(id)) {
      this.manquants.add(id);
      console.warn(`[audio] son inconnu : ${id}`);
    }
    return d ?? null;
  }

  private howl(id: string, d: Definition): Howl | null {
    const existant = this.charges.get(id);
    if (existant) return existant;
    if (this.manquants.has(id)) return null;

    const h = new Howl({
      src: [RACINE + d.fichier],
      loop: d.boucle,
      volume: this.volumeDe(d),
      html5: d.boucle,
      onloaderror: () => {
        if (this.manquants.has(id)) return;
        this.manquants.add(id);
        console.info(`[audio] fichier absent, son ignore : ${d.fichier}`);
      },
    });
    this.charges.set(id, h);
    return h;
  }

  private volumeDe(d: Definition): number {
    const ui = useUiStore.getState();
    return d.volume * (d.bus === 'musique' ? ui.volumeMusique : ui.volumeEffets);
  }

  private appliquerVolumes(): void {
    for (const [id, h] of this.charges) {
      const d = SONS[id];
      if (d) h.volume(this.volumeDe(d));
    }
  }

  /** Joue un son ponctuel. Sans effet si le fichier n'est pas la. */
  effet(id: string): void {
    if (!this.debloque) return;
    const d = this.definition(id);
    if (!d) return;
    this.howl(id, d)?.play();
  }

  /** Bascule l'ambiance. `null` coupe tout. Un meme identifiant ne rejoue pas. */
  musique(id: string | null): void {
    if (!this.debloque) {
      this.musiqueVoulue = id;
      return;
    }
    if (this.musiqueEnCours?.id === id) return;
    this.musiqueEnCours?.howl.fade(this.musiqueEnCours.howl.volume(), 0, 600);
    const precedent = this.musiqueEnCours;
    setTimeout(() => precedent?.howl.stop(), 650);
    this.musiqueEnCours = null;
    if (id === null) return;

    const d = this.definition(id);
    if (!d) return;
    const h = this.howl(id, d);
    if (!h) return;
    h.volume(0);
    h.play();
    h.fade(0, this.volumeDe(d), 900);
    this.musiqueEnCours = { id, howl: h };
  }

  /** Coupe tout — utilise au rechargement d'une partie. */
  tout_couper(): void {
    Howler.stop();
    this.musiqueEnCours = null;
  }
}

export const audio = new BusAudio();
