# Banque sonore — sources à télécharger

Le bus audio est monté et câblé : `data/audio.json` associe chaque identifiant à un fichier de
`public/assets/audio/`. **Le jeu tourne sans aucun de ces fichiers** — un fichier absent est
signalé une fois dans la console et le son est ignoré. Il n'y a donc rien à faire en urgence.

Les fichiers ne sont pas versionnés dans le dépôt : ce sont des archives audio, et elles
appartiennent à leurs auteurs. À télécharger soi-même, en **CC0 uniquement**.

## Où chercher

- [Freesound](https://freesound.org) — filtre de licence : *Creative Commons 0*
- [OpenGameArt](https://opengameart.org) — filtre : *CC0*

## Ce qu'il faut, et ce que ça doit faire

Format : **OGG Vorbis**, mono suffit pour les effets, stéréo pour les nappes. Viser -16 LUFS
environ pour les ambiances et -10 LUFS pour les effets, sinon les effets passent sous la nappe.

| Identifiant | Durée | Registre recherché |
|---|---|---|
| `ambiance_ninsei` | 60-120 s, bouclable | Pluie sur béton, foule lointaine étouffée, bourdonnement de néon. Aucune voix identifiable. |
| `ambiance_chatsubo` | 60-120 s, bouclable | Intérieur de bar : rumeur basse, verres, un ventilateur. Plus sourd que Ninsei. |
| `nappe_matrice` | 90-180 s, bouclable | Drone synthétique froid, très peu d'événements. Ne doit pas avoir de pulsation : la tension vient de la trace, pas de la musique. |
| `matrice_froide` | 90-180 s, bouclable | Plus nu et plus haut que `nappe_matrice`. Sert au flashback du flatline et à la percée de la Villa — deux fois où la matrice n'est pas un terrain de jeu. |
| `nappe_fin` | 40-90 s | Nappe descendante, résignée. Sert aux deux fins — la même musique pour mourir et pour partir, c'est voulu. |
| `jack_in` | < 1,5 s | Connexion : claquement sec puis montée courte. |
| `porte_pluie` | < 2 s | Une porte qui s'ouvre sur la pluie du dehors, puis se referme. L'entrée de Molly au Chatsubo. |
| `trace_alerte` | < 1 s | Alarme unique, grave. Tirée une seule fois au franchissement du seuil. |
| `trace_monte` | < 0,5 s | Tick discret, réservé aux montées de trace. |
| `glace_noire` | 1-3 s | La riposte létale. Impact bas, saturé, qui s'arrête net. |
| `ui_clic` | < 0,2 s | Clic d'interface, sec, sans hauteur. |
| `ui_valide` | < 0,3 s | Validation de choix. |
| `ui_refus` | < 0,3 s | Choix inabordable. Doit se distinguer de `ui_valide` sans être désagréable. |

## Installation

Déposer les fichiers sous `public/assets/audio/` avec **exactement** le nom donné dans
`data/audio.json`. Rien d'autre à faire : ils sont pris en compte au rechargement de la page.

**Le format compte, et OGG Vorbis n'est pas une préférence.** Vérifié dans Chromium : un AIFF
n'est ni décodable par Web Audio (`Unable to decode audio data`) ni lisible par un élément
`<audio>` (`MEDIA_ERR_SRC_NOT_SUPPORTED`) — `canPlayType('audio/aiff')` répond la chaîne vide.
Un fichier au mauvais format se comporte exactement comme un fichier absent : une ligne dans la
console, et le silence. Convertir avant de déposer :

```bash
ffmpeg -i source.aiff -c:a libvorbis -q:a 4 -ar 44100 -ac 2 public/assets/audio/<identifiant>.ogg
```

L'écart de poids n'est pas anecdotique : une ambiance d'une minute passe de 19 Mo en PCM 24 bits
à moins de 800 ko en Vorbis `-q:a 4`. Tout ce qui traîne dans `public/` est recopié tel quel dans
`dist/` au build, y compris les sources non converties.

```
public/assets/audio/
  ambiance_ninsei.ogg
  ambiance_chatsubo.ogg
  nappe_matrice.ogg
  matrice_froide.ogg
  nappe_fin.ogg
  jack_in.ogg
  porte_pluie.ogg
  trace_alerte.ogg
  trace_monte.ogg
  glace_noire.ogg
  ui_clic.ogg
  ui_valide.ogg
  ui_refus.ogg
```

Le volume de chaque son se règle dans `data/audio.json` (`volume`, de 0 à 1), et les deux bus
— musique et effets — se règlent en jeu dans les options (Échap).

## Crédits

Les sources CC0 ne l'exigent pas, mais lister ce qui a été utilisé reste la bonne pratique :
ajouter une ligne par fichier ici au fur et à mesure.
