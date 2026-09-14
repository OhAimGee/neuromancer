# NEUROMANCER

**RPG narratif cyberpunk en pixel art.** Une boucle courte, une horloge qui ne s'arrête pas,
plusieurs fins, et une progression qui repose sur ce que *le joueur* a appris — pas sur des
statistiques.

Projet de fan **non commercial**, librement inspiré du roman de William Gibson (1984).
Jeu et code entièrement en français.

![L'ouverture, dans la matrice](docs/images/ouverture.png)

---

## Le jeu

Tu es **Sable**, cowboy de console de Chiba City. Il y a trois ans, une glace noire aurait dû te
tuer : tu as flatliné quatre-vingt-quatorze secondes, et tu en es revenu avec **quelque chose
d'autre** dans le système nerveux. Depuis, tu es brûlé — au-delà d'une certaine profondeur, te
brancher déclenche une crise.

Au Chatsubo, une femme aux lentilles-miroirs incrustées à même l'os te propose une réparation.
Quelqu'un veut ce que tu as dans le crâne. Pour garantir ta coopération, on t'a déjà posé quinze
sacs de toxine à dissolution lente.

**Douze cycles.** C'est le minuteur de la partie, et le moteur de la rejouabilité : douze cycles
ne suffisent jamais à tout faire. Chaque partie voit un autre morceau de l'histoire, parce
qu'elle en sacrifie un autre.

### Les conversations ont un prix

Chaque scène de dialogue est jouée sur deux jauges **cachées** — CONFIANCE et SOUPÇON — dont les
seuils décident de l'issue en quatre paliers. Les choix portent une étiquette qui annonce leur
nature sans en révéler l'effet :

| Étiquette | Ce qu'elle engage |
|---|---|
| `[MENSONGE]` | Si ça passe, tu obtiens. Sinon le soupçon monte, et il ne redescend pas. |
| `[MENACE]` | Tu obtiens maintenant. L'autre s'en souviendra. |
| `[CONNAISSANCE]` | Tu sais une chose qu'on ne t'a pas dite. |
| `[FRAGMENT]` | La chose dans ton crâne te souffle une réponse. Elle te coûte de l'HUMANITÉ. |
| `[IMPLANT]` | Une porte que seul un implant posé sait ouvrir. |
| `[ACTION]` | Tu ne réponds pas : tu agis. |

![Le Chatsubo](docs/images/dialogue.png)

### Le cyberespace

Tu te branches depuis un **point d'accès physique** du monde, et c'est lui qui détermine la
région atteinte : plus le jack est près d'une corpo, plus les bases de données sont grasses et
plus la glace tue vite. Le réseau est **régénéré à chaque partie** — un arbre, plus quelques
raccourcis latéraux, parce qu'une glace n'est un mur que si elle est le seul passage vers ce
qu'elle protège.

Déplacement, scripts d'intrusion, pillage. La **trace** monte à chaque action ; au plafond, la
glace noire riposte. Le butin n'entre dans la partie qu'à la **déconnexion** : un flatline
emporte tout ce que tu n'as pas ramené.

Quatre types de butin, dont un seul compte vraiment :

- **CRÉDITS** — portefeuilles crypto, on en vole un pourcentage défini par la compétence
- **PLANS** — prototypes d'implants volés aux méga-corpos
- **SCRIPTS** — nouveaux logiciels, pour percer des bases mieux gardées
- **INFOS** — **des données narratives, qui débloquent des options de dialogue et des fins**

Le quatrième est la clé de voûte : c'est lui qui empêche le hacking d'être un mini-jeu
décoratif. Voler un dossier médical débloque l'option de confronter quelqu'un avec.

![Le cyberespace](docs/images/cyberespace.png)

### La progression n'est pas une statistique

Une information découverte dans **n'importe quelle partie** débloque définitivement les options
`[CONNAISSANCE]` qui la référencent, dans toutes les parties suivantes. On ne monte pas de
niveau : on rejoue parce qu'on en sait plus.

---

## Démarrer

Node 20 ou plus.

```bash
npm install
npm run dev        # compile Ink en surveillance + serveur Vite sur :5173
```

### Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement : compilation Ink en continu + Vite |
| `npm run build` | Compile la trame, typecheck, puis build de production |
| `npm run ink:build` | Compile `content/ink/` vers `public/content/main.ink.json` |
| `npm run validate:narrative` | Vérifie la trame — voir plus bas |
| `npm run validate:assets` | Vérifie les tilemaps contre les manifestes de tilesets |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests unitaires (Vitest) |

### Vérification autonome dans un navigateur

Le choix du web s'est fait en grande partie pour ça : le jeu se teste sans intervention humaine.

```bash
node tools/jouer.mjs captures      # joue le prologue, capture chaque palette de choix
node tools/plonger.mjs captures    # prologue, branchement, plongée dans le cyberespace
node tools/screenshot.mjs vue.png  # une capture et les erreurs console
```

Chacun rend un code de sortie non nul si la console du navigateur a remonté une erreur.

---

## Architecture

| Brique | Rôle |
|---|---|
| **Vite + TypeScript + React 19** | Couche DOM : dialogues, HUD, menus |
| **PixiJS v8** | Un canvas, piloté en impératif via une ref. React ne re-rend jamais le canvas. |
| **inkjs** | Moteur narratif. Le compilateur **JavaScript pur** d'inkjs — aucune dépendance .NET. |
| **Zustand** | Trois stores séparés par cycle de vie |

```
content/ink/      sources narratives (.ink) — tout le texte joué vit ici
data/*.json       tout l'équilibrage — aucun nombre en dur dans le code
src/dialogue/     pont inkjs <-> stores, jauges, paliers
src/hacking/      génération du réseau et moteur de plongée (fonctions pures)
src/engine/       socle Pixi, tilesets, tilemaps, fond de matrice
src/react/        composants DOM
src/stores/       runStore (jetable) · profileStore (persistant) · uiStore (éphémère)
assets/           sources .aseprite, éditables
public/assets/    PNG et manifestes servis au jeu
tools/aseprite/   générateurs d'assets en Lua
tools/            chaîne Ink, validateurs, outils de vérification navigateur
```

Trois stores, séparés par **durée de vie** et non par domaine : `runStore` est jeté à chaque
partie, `profileStore` survit à tout (c'est là que vivent les connaissances), `uiStore` n'est
jamais persisté.

### Rendu pixel

Résolution interne **320×180**, mise à l'échelle **entière** uniquement. La couche DOM n'est
jamais mise à l'échelle par `transform` — le navigateur re-rastériserait le texte et le
lisserait. Toute dimension s'exprime en multiples d'un pixel de jeu (`calc(10 * var(--px))`).
Palette **verrouillée à 32 couleurs**, partagée à l'identique entre le CSS et Aseprite.

### Production d'assets

Les assets sont **générés par des scripts Lua** exécutés dans Aseprite, et non dessinés à la
main : un tileset entier est une boucle, pas cinquante appels d'outil.

```bash
tools/aseprite.sh tools/aseprite/ts_interior.lua
```

Les générateurs sont **déterministes** — deux exécutions donnent le même MD5, sinon chaque
régénération polluerait le diff. Les décors sont des **tilemaps de données** : des rangées d'art
ASCII plus une légende vers des noms de tuiles, jamais des images plein écran.

### Validation de la trame

`npm run validate:narrative` fait deux passes.

**Statique**, sur les sources `.ink` — elle attrape ce qu'aucune exécution ne révélerait :

- crochets dans un choix (piège Ink : `choice.tags` revient vide, étiquettes et coûts perdus) ;
- tag inconnu — Ink accepte n'importe quelle étiquette et le moteur ignore ce qu'il ne connaît
  pas, donc une faute de frappe ne se verrait jamais à l'écran ;
- `EXTERNAL` déclaré mais jamais lié côté moteur, ce qui fait refuser la trame au chargement ;
- **coût affiché qui ne correspond pas à l'arithmétique Ink du corps du choix** — l'interface
  annoncerait un prix que le récit ne prélèverait pas.

**Dynamique** : 500 parties à choix aléatoires, pour les plantages d'exécution et les fins
devenues inatteignables.

---

## État d'avancement

Tranche verticale en cours. Ce qui tourne aujourd'hui :

- [x] Chaîne Ink complète, sans dépendance .NET
- [x] Moteur de dialogue : jauges cachées, quatre paliers, étiquettes, coûts
- [x] Sauvegarde versionnée à deux couches (partie / profil)
- [x] Ouverture jouable, prologue, explications des règles au premier contact
- [x] Socle Pixi, tilesets, tilemaps, fond de matrice
- [x] Cyberespace jouable : génération, trace, scripts, quatre types de butin
- [x] Validateurs de trame et d'assets, vérification navigateur autonome
- [ ] Hub ouvert et recrutement d'équipage
- [ ] Fins
- [ ] Portraits, tilesets extérieurs, audio

---

## Mentions

Projet de fan **non commercial**, sans but lucratif, inspiré de *Neuromancer* de William Gibson.
Aucune affiliation avec l'auteur ni ses ayants droit. Les noms et lieux du roman sont utilisés à
ce titre. Registre PEGI 18 / M.

Polices : [Jersey 10](https://fonts.google.com/specimen/Jersey+10) et
[Silkscreen](https://fonts.google.com/specimen/Silkscreen), sous licence SIL Open Font License.
