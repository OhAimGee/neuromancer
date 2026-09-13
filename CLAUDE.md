# NEUROMANCER

RPG narratif cyberpunk. Fan project **non-commercial** inspiré du roman de William Gibson (1984).
Le joueur incarne **Sable**, cowboy de console brûlé de Chiba City, revenu d'un flatline de
quatre-vingt-quatorze secondes avec un fragment inconnu dans le système nerveux.

Boucle de 60-90 min, horloge de 12 cycles, 8 fins, forte rejouabilité.

---

## Routage des modèles pour les sous-agents

| Modèle | Tâches |
|---|---|
| **Haiku** | Inventaires, lecture de doc, vérification de versions, exécution de scripts, variantes d'assets déjà spécifiées |
| **Sonnet** | Implémentation à partir d'une spec claire, composants React, parsers, outillage, tests, refactors, production pixel art via le MCP Aseprite |
| **Opus** | Design narratif, écriture des dialogues, équilibrage, arbitrages d'architecture, revue de cohérence |

**Règle** : un agent ne reçoit Opus que si la tâche exige un *jugement créatif ou un arbitrage*.
Écrire du code à partir d'une spec claire n'en est pas un.

---

## Règles de projet

- **Tout le contenu narratif est en français**, dans `content/ink/`. Zéro chaîne de texte jouée en dur dans le code.
- Aucun nombre d'équilibrage codé en dur : tout vit dans `data/*.json`.
- Pas de commentaires de code sauf si le *pourquoi* est non évident.
- Anglicismes cyberpunk conservés : deck, glace/ICE, matrice, cowboy, flatline, simstim.
- `npm run validate:narrative` doit passer avant tout commit touchant à `content/`.
- Les fichiers `.ink` sont écrits en **français typographique complet** : accents et majuscules
  accentuées. Vérifié sur inkjs 2.4.0 — l'UTF-8 traverse le compilateur, les choix et les tags
  sans altération.
- **Dialogue au tiret cadratin `—`, jamais de guillemets `« »`** : Jersey 10 rend `«` et `»`
  sous la forme de doubles chevrons `<<` `>>`. Le tiret cadratin est à la fois la convention
  française correcte et le seul rendu propre en pixel. Les répliques du joueur s'écrivent **sans
  tiret** dans le `.ink` — le même texte sert d'étiquette de bouton, où le tiret n'aurait pas de
  sens ; c'est la règle CSS `.dlg__ligne--replique::before` qui l'ajoute à l'affichage.

---

## PIÈGE INK CRITIQUE — forme des choix

**Un choix Ink ne doit JAMAIS contenir de crochets.** Vérifié sur inkjs 2.4.0 : dès qu'un choix
contient `[` — y compris une paire vide `[]` — `choice.tags` revient **vide**, et toutes les
étiquettes et tous les coûts sont perdus côté moteur.

```ink
// CORRECT — tags preserves
* "Rien. J'attends rien." # etq:MENSONGE # cout_humanite:5

// CASSE — choice.tags == []
* ["Rien. J'attends rien."] # etq:MENSONGE
* "Rien"[] # etq:MENSONGE
```

Conséquence assumée : **le texte du choix est toujours réaffiché en sortie**. C'est le
comportement voulu — c'est la réplique prononcée par Sable. Ne jamais redupliquer la réplique
à la main sous le choix.

### Tags reconnus

| Tag | Porté par | Rôle |
|---|---|---|
| `# etq:MENSONGE\|MENACE\|CONNAISSANCE\|FRAGMENT\|IMPLANT\|ACTION` | choix | Étiquette affichée au joueur |
| `# cout_credits:N` `# cout_cycles:N` `# cout_humanite:N` | choix | Coût, filtré côté UI |
| `# bg:<id>` `# musique:<id>` `# sfx:<id>` | ligne | Pilotage audiovisuel |
| `# speaker:<id>` `# portrait:<id>:<expression>` | ligne | Portrait et locuteur |
| `# ending:<id>` `# hub` | knot | Lu par le validateur narratif |

---

## Commandes

```bash
npm run dev               # compile Ink en watch + serveur Vite
npm run ink:build         # compile content/ink -> public/content/main.ink.json
npm run validate:narrative
npm run typecheck
npm test

# Verification visuelle autonome (serveur de dev requis)
node tools/screenshot.mjs capture.png
```

### Outillage — capture d'écran

`tools/screenshot.mjs` ouvre le jeu dans Chromium, capture l'écran et **remonte les erreurs
console** (code de sortie non nul s'il y en a). C'est le moyen de vérifier une modification
d'interface sans intervention manuelle.

Cette machine (Ubuntu 24.04 sous WSL) n'a pas `libasound2` et `sudo` demande un mot de passe.
Le paquet a été extrait dans le répertoire personnel, sans toucher au système :

```bash
mkdir -p ~/.local/playwright-libs && cd ~/.local/playwright-libs
apt-get download libasound2t64
dpkg -x libasound2t64_*.deb extracted
```

`tools/screenshot.mjs` ajoute ce chemin à `LD_LIBRARY_PATH` tout seul s'il le trouve.

---

## Architecture

- **Vite + TypeScript + React 19** — DOM pour dialogues, HUD, menus
- **PixiJS v8** — canvas unique pour scènes, cyberespace, filtres CRT/glitch. **Piloté en
  impératif via une ref, jamais par `@pixi/react`.** React ne re-render jamais le canvas ;
  la communication passe par `store.subscribe`.
- **inkjs** — moteur narratif. Le compilateur JS pur d'inkjs est utilisé ; **ne pas introduire
  le paquet `inklecate`**, qui enveloppe un binaire .NET et imposerait mono en CI.
- **Zustand** — trois stores séparés par cycle de vie : `runStore` (jetable), `profileStore`
  (persistant : les connaissances débloquées à vie), `uiStore` (éphémère, jamais persisté).

### Pièges connus

- Le JSON Ink compilé se charge par `fetch()` depuis `public/`, **jamais par un `import`
  statique** — sinon il gonfle le bundle initial.
- Les filtres CRT/glitch doivent s'appliquer sur une `RenderTexture` **en 320×180**, puis être
  agrandis. Les appliquer sur le stage plein écran les exécute en résolution écran, sur des
  pixels déjà agrandis, et adoucit le pixel art malgré `nearest`.
- `profileStore.knowledge` est un `Set` : `JSON.stringify` ne sait pas le sérialiser. Voir le
  `replacer`/`reviver` dans `src/save/`.
- Le projet vit sur `/mnt/c` (disque Windows monté dans WSL) : inotify n'y est pas fiable,
  d'où `usePolling` dans `vite.config.ts` et dans la surveillance Ink.

---

## Direction artistique

- Résolution interne **320×180**, mise à l'échelle **entière** uniquement (×4, ×6) + letterbox.

### Texte pixel — pourquoi pas de `transform: scale()`

La couche DOM n'est **jamais** mise à l'échelle par `transform`. Le navigateur re-rastériserait
le texte à la résolution finale et le rendrait lisse, ruinant l'aspect pixel. À la place,
React pose `--s` (l'échelle entière) sur `.viewport`, et **toute** dimension s'exprime en
multiples de `--px` (`calc(10 * var(--px))`). Le canvas Pixi, lui, rend bien en 320×180 et se
laisse agrandir par le navigateur en `image-rendering: pixelated`.

Deux polices, chacune sur sa grille — sortir de ces multiples fait baver les glyphes :

| Police | Rôle | Grille | Tailles valides |
|---|---|---|---|
| **Jersey 10** | Prose, dialogues, choix | 10 px | `calc(10 * var(--px))`, `calc(20 * var(--px))`… |
| **Silkscreen** | HUD, étiquettes, terminaux | 8 px | `calc(8 * var(--px))`, `calc(16 * var(--px))`… |

`-webkit-font-smoothing: none` et `font-smooth: never` sont obligatoires sur `body`.

**Chaque police charge ses DEUX sous-ensembles** (`latin-400.css` et `latin-ext-400.css`) :
`latin-ext` ne contient que le complément accentué. Sans `latin`, certaines lettres de base
retombent silencieusement sur une police système — le défaut est discret mais très visible sur
le « A ».
- **Palette verrouillée à 32 couleurs**, définie dans `src/styles.css` (`--n0`…`--w1`) et
  reprise à l'identique dans Aseprite. Ne pas introduire de couleur hors palette.
- Décors composés depuis des **tilesets 16×16** via des tilemaps JSON, jamais des images
  plein écran dessinées au pixel.
- Bascule d'accessibilité obligatoire pour glitch et scanlines (risque photosensible réel).

### Pipeline d'assets — MCP Aseprite

Le serveur `pixel-mcp` expose **50 outils** (vérifié par sonde stdio, pas par la doc, qui en
documente 26). Il n'expose **pas** de scripting Lua, mais il expose bien plus que du dessin :

- **Dessin** : `draw_pixels` (par lot, `{x,y,color}` en `#RRGGBBAA`), `draw_line`,
  `draw_rectangle`, `draw_circle`, `draw_contour`, `fill_area`, `draw_with_dither`
- **Import/export** : `import_image`, `get_pixels`, `export_sprite`, `export_spritesheet`,
  `save_as`, `downsample_image`
- **Sélection** : `select_rectangle`, `select_ellipse`, `copy_selection`, `paste_clipboard`,
  `move_selection` — permet de composer des tuiles sans les redessiner
- **Transformation** : `scale_sprite`, `resize_canvas`, `crop_sprite`, `flip_sprite`,
  `rotate_sprite`
- **Palette** : `set_palette`, `set_palette_color`, `add_palette_color`, `sort_palette`,
  `quantize_palette`, `analyze_palette_harmonies`
- **Assistance** : `apply_shading`, `apply_auto_shading`, `apply_outline`,
  `suggest_antialiasing`, `analyze_reference`
- **Animation** : `add_frame`, `duplicate_frame`, `set_frame_duration`, `create_tag`, `link_cel`

**Conséquence sur la méthode** : `import_image` ouvre une voie bien plus rapide que le dessin
pixel par pixel pour les assets denses — générer le PNG par programme, puis l'importer. Réserver
`draw_pixels` aux retouches et aux petits éléments. Pour les décors, produire des tuiles puis
composer par tilemap reste la règle.

**Si les outils `mcp__aseprite__*` sont absents** : le serveur avait échoué à se connecter au
démarrage d'une session parce que `~/.config/pixel-mcp/config.json` n'existait pas encore, et
l'échec est mis en cache. Le binaire fonctionne (sonde stdio concluante) ; il suffit de
reconnecter via `/mcp`.

### PIÈGE ASEPRITE CRITIQUE — jamais l'exécutable Windows

**L'Aseprite de Windows ne peut pas servir depuis WSL.** Il accepte les chemins POSIX, ne crée
aucun fichier, et **sort avec le code 0** — échec parfaitement silencieux. Le serveur MCP
remontait seulement `exit status 255`.

La chaîne de production utilise donc l'**AppImage Linux extraite** (WSL n'a pas FUSE) :

```bash
mkdir -p ~/.local/aseprite && cd ~/.local/aseprite
cp /mnt/c/Users/rapha/Desktop/Aseprite_1.3.18.5-x64.AppImage ./aseprite.AppImage
chmod +x ./aseprite.AppImage && ./aseprite.AppImage --appimage-extract
# binaire : ~/.local/aseprite/squashfs-root/usr/bin/aseprite
```

`~/.config/pixel-mcp/config.json` doit pointer vers ce binaire Linux.

### Production d'assets — script Lua, pas appels MCP

Le binaire Linux donne accès à **l'API Lua complète d'Aseprite**, que le serveur MCP n'expose
pas. Pour un tileset entier, un script avec des boucles et des fonctions vaut infiniment mieux
que cinquante appels MCP discrets. Les outils MCP restent utiles pour une retouche isolée.

```bash
tools/aseprite.sh tools/aseprite/ts_interior.lua
```

- `tools/aseprite/palette.lua` — les 32 couleurs, une clé d'un caractère chacune
- `tools/aseprite/lib.lua` — art ASCII, matière procédurale, enregistrement
- `tools/aseprite/<nom>.lua` — un générateur par asset

Chaque générateur produit `.aseprite` (éditable à la main), `.png` et un `.json` de manifeste.
**Les générateurs doivent être déterministes** : toute matière procédurale passe par
`L.rng(graine)` et des listes ordonnées, jamais `pairs()`, dont l'ordre n'est pas garanti en
Lua. Vérification : deux exécutions successives donnent le même MD5.

L'ordre des tuiles dans un générateur fait foi — les tilemaps s'y réfèrent par index. Ajouter
en fin de liste, ne jamais réordonner.

Aperçu agrandi pour inspection :
```bash
~/.local/aseprite/squashfs-root/usr/bin/aseprite --batch assets/tilesets/ts_interior.png \
  --scale 8 --save-as /tmp/apercu.png
```

## Limites du contenu

Registre du roman : violence brève, clinique, sans complaisance. Drogues, prostitution, body
horror des implants, mort banalisée. **La noirceur vient de l'univers et du désespoir des
personnages, pas de la description graphique.** PEGI 18 / M.
