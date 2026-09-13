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
- Les fichiers `.ink` sont écrits **sans accents** (le compilateur les accepte, mais on évite
  les soucis d'encodage dans la chaîne d'outils). Les accents sont réintroduits à l'affichage
  si besoin — décision à trancher au Lot D.

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
- **Palette verrouillée à 32 couleurs**, définie dans `src/styles.css` (`--n0`…`--w1`) et
  reprise à l'identique dans Aseprite. Ne pas introduire de couleur hors palette.
- Décors composés depuis des **tilesets 16×16** via des tilemaps JSON, jamais des images
  plein écran dessinées au pixel.
- Bascule d'accessibilité obligatoire pour glitch et scanlines (risque photosensible réel).

## Limites du contenu

Registre du roman : violence brève, clinique, sans complaisance. Drogues, prostitution, body
horror des implants, mort banalisée. **La noirceur vient de l'univers et du désespoir des
personnages, pas de la description graphique.** PEGI 18 / M.
