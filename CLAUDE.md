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
- `npm run validate:narrative` doit passer avant tout commit touchant à `content/`. Il fait une
  passe **statique** sur les sources `.ink` (crochets dans un choix, tags inconnus, étiquettes
  invalides, `EXTERNAL` déclaré mais non lié dans `moteur.ts`, **coût affiché qui ne correspond
  pas à l'arithmétique Ink du corps du choix** — l'interface mentirait au joueur sans jamais
  planter — et **réplique de plus de 180 signes**, que la boîte de dialogue ne saurait pas
  afficher), puis une passe **dynamique en deux temps** :
  **(a)** 500 parties à choix aléatoires, conditions tirées au sort, pour les plantages
  d'exécution ; **(b)** un rattrapage **toutes portes ouvertes** (`knows` vrai, `crew_present`
  vrai, `parties()` à 5) pour chaque fin que (a) n'a pas atteinte.
  **Le hasard du fuzzing est ensemencé** (`--graine=N` pour en essayer un autre). Il ne l'était
  pas, et le validateur passait au vert une fois sur trois sans qu'une ligne du récit ait bougé :
  un contrôle intermittent n'apprend qu'à relancer jusqu'à ce que ça passe.
  Le rattrapage n'est pas un confort. Un marcheur uniforme n'atteignait l'acte III que 10 fois
  sur 500 — il faut y enchaîner quatre bons choix parmi cinq à sept — et déclarait donc
  inatteignables trois fins qui étaient seulement improbables : le faux positif qui apprend à
  ignorer un validateur. Le marcheur préfère désormais les choix qu'il a le moins pris, et ce
  qu'il ne trouve toujours pas est rejoué sans condition. **« Jamais atteinte » veut de nouveau
  dire « inatteignable ».** Tous les contrôles ont été vérifiés contre des fautes introduites
  volontairement.
- Le validateur refuse aussi la **dette narrative** : une info pillable dans une BDD
  (`data/hacking.json`) qu'aucun `knows()` ne consulte est un butin mort. C'est précisément ce
  qui sépare le hacking d'un mini-jeu décoratif. C'était un avertissement tant que la tranche
  narrative n'était pas écrite ; c'est une **erreur** depuis le lot J. Ajouter une info à
  `data/hacking.json`, c'est s'engager à l'utiliser dans `content/ink`.
- La passe dynamique **rejoue la boucle entière, plongées comprises** : le harnais honore
  `plonger()`, reprend au knot de retour annoncé, décompte des cycles, et simule parfois un
  flatline. Sans cela une partie s'arrêterait au premier branchement, et « aucune fin n'est
  inatteignable » ne voudrait rien dire. Ce harnais double volontairement le moteur ; quand la
  boucle change dans `moteur.ts`, il change aussi.
- Les fichiers `.ink` sont écrits en **français typographique complet** : accents et majuscules
  accentuées. Vérifié sur inkjs 2.4.0 — l'UTF-8 traverse le compilateur, les choix et les tags
  sans altération.
- **Dialogue au tiret cadratin `—`, jamais de guillemets `« »`** : Jersey 10 rend `«` et `»`
  sous la forme de doubles chevrons `<<` `>>`. Le tiret cadratin est à la fois la convention
  française correcte et le seul rendu propre en pixel. Les répliques du joueur s'écrivent **sans
  tiret** dans le `.ink` — le même texte sert d'étiquette de bouton, où le tiret n'aurait pas de
  sens. Une fois choisie, la réplique est rejouée dans la boîte au nom de Sable : le moteur
  reconnaît l'écho du choix et lui attribue le locuteur `sable` (voir `repliqueAttendue`).

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
| `# geste` | choix | **Le libellé est un geste, pas une parole** — son écho est joué en narration |
| `# cout_credits:N` `# cout_cycles:N` `# cout_humanite:N` | choix | Coût, filtré côté UI |
| `# bg:<id>` `# musique:<id>` `# sfx:<id>` | ligne | Pilotage audiovisuel |
| `# speaker:<id>` `# portrait:<id>:<expression>` | ligne | Portrait et locuteur |
| `# ending:<id>` | knot | **Termine la partie.** Lu par le moteur et par le validateur |
| `# glose:<id>` | ligne | Demande l'explication de règle `<id>` de `data/gloses.json` |
| `# hub` | knot | Lu par le validateur narratif |
| `# entracte:<texte libre>` | ligne | Carton plein écran bloquant — saut dans le temps |
| `# horloge:demarrer` | ligne | Lance le compte à rebours de toxine. **Éphémère**, comme `sfx` |

Deux valeurs de `# bg:` ne désignent pas une tilemap : **`aucun`** vide le décor (sans lui, une
scène sans tag hériterait du décor précédent, faute de pouvoir l'effacer) et **`matrice`**
construit le fond du cyberespace en géométrie — une perspective n'est pas un assemblage de
tuiles.

Le vocabulaire ci-dessus fait foi : `npm run validate:narrative` rejette tout autre tag. Ink
accepte n'importe quelle étiquette et le moteur ignore celles qu'il ne connaît pas — une faute
de frappe comme `# etiq:` ne se verrait donc jamais à l'exécution. Ajouter un tag au jeu, c'est
l'ajouter aux trois endroits : ce tableau, `TAGS_CONNUS` dans le validateur, et `tags.ts`.

---

## La voix de Sable — un libellé de choix EST une réplique

C'est la conséquence directe du piège ci-dessus : le texte d'un choix est toujours réaffiché,
donc **on ne peut pas écrire un bouton et une réplique séparément**. Ce qu'on écrit dans le
`.ink` est ce que Sable prononce. Les libellés de la première version étaient rédigés en langue
de menu — « Acheter un MIMIC. Huit cents. », « Faire poser quelque chose. », « Parler d'un mort
qui se souvient. » — et Sable parlait donc comme un menu, dans sa propre plaque nominative.

Un libellé s'écrit comme une réplique : sec, coupé, jamais poli, avec la syntaxe du personnage.

```ink
// AVANT — langue de bouton
+ { credits >= 800 } Acheter un MIMIC. Huit cents. # cout_credits:800
// APRÈS — Sable parle
+ { credits >= 800 } Ton MIMIC. Huit cents, et je ne discute pas. # cout_credits:800
```

**Tout n'est pas une parole**, et c'est à quoi sert `# geste`. « Dormir. », « Raccrocher. »,
« Laisser tomber. » sont des actions muettes : le tag les fait rendre en narration — pas de
locuteur, pas de portrait, cadre terne (`echoMuet` dans `moteur.ts`). Sans lui, Sable annonçait
ses propres gestes à voix haute dans une pièce vide.

- **`# geste` ne se déduit pas de `# etq:ACTION`.** Les deux axes sont indépendants et les quatre
  croisements existent : « Laisser la chose répondre à ma place » est un `FRAGMENT` muet,
  « Promis. Tu seras effacé. » est une `ACTION` parlée. Les confondre, c'était la première
  version, et elle se trompait dans les deux sens.
- **Le second temps.** Là où la réplique mérite d'être développée, le corps du choix ajoute une
  *seconde* réplique sous `# speaker:sable` — le libellé ouvre, le corps donne le caractère. Ce
  n'est pas la duplication interdite (qui redit le même texte) ; le validateur refuse d'ailleurs
  deux répliques identiques d'affilée. À réserver aux moments qui comptent : en mettre partout
  ajouterait un clic à chaque menu.
- Le validateur avertit sur un libellé qui **commence par un infinitif sans porter `# geste`**.
  Une question n'est jamais un geste (« Participer à quoi ? »), et le verbe doit être suivi d'une
  espace ou d'un point — sans ce regard en avant, « Quatre-vingt-quatorze » et « Montre-moi »
  passaient pour des infinitifs. Un avertissement qui crie à tort n'apprend qu'à être ignoré.

---

## Commandes

```bash
npm run dev               # compile Ink en watch + serveur Vite
npm run ink:build         # compile content/ink -> public/content/main.ink.json
npm run validate:narrative
npm run validate:assets    # tilemaps vs manifestes de tilesets
npm run typecheck
npm test

# Verification visuelle autonome (serveur de dev requis)
node tools/screenshot.mjs capture.png
node tools/jouer.mjs captures hasard  # joue une partie ENTIERE jusqu'a une fin
node tools/acte3.mjs captures      # joue l'acte III jusqu'a une fin
node tools/plonger.mjs captures    # prologue + branchement + plongee au hasard
node tools/vitrine.mjs             # refait les captures du README
node tools/clavier.mjs             # joue le prologue SANS UN SEUL CLIC
node tools/pluie.mjs               # releve la pluie trame par trame
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

## La mise en scene — ce qui colle et ce qui ne colle pas

Les tags ne sont poses qu'a la premiere ligne d'un knot, donc `moteur.consommer()` conserve la
mise en scene d'une replique a la suivante. Tout ne doit pas survivre a cette conservation :

| Cle | Duree |
|---|---|
| `locuteur` `decor` `musique` `fin` | **collante** — elle decrit la scene |
| `portrait` `expression` | collante, mais **annulee des qu'un nouveau `# speaker:` arrive** |
| `sfx` `entracte` `glose` `horloge` | **une replique, pas une de plus** |

Les deux exceptions ont ete des bugs reels, muets, et longs a voir :

- le `# portrait:port_molly` du prologue restait colle jusqu'a la fin de la partie. La boite
  affichait la plaque MAELCUM et le visage de Molly ; aucune erreur nulle part. **Un portrait
  appartient a qui parle, pas a la scene.** `ligne.portrait` est une *derogation* : le portrait
  par defaut vient de `data/personnages.json` et se resout dans `Boite.tsx`.
- le `# sfx:jack_in` de la cabine se rejouait sur toutes les repliques suivantes, parce que
  `Dialogue.tsx` declenche l'effet a chaque changement de `ligne`.

Les deux sont couverts par `tests/unit/moteur.test.ts`, et les deux tests ont ete verifies en
reintroduisant la faute. Attention au parcours : un test qui deroule le recit depuis le hub ne
voit jamais la faute du portrait, faute d'avoir joue le prologue qui la pose.

## Les scenes en tunnel — un candidat, plusieurs lieux, une paire

Un recrutement est un TUNNEL (`-> riviera ->`, termine par `->->`) : il rend la main la ou on
l'a appele, donc la scene n'a pas a savoir dans quel lieu elle se joue, et le meme candidat peut
se presenter ailleurs sans qu'on touche a son texte.

**Tous les choix d'une scene reentrante doivent etre COLLES (`+`).** Un choix a usage unique
(`*`) disparait apres avoir ete pris ; une scene reentrante dont tous les choix sont epuises n'a
plus aucun contenu, Ink sort du knot et remonte jusqu'a la fin du fichier. Cela se lit
« unexpectedly reached end of content. Do you need a '->->'? » et plantait 127 parties sur 500
au fuzzing.

Les places d'equipage sont comptees par le jeu (`places_libres()`), jamais par une variable Ink :
le magasin d'equipage est l'etat de la partie.

`scenes/frictions.ink` applique le meme motif aux PAIRES d'equipiers. Six candidats pour trois
places font vingt equipes : une scene par paire couvre beaucoup plus de terrain qu'une scene par
personne, et c'est l'astuce economique du design. Une seule friction par partie
(`friction_jouee`) — deux disputes d'affilee feraient une sitcom. Un outil qui joue au hasard ne
recrute personne, donc ces scenes ne sont vues que par les tests unitaires : ils recrutent la
paire dans `runStore` puis `reprendre('freeside')`.

---

## Les implants — ce qui relie le pillage au reste du jeu

Un plan vole est un butin mort tant qu'aucun atelier ne sait le monter. La chaine complete tient
en quatre maillons, et il suffit qu'un seul lache pour que le hacking redevienne decoratif :

| Maillon | Ou |
|---|---|
| Le plan se pille | `data/hacking.json` → `plans`, tire par le butin des BDD |
| Le comptoir le voit | `data/boutique.json` → rayon `atelier`, resolu par `src/boutique/catalogue.ts` |
| L'achat l'ecrit | `runStore.acheter('implants', id, cout)` |
| L'effet s'applique | `data/implants.json` → `src/hacking/implants.ts`, lu par `demarrer()` |

- **Les effets sont figes au branchement**, comme la competence : `demarrer()` est le seul endroit
  qui lit les implants. `traceMax`, `cyclesParTicks` et `filtres` vivent donc dans `EtatSession`
  et non dans `data/hacking.json` — un implant les deplace. Relire `donnees.trace.max` dans
  `tracer()` annulerait silencieusement les reflexes neuraux ; un test le verrouille.
- **Le prix d'un implant vit dans `data/implants.json`, et nulle part ailleurs.** Le catalogue de
  la boutique ne le recopie pas — le validateur refuse un `prix` sur un article d'atelier. Trois
  monnaies recopiees dans deux fichiers sont la facon la plus sure de les voir diverger, et le
  joueur paierait alors un prix que l'equilibrage ignore.
- **Un plan reste au dossier apres la pose** : c'est de l'information volee, pas une piece
  consommee. C'est `has_implant()` qui empeche de poser deux fois, et la fiche de partie filtre
  les plans deja montes pour ne pas afficher le meme objet dans deux sections.
- **L'etiquette `[IMPLANT]` decrit une porte que seul un implant DEJA pose ouvre**
  (`data/gloses.json`). Elle n'a rien a faire sur un choix d'achat — la mettre la etait la
  premiere version, et elle contredisait la glose que le jeu affiche au joueur.
- `npm run validate:narrative` refuse un plan pillable qu'aucun article d'atelier ne monte, un
  implant de `data/implants.json` que nul comptoir ne vend, un article dont l'identifiant n'existe
  nulle part, un script sans prix, un prix recopie sur un implant, et un marchand qu'aucun
  `ouvrir_boutique()` n'ouvre. Les six controles ont ete verifies contre des fautes introduites
  volontairement.
- **Sonde de developpement `window.__runStore`** (comme `window.__noeudsVisibles`) : l'etat de
  partie est jetable et ne passe pas par `localStorage` au demarrage, donc un outil de
  verification n'a aucun autre moyen de poser un butin avant d'ouvrir l'atelier. `vitrine.mjs`
  s'en sert pour la capture de la fiche, et remet les listes a vide aussitot apres. Retiree du
  build.

---

## Le comptoir — quand le recit cede la transaction

`data/boutique.json` + `src/boutique/catalogue.ts` + `src/react/Boutique.tsx`. Le recit l'ouvre
par `~ ouvrir_boutique("finn", "finn.retour_comptoir")` puis `-> DONE`, et le jeu rend la main par
`moteur.fermerBoutique()`. **C'est exactement `plonger()` / `terminerPlongee()`**, et les deux
partagent la meme structure `Passage` dans `moteur.ts` : un seul endroit ou se tromper de knot de
retour.

Pourquoi un ecran et pas des choix Ink : **un libelle de choix EST la replique de Sable**, piege
des crochets oblige. Un comptoir ecrit en Ink obligeait donc a ecrire « Acheter un MIMIC. Huit
cents. » — une phrase que Sable prononce ensuite a voix haute. Comparer trois prix, lire un effet
chiffre et voir ce qui manque sont des gestes d'inventaire, pas des repliques.

**La frontiere : le recit garde les SCENES, le comptoir prend les TRANSACTIONS.** Le testament de
3Jane, l'antidote, le recrutement du Finn et la ROM du Dixie restent dans `finn.ink` — ce sont des
scenes, avec un avant et un apres. L'achat d'un script n'en est pas une.

- **Un article hors de portee reste affiche, lisible et visable au clavier**, avec la raison
  (`Le Finn n'a pas le plan. Vole-le.`). Le masquer priverait le pillage de son objectif nomme :
  c'est ici qu'un joueur apprend quels plans existent.
- **La fiche est SOUS la liste et non a cote.** En deux colonnes, la colonne des noms tombait a
  neuf caracteres sur une fenetre de 320 : `BANDE PASSANTE` s'affichait « BANDE PASS... ».
- La liste defile — six implants ne tiennent pas dans 180 pixels — donc le curseur clavier
  entraine le defilement (`scrollIntoView`), et un compteur `↕ 3/6` dit que la liste continue.
- Le Finn commente l'article visé : sa phrase d'accueil ne sert plus que quand rien n'est choisi.

### `Echap` : une touche, un seul ecouteur

Le comptoir a rendu visible une faute qui dormait depuis le lot du clavier. `App` posait son
propre `keydown` des que la partie etait a l'ecran (`Echap` → options, `Tab` → fiche) : cela a
tenu tant qu'aucun ecran du dessous ne reclamait ces deux touches. Le comptoir reclame `Echap`
pour se fermer — et `Echap` le fermait **et** ouvrait les options par-dessus.

`App` n'ecoute donc plus rien pendant la partie. `Echap` et `Tab` passent par `toucheGlobale()`,
appelee depuis le `surTouche` de l'ecran actif — `Dialogue`, `Cyberespace`, `Boutique` — et un
seul ecran est actif a la fois. Le comptoir ne passe volontairement pas `onOptions` : son `Echap`
lui appartient. `node tools/clavier.mjs` verifie precisement cela — apres l'`Echap` qui ferme le
comptoir, il exige qu'aucun `.opt` ne soit ouvert.

---

## Les archives — ce que le joueur emporte d'une partie a l'autre

`src/react/Archives.tsx`, ouvert depuis l'ecran-titre et depuis la fiche de partie. Trois onglets,
un compteur chacun : **CE QUE TU SAIS** (`data/infos.json`), **CARNET**
(`data/personnages.json` → `carnet`), **FINS** (`data/fins.json`).

L'ecran existe parce que la fiche de partie affichait `id.replace(/_/g, ' ')` pour les infos
volees — donc « dossier medical armitage ». Le butin le plus important du jeu, celui qui ouvre les
fins, se lisait comme une table de base de donnees.

- **Ce qu'on ne sait pas encore figure en SILHOUETTE, a la bonne longueur, et sa `source` reste
  lisible.** C'est la difference entre une case vide et un objectif : le joueur voit combien il en
  reste et ou aller chercher. C'est le moteur de rejouabilite rendu visible, et c'est la seule
  raison d'etre de cet ecran.
- **`ouvre` est le champ qui transforme une liste d'identifiants en butin** : il dit ce que l'info
  a rendu possible dans le recit. Il doit correspondre a un vrai `knows()` de `content/ink`.
- `npm run validate:narrative` refuse une info pillable sans entree, une entree dont un des quatre
  champs est vide, et une entree qui decrit une info pillable nulle part. Les trois controles ont
  ete verifies contre des fautes introduites volontairement.
- **Le carnet se remplit tout seul** : `moteur.publier()` appelle `profileStore.rencontrer()` sur
  le locuteur de la replique **affichee**. Dans `consommer()`, ce serait sur la replique d'avance —
  un personnage entrerait au carnet avant que sa replique n'apparaisse. Un personnage sans
  portrait n'y figure pas : c'est une voix, pas une rencontre.
- **Le sous-titre d'une fin inconnue n'est pas mis en silhouette.** Il est en Jersey 10, dont le
  bloc plein n'a pas la chasse des autres glyphes : la barre se brisait en morceaux de hauteurs
  differentes et se lisait comme un bug. Elle affiche « Jamais atteinte. »
- **Sonde `window.__profileStore`**, comme `__runStore` : les archives se remplissent sur
  plusieurs parties, et un outil qui devrait terminer le jeu trois fois avant de prendre une image
  ne serait pas un outil. Retiree du build.

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

### `src/hacking/` — le cyberespace

Aucune classe, aucun état mutable : `session.ts` est une suite de **fonctions pures** qui rendent
un nouvel `EtatSession`. C'est ce qui permet de fuzzer des milliers de plongées en test, et
d'annuler une action sans machinerie.

- `alea.ts` — générateur ensemencé par une chaîne. **Une même graine rend toujours le même
  réseau** : la topologie est régénérée à chaque partie, mais reste reproductible, donc testable
  et déboguable.
- `graphe.ts` — le réseau est un **arbre plus quelques raccourcis latéraux**. L'arbre est
  délibéré : une glace n'est un mur que si elle est le seul passage vers ce qu'elle protège. Les
  raccourcis rendent parfois un contournement possible — c'est là le jeu.
- `session.ts` — déplacement, scripts, pillage, trace, riposte.
- `Noeud.franchi` couvre trois états selon le type : glace percée, BDD vidée, leurre déclenché.
  Aucun n'est vrai à la génération.
- **Le moteur n'émet aucune chaîne jouée** : le journal porte des codes, et la formulation vit
  dans `data/journal.json`. Un test de fuzzing vérifie que tout code émis a une formulation —
  y compris ceux construits par concaténation (`butin_credits`, `butin_infos`…).
- Les nombres vivent dans `data/hacking.json`, jamais dans le code. `data/equilibrage.json` ne
  garde que les paliers de dialogue et l'état de départ d'une partie.

### Pièges connus

- Le JSON Ink compilé se charge par `fetch()` depuis `public/`, **jamais par un `import`
  statique** — sinon il gonfle le bundle initial.
- L'`Application` Pixi est initialisée en **320×180 avec `resolution: 1`** ; c'est le navigateur
  qui agrandit le canvas en `image-rendering: pixelated`. Un filtre CRT/glitch posé sur le stage
  s'exécute donc déjà sur 320×180 pixels. Ne jamais passer l'`Application` en taille écran : les
  filtres tourneraient alors sur des pixels déjà agrandis et adouciraient le pixel art malgré
  `nearest`.
- `scaleMode = 'nearest'` est posé sur la `source` de chaque planche au chargement
  (`src/engine/tileset.ts`). Une texture chargée ailleurs sans ce réglage sera interpolée.
- `pixi.js@8.20` livre un `.d.ts` qui ne passe pas en `strict` — d'où `skipLibCheck` dans
  `tsconfig.json`. Rien à corriger côté projet.
- **Un `stroke` de 1 px avec `antialias: false` disparaît dès que le segment est oblique.**
  Vérifié à l'écran : seuls les liens horizontaux du graphe s'affichaient, les diagonales étaient
  purement absentes — aucune erreur, aucun avertissement. Les traits se posent donc pixel par
  pixel (Bresenham + `rect(x, y, 1, 1)` puis un seul `fill`), voir `segment()` dans
  `src/hacking/rendu.ts`. C'est de toute façon la bonne réponse en pixel art.
- `Tileset.charger(nom, sousDossier)` : le second argument doit être celui passé à
  `L.enregistrer` côté Lua (`tilesets`, `sprites`…). L'oublier donne un 404 déguisé en
  « source image could not be decoded ».
- En développement, le rendu du cyberespace publie `window.__noeudsVisibles` : les nœuds vivent
  sur un canvas, que Playwright ne sait pas interroger autrement. Sonde retirée du build.
- `profileStore.knowledge` est un `Set` : `JSON.stringify` ne sait pas le sérialiser. Voir le
  `replacer`/`reviver` dans `src/save/`.
- Le projet vit sur `/mnt/c` (disque Windows monté dans WSL) : inotify n'y est pas fiable,
  d'où `usePolling` dans `vite.config.ts` et dans la surveillance Ink.
- **`MoteurDialogue.demarrer()` doit rester idempotent.** React 19 monte deux fois les effets en
  mode strict ; le second appel remettait `lignes` à vide alors que l'histoire était déjà arrivée
  au premier choix. Résultat : *tout le récit disparaissait de l'écran*, sans la moindre erreur —
  seuls les boutons de choix restaient. Couvert par `tests/unit/moteur.test.ts`.
- **`SceneJeu` doit retenir un décor demandé avant son montage.** `monter()` est asynchrone et
  React réclame le décor aussitôt ; la demande était perdue, et comme `decorActuel` avait déjà
  été noté, aucune demande identique ne repassait. D'où `decorEnAttente`.
- **`chokidar@4` a retiré la prise en charge des globs.** `chokidar.watch('content/ink/**/*.ink')`
  ne surveillait donc rien, sans la moindre erreur : on modifiait un `.ink`, le navigateur gardait
  l'ancien récit, et on cherchait la faute dans le moteur. On surveille le **dossier**, et on
  filtre l'extension dans le gestionnaire.

---

## La boucle de partie — c'est le récit qui pilote

Il n'y a **aucun bouton câblé en dur vers le cyberespace**, et aucune fin décidée par le code.
Le jeu rend la main au récit, et le récit rend la main au jeu :

| Sens | Mécanisme |
|---|---|
| Récit → jeu | `~ plonger("<point_acces>", "<knot_de_retour>")` puis `-> DONE` |
| Jeu → récit | `moteur.terminerPlongee(flatline)`, qui reprend au knot annoncé |
| Récit → fin | `# ending:<id>` sur un knot |

`MoteurDialogue.reprendre(knot)` est la pièce qui rend la structure en hub possible : chaque
scène finit par `-> DONE`, et le jeu redonne la main là où le récit l'a dit. Les deux seuls
chemins que le moteur emprunte de sa propre initiative sont nommés en tête de `moteur.ts` :
`fin_flatline_reseau` (on est mort dans la matrice, il ne reste personne pour choisir) et `hub`
(filet de sécurité si un `plonger()` n'a nommé aucun retour).

- **Le knot de retour doit être un chemin Ink complet.** `hub.retour` et non `retour` : un stitch
  n'est pas joignable par son nom seul, et `ChoosePathString` échoue à l'exécution — pas à la
  compilation.
- **L'horloge ne démarre pas avec la partie.** `# horloge:demarrer`, posé à la fin du prologue
  quand Molly annonce les sacs de toxine, lève `runStore.horlogeLancee` ; avant ce signal, ni le
  HUD ni la fiche n'affichent de cycles. L'ouverture est un flashback de trois ans plus tôt : y
  montrer une fiole pleine et douze cycles annonçait un compte à rebours qui n'avait pas
  commencé. Le tag vivait dans le contenu depuis plusieurs lots sans que rien ne le lise.
- **L'horloge est relue à chaque passage par `hub`.** C'est le seul endroit où la toxine tue ;
  ailleurs, `cycles_restants` descend sans conséquence immédiate.
- **`cycles_restants` est observé dans les deux sens.** Sans l'observateur ajouté au lot J, un
  choix annonçant `# cout_cycles:1` décrémentait la variable Ink et laissait l'horloge du jeu
  intacte : le compte à rebours ne descendait jamais hors des plongées.
- Une valeur qui vaut pour **une seule partie** est une `VAR` Ink (`antidote_en_poche`).
  `learn()` écrit dans le profil et survit à toutes les parties : ne jamais l'utiliser pour un
  objet qu'on ramasse.
- La plongée n'est exposée à l'interface qu'une fois le texte épuisé, pour la même raison que le
  chevron : la matrice ne doit pas s'ouvrir sous une réplique que le joueur n'a pas lue.

---

## La boîte de dialogue — modèle RPG au tour par tour

La scène reste visible : bandeau de HUD en haut, boîte en bas, décor entre les deux. **Une seule
réplique à la fois**, jamais un journal — un journal qui accumule tout depuis le début du jeu ne
ressemble à aucune conversation.

- Le moteur garde **une réplique d'avance** (`courant` / `suivant` dans `moteur.ts`). C'est la
  seule façon de savoir s'il reste quelque chose à lire, donc d'afficher le chevron `▼` à bon
  escient. Sans cette avance, `story.canContinue` restait vrai pour du contenu sans texte (tags
  seuls, fin de knot) : le chevron s'affichait, le joueur validait, et rien ne changeait à
  l'écran. Verrouillé par un test.
- Chaque réplique emporte **une copie de la mise en scène** valable à sa lecture. Sans cette
  copie, le `# bg:` ou le `# entracte:` de la réplique d'avance s'appliquerait à celle encore
  affichée, une pression trop tôt.
- Conséquence à connaître : les effets `~` du corps d'un choix se déclenchent **au fil de la
  lecture**, pas au clic. Un test qui vérifie un effet doit d'abord épuiser le texte (`epuiser`).
- **Parole ou narration se distinguent sans lire** : une parole porte une plaque nominative et un
  portrait, la narration n'en a pas et son cadre est terne. Le moteur déduit la parole du tiret
  cadratin initial (`LigneDialogue.dite`), conformément à la convention typographique du projet.
- `data/personnages.json` fait le lien `# speaker:<id>` → nom affiché + portrait. Un locuteur
  absent du fichier n'a pas de plaque : c'est le comportement voulu pour une voix anonyme.
- La boîte a une **hauteur fixe de quatre lignes**, parole comme narration. Une boîte qui se
  redimensionne fait sauter le décor d'une réplique à l'autre. Ces quatre lignes sont exactement
  ce que garantit la limite de 180 signes du validateur.
- `tools/jouer.mjs` et `tools/plonger.mjs` passent par `derouler()` (`tools/lib-jeu.mjs`), qui
  fait défiler la boîte avant de chercher des boutons. Un outil qui cherche directement
  `.dlg__bouton` ne trouve plus rien.
- `tools/acte3.mjs` pose un profil de joueur expérimenté dans `localStorage` puis suit un
  itinéraire décrit par des motifs sur les libellés de choix. Sans cela l'acte III reste hors
  d'atteinte d'un outil qui joue au hasard : il faut y enchaîner quatre bons choix parmi cinq
  à sept.
- `tools/vitrine.mjs` refait `docs/images/*.png`. **Les captures du README se reprennent avec cet
  outil, jamais à la main** — celles prises à la main vieillissent en silence, et la première
  version du README a montré pendant des semaines une boîte de dialogue plein écran qui
  n'existait plus.
- `node tools/jouer.mjs captures hasard` joue **une partie entière jusqu'à une fin**, plongées
  comprises, et sort en code non nul si aucune fin n'est atteinte. C'est la vérification qui
  prouve que la boucle se ferme. Son harnais de plongée pille dès qu'il le peut : une marche
  aléatoire ne rapporte presque jamais rien, et les fins qui dépendent d'une info volée
  resteraient hors d'atteinte.

### Machine à écrire

Le texte s'écrit caractère par caractère (`useMachineAEcrire`), au rythme de `uiStore.vitesseTexte`.
**La première pression finit la réplique, la seconde seulement passe à la suivante** — l'inverse
fait perdre des lignes à qui appuie vite. Les choix n'apparaissent qu'une fois la réplique
entièrement écrite.

Les outils de vérification ouvrent le jeu en `vitesseTexte: 0` (injecté dans `localStorage` par
`ouvrirJeu`) : ils vérifient le jeu, pas la vitesse de l'animation. `derouler()` sait tout de
même encaisser un clic qui ne fait que révéler.

---

## Le clavier — un seul écouteur à la fois

Le jeu se joue entièrement sans souris, de la première réplique à la fin. Tout passe par
`src/react/useNavigationClavier.ts`, et c'est une règle, pas une commodité.

| Touche | Dialogue | Comptoir | Fiche / options | Cyberespace |
|---|---|---|---|---|
| `↑` `↓` | choix précédent / suivant | article précédent / suivant | — | nœud voisin précédent / suivant |
| `←` `→` | — | changer de rayon | — | — |
| `Entrée` | valider le choix visé, sinon avancer la réplique | acheter | — | ALLER, ou encaisser le butin |
| `Espace` | avancer la réplique, fermer un entracte | — | — | — |
| `1`…`9` | prendre directement le n-ième choix | — | — | exécuter le n-ième script |
| `Tab` | fiche de partie | fiche de partie | — | fiche de partie |
| `Échap` | **ouvrir** les options | **sortir** du comptoir | **fermer** le panneau | ouvrir les options |
| `←` `→` (archives) | — | — | changer d'onglet | — |
| `A` | — | — | — | piller |
| `Ret. arr.` | — | — | — | se débrancher / encaisser |

- **Un seul écouteur `window` à la fois.** `App.tsx` calcule une `couche`
  (`titre` / `jeu` / `fiche` / `options`) et ne passe `actif` qu'à celle du dessus. Sans cette
  règle, `Entrée` validait un choix de dialogue **et** fermait la fiche posée par-dessus : deux
  écouteurs posés sur `window` reçoivent la même touche, et rien dans l'ordre du DOM ne dit lequel
  est au-dessus. C'est arrivé, et le symptôme (« la fiche se referme toute seule ») n'accuse
  jamais le bon fichier. **`App` n'écoute plus rien lui-même** : `Échap` et `Tab` passent par
  `toucheGlobale()`, appelée depuis le `surTouche` de l'écran actif — voir « Le comptoir ».
- **`Échap` ouvre, il ne bascule pas.** Un `Échap` qui bascule ferme la fiche *et* ouvre les
  options dans la même pression, parce que les deux écrans le voient. Les panneaux se ferment
  eux-mêmes, par leur propre `surFermer`.
- **Le pointeur et le clavier partagent le curseur.** `onPointerEnter` appelle `viser()` :
  survoler déplace le curseur clavier. Deux curseurs concurrents sont la faute classique de ce
  genre de refonte, et elle se voit tout de suite — on survole une ligne, on appuie sur `Entrée`,
  et c'est une autre qui est prise.
- **Aucun composant ne pose son propre `keydown` sur `window`.** Le cyberespace l'avait fait pour
  ses flèches, ce qui recréait exactement le conflit que le crochet existe pour empêcher ; ses
  touches passent maintenant par `surTouche`, le seul point d'extension prévu.
- `node tools/clavier.mjs` joue le prologue **uniquement avec `keyboard.press`**, vérifie sous ses
  yeux que `↓` déplace bien `.dlg__bouton--vise`, ouvre et referme la fiche puis les options, et
  sort en code non nul s'il n'atteint pas le hub. Un test unitaire sur le crochet dirait que les
  flèches déplacent un index ; il ne dirait pas qu'une palette de choix est atteignable au clavier.

---

## Audio

Le bus (`src/audio/bus.ts`, Howler) est monté dès le départ, mais **les fichiers sont
facultatifs** : le jeu tourne sans un seul son, et un fichier absent se signale une fois dans la
console au lieu de casser une scène. C'est ce qui permet d'écrire le jeu et de constituer la
banque sonore en parallèle.

- `data/audio.json` : identifiant → fichier, bus, boucle, volume. Aucun chemin en dur ailleurs.
- Le récit pilote le son par les tags `# musique:<id>` et `# sfx:<id>`, déjà dans le vocabulaire.
- **`npm run validate:narrative` refuse un `# musique:` ou un `# sfx:` absent de la table.**
  `matrice_froide` et `porte_pluie` y ont vécu plusieurs lots sans exister, et le silence n'était
  pas le pire : `musique()` coupe l'ambiance en cours **avant** de découvrir qu'il ne connaît pas
  la suivante. Une faute de frappe rendait donc la scène muette, pas seulement inchangée —
  l'ouverture jouait `# musique:nappe_matrice` puis `# musique:matrice_froide` sur la ligne
  suivante, et n'avait aucune musique.
- **Format obligatoire : OGG Vorbis.** Vérifié dans Chromium — un AIFF n'est ni décodable par
  Web Audio (`Unable to decode audio data`) ni lisible par `<audio>` (`MEDIA_ERR_SRC_NOT_SUPPORTED`),
  et `canPlayType('audio/aiff')` répond la chaîne vide. Un mauvais format est indiscernable d'un
  fichier absent : la même ligne de console, le même silence. La commande de conversion est dans
  `docs/audio.md`.
- **Howler boucle un son HTML5 par un `setTimeout` calculé au `play()`, pas sur l'événement
  `ended`** (`html5: true` est posé pour toutes les boucles). Conséquence pour qui teste :
  déplacer `currentTime` à la main depuis Playwright ne prouve rien — le minuteur de Howler reste
  calé sur l'heure d'origine, le média s'arrête à sa fin naturelle et la boucle a l'air cassée
  alors qu'elle ne l'est pas. Tester avec un fichier court **servi à la place** du vrai
  (`page.route`), et regarder `currentTime` repasser à zéro.
- `public/assets/audio/` est **ignoré par git** : ce sont des archives CC0 téléchargées par
  l'utilisateur. La liste de ce qu'il faut, et le registre recherché, vivent dans `docs/audio.md`.
- Les navigateurs refusent le son avant une interaction : le bus met l'ambiance demandée de côté
  et la joue au premier clic ou à la première touche.

---

## Accessibilité

Non négociable, et pas repoussé à la fin : cette esthétique présente un **risque photosensible
réel**. `Échap` ouvre les options en pleine partie, et le bouton ⚙ passe au-dessus de tout, carton
d'entracte compris — une bascule d'accessibilité ne doit jamais devenir inatteignable.

Scanlines et glitch se coupent séparément. Le glitch est volontairement lent et de faible
contraste : il se sent sur la boîte quand le fragment parle (`.boite--fragment`), il ne clignote
pas.

---

## Pédagogie — expliquer sans écran de tutoriel

Le postulat se pose **en le jouant** : `content/ink/scenes/ouverture.ink` est un flashback du
flatline. Il existe parce qu'un joueur ne connaît pas forcément le roman et doit savoir, avant le
Chatsubo, ce qu'est la matrice, ce qu'est un cowboy de console, pourquoi Sable n'en est plus un,
et ce qui est revenu avec lui. Tout est montré, rien n'est récité. La scène sert aussi de
tutoriel silencieux : les premières étiquettes apparaissent là, dans une scène dont l'issue est
déjà écrite.

Les règles s'expliquent **à la première rencontre**, une seule fois par profil :
`data/gloses.json` porte les formulations, `profileStore.glosesVues` retient ce qui a déjà été
montré. Une notion nouvelle dans une liste de choix (une étiquette, un coût) affiche sa glose
sous le bouton concerné. Rien à lire d'avance.

Ajouter une glose, c'est ajouter une entrée dans `data/gloses.json` sous la clé `etq:<NOM>`,
`cout:<jauge>` ou un identifiant libre déclenché à la main.

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

Ce qui n'est **pas** un asset, et volontairement : cadre de dialogue, boutons, jauges, curseur.
Ils sont en CSS, tiennent les grilles de 10 et de 8, se redimensionnent avec `--px`, et les
remplacer par du 9-slice ne gagnerait qu'un risque de régression. Les assets d'interface qui
existent (`ui.lua` : logo-titre, fiole de toxine, icônes de butin ; `items.lua` : scripts et
plans ; `fx.lua` : la pluie) existent parce qu'aucun CSS ne les ferait.

**Le voile de branchement (`.jack`) et le carton de glace noire (`.mort`) suivent la même
règle.** Le plan prévoyait `fx_jack_in` en planche de douze images plein écran : douze fois
57 600 pixels pour ce que deux dégradés animés rendent mieux, et la seule planche du jeu qui
aurait dû suivre l'échelle entière sans être rééchantillonnée. Deux points à ne pas perdre :
`pointer-events: none` sur `.jack`, sans quoi le voile avale le premier clic du joueur pendant
six dixièmes de seconde — et celui des outils de vérification ; et `prefers-reduced-motion` sur
les deux, le carton de mort étant précisément l'écran où l'on serait tenté d'ajouter un flash.

**Une planche d'icônes est indexée par l'ordre de `data/*.json`.** `items_scripts` suit
`hacking.scripts`, `items_plans` suit `hacking.plans`, `icons_butin` suit les quatre types de
butin. Réordonner la donnée sans réordonner la planche affiche le mauvais dessin, sans la
moindre erreur — même piège que l'ordre des tuiles d'un tileset.

Chaque générateur produit `.aseprite` (éditable à la main), `.png` et un `.json` de manifeste,
**dans deux emplacements distincts** — Vite ne sert que `public/`, et il n'y a aucune raison
d'embarquer les sources éditables dans le build :

| Chemin | Rôle |
|---|---|
| `assets/<sous-dossier>/<nom>.aseprite` | source éditable, versionnée, **non servie** |
| `public/assets/<sous-dossier>/<nom>.png` + `.json` | runtime, versionné, servi par Vite |

C'est `L.enregistrer(sprite, nom, sousDossier)` qui écrit les deux et retourne le chemin du
manifeste. Un PNG laissé dans `assets/` est invisible au jeu.
**Les générateurs doivent être déterministes** : toute matière procédurale passe par
`L.rng(graine)` et des listes ordonnées, jamais `pairs()`, dont l'ordre n'est pas garanti en
Lua. Vérification : deux exécutions successives donnent le même MD5.

L'ordre des tuiles dans un générateur fait foi. **Ajouter en fin de liste, ne jamais réordonner** —
mais on peut retoucher librement les pixels d'une tuile existante, sa position ne bouge pas.

### Les décors — un assemblage, pas une tilemap

Un décor est désormais **un fond plus une atmosphère**. Le fond est soit des **plans de
parallaxe** (`data/decors.json` → `plans`), soit la tilemap du même nom ; l'atmosphère (brume,
vignette, halos) se pose par-dessus l'un comme l'autre. C'est ce qui permet à une rue d'avoir de
la profondeur sans imposer une seule technique à tout le jeu.

- **Les plans viennent de `tools/aseprite/etalonner.lua`**, qui prend les parallaxes CC0 de
  `assets/parallax-src/` (Luis Zuno — *Ansimuz*, domaine public) et les fait entrer dans la
  palette : courbe de tonalité nuit, halo cuit, quantification sur les 32 couleurs. Les réglages
  vivent dans `data/etalonnage.json`. Déterministe, vérifié au MD5.
- **Un seuil de saturation ne reconnaît pas un néon.** La première version déclarait néon tout
  pixel saturé et clair : les 256×272 de brume orange du plan médian passaient le test, et le
  coucher de soleil survivait en plein jeu. *Une enseigne est entourée de nuit, une brume ne
  l'est pas* — d'où le test de contraste local, qui est le seul qui sépare réellement les deux.
- **La courbe de tonalité s'applique à la VALEUR HSV**, pas au RGB déjà mélangé avec la teinte de
  nuit, et elle a un **plancher**. Sans lui, tout ce qui est sous la moitié tombe à zéro et la
  rue devient un trou noir avec des enseignes dedans.
- **Le halo est cuit dans l'image, jamais un filtre au rendu.** Un bloom posé sur le stage
  tournerait sur 320×180 et adoucirait le pixel art — c'est exactement ce que la règle du canvas
  interdit. Et ce sont les néons qui diffusent, pas chaque pixel qui cherche un néon : cinquante
  fois moins de travail pour le même résultat.
- **Brume et vignette se tracent en bandes, jamais en dégradé continu.** Un dégradé lisse sur du
  pixel art fabrique à l'écran des centaines de valeurs que la palette n'a jamais contenues, et
  le décor se met à ressembler à une photo assombrie. Sept bandes suffisent à lire une
  profondeur, et elles restent du pixel.
- **La dérive des plans est minuscule** (un demi-pixel par seconde sur le plus lointain, zéro sur
  le plus proche). Une parallaxe rapide sur une scène fixe raconte que la caméra avance, ce qui
  est faux : le joueur est arrêté, il parle à quelqu'un. À cette vitesse on ne voit pas la ville
  bouger, on la sent respirer. Elle est coupée par `prefers-reduced-motion`, comme le glitch —
  c'est un mouvement continu en plein écran.
- **Une planche de parallaxe se cadre, elle ne se recadre pas.** Ces images sont composées pour
  une caméra plus large que 320×180 ; le plan *foreground* d'un jeu de parallaxe est une rue
  entière, pas un bandeau d'avant-plan. À Ninsei, deux plans lointains donnent une ville, les
  trois en donnaient un mur de devantures. Le cumul de la dérive reste en flottant et n'est
  arrondi qu'à la pose : arrondir à chaque image figerait tout plan dont la dérive est inférieure
  à un pixel par trame, c'est-à-dire tous.
- **Une animation de motif doit boucler sur la TUILE, sur chaque axe.** La pluie dérivait de
  `(-6, +16)` par cycle : 16 est bien la hauteur de la tuile, 6 n'est pas sa largeur, et le motif
  ressautait de six pixels sur le côté toutes les 0,55 s. Elle se fait donc en **deux animations,
  une par axe**, chacune sur seize pixels et seize pas — c'est le *rapport des durées* qui donne
  la pente (1 pour 3, celle dessinée dans `fx.lua`), jamais un déplacement oblique en un seul
  `@keyframes`. Accessoirement, `steps(16)` sur six pixels posait chaque image sur un tiers de
  pixel, ce que `pixelated` ne rattrape pas.
- **`node tools/pluie.mjs` relève la position de fond à chaque trame** et refuse une image posée
  entre deux pixels, un pas supérieur à un pixel, et une pente qui s'écarte du dessin. Une capture
  d'écran ne distingue pas « ça bouge » de « ça bouge bien » : c'est tout l'intérêt. Vérifié contre
  l'ancienne règle réintroduite — il y voit dix sauts de 10,375 px en six secondes.
- `npm run validate:assets` refuse un `plans[].image` absent de `public/assets/parallax/` et un
  décor qui n'a ni plans ni tilemap du même nom. Un plan renommé est pire qu'une tuile renommée :
  la scène reste noire, et rien ne distingue cette panne d'une scène volontairement sans décor.

### Tilemaps — de la donnée, jamais du pixel

Un décor est un `public/assets/tilemaps/<id>.json` : des rangées d'art ASCII plus une légende
qui associe chaque caractère à un **nom** de tuile. Jamais un index brut : une tilemap d'index
devient illisible et se casse au premier ajout mal placé.

```json
{ "tileset": "ts_interior",
  "legende": { "#": "mur_beton", "~": "neon_magenta" },
  "lignes": ["####", "#~~#"] }
```

`npm run validate:assets` vérifie que chaque légende pointe sur une tuile existante et que les
rangées sont rectangulaires. Sans lui, une tuile renommée ne se voit qu'à l'exécution, sous la
forme d'un décor vide.

**Deux variantes valent mieux qu'une tuile parfaite** : vingt copies d'une même tuile de sol sur
une rangée se lisent immédiatement comme un motif. `sol_beton` / `sol_beton_b` et `etagere` /
`etagere_b` alternent pour cette seule raison.

### L'ecran-titre — deux temps

`src/react/Titre.tsx` : un journal de demarrage de deux secondes, sautable a la premiere touche,
puis le titre proprement dit — le decor `titre` (les trois plans `ciel_*` etalonnes nuit), le logo
128x28, un sous-titre, et un menu minimal navigable aux fleches.

- **Le menu est la seule porte d'entree.** Avant, n'importe quelle touche lancait la partie ; on
  ne pouvait donc pas poser de menu sans casser tous les outils de verification. `ouvrirJeu()`
  saute maintenant le journal puis clique (ou valide) `NOUVELLE PARTIE`.
- **`EcranTitre` est un composant separe, et ce n'est pas du decoupage de confort.** `useDecor`
  monte son canvas Pixi au premier effet : tant que le journal occupait l'ecran, l'hote n'etait
  pas dans le DOM, `SceneJeu` notait un decor en attente que plus rien ne reclamait, et le titre
  s'affichait sur du noir — sans une erreur nulle part.
- **`Echap` est branche dans le crochet du titre, pas dans `App`.** L'ecran-titre ecoute deja le
  clavier ; un second ecouteur sur le meme ecran est exactement ce que `useNavigationClavier`
  existe pour empecher, meme quand les deux se partagent les touches sans se marcher dessus.
- Le logo est dessine par `tools/aseprite/ui.lua`, en 128x28, et **pose a sa taille exacte** :
  un multiple non entier le ferait baver, et il n'y a aucune raison de l'agrandir sur 320 pixels.
  Trois choses s'y jouent et aucune n'est decorative — le halo cyan est **trame** (une diffusion
  pleine sur trois pixels se referme entre deux lettres et pose le mot sur une plaque turquoise
  opaque), l'ombre portee est decalee de **un** pixel horizontalement (la chasse laisse deux
  pixels entre deux lettres, une ombre de deux les remplit exactement et soude le mot), et le
  ciselage est deduit du masque : du vide au-dessus ou a gauche donne une arete, du vide en
  dessous ou a droite un chanfrein.

### Portraits — un fichier par personnage

`tools/aseprite/portraits.lua` produit `public/assets/portraits/port_<id>.png`, en **64×80**, un
fichier par personnage. Pas de planche : la boîte les charge par `url()` en CSS, et découper dans
une planche imposerait des coordonnées dans le code pour quelques kilo-octets.

Le format est un **buste vertical**, pas un carré. Quarante-huit pixels de côté ne laissaient de
place qu'à une tête flottante : pas de cou, pas d'épaules, pas d'espace au-dessus du crâne, et
surtout **aucune place pour poser une lumière**. Tous les visages se lisaient comme des vignettes
d'icône.

Ce qui tient le lot :

- **Cheveux d'abord, visage par-dessus.** L'ordre inverse donne une masse capillaire qui mange le
  front jusqu'aux sourcils : tous les portraits se lisaient comme des casques.
- **Le fond doit différer des cheveux.** La première version peignait des cheveux `'1'` sur un
  fond `'1'` : la chevelure existait dans le fichier et n'existait pas à l'écran.
- **Deux sources, jamais une.** Une clé chaude d'un côté, un **liseré de néon froid** de l'autre,
  et une lueur tramée derrière l'épaule pour justifier ce liseré — sans source visible il se lit
  comme un contour dessiné, pas comme une lumière. Le liseré est tramé une ligne sur trois :
  plein, il devient un trait au feutre et la tête se décolle du fond.
- **Le même liseré court sur l'arête de l'épaule.** Sans lui le buste est un aplat sombre sur un
  fond sombre, la tête flotte, et les onze portraits ont l'air découpés aux ciseaux.
- **Le cou est large et commence sous la mâchoire.** Un cou étroit fait une tête plantée sur un
  piquet — c'était le défaut le plus visible du premier passage en 64×80, et il se voyait sur les
  onze à la fois.
- **Le nez est une arête éclairée, une ombre et deux narines.** À cette taille un nez dessiné en
  volume devient une tache sombre au milieu du visage, et c'est tout ce qu'on voit du portrait.
  Nez et bouche sont donc des **arts partagés** (`NEZ_ART`, `BOUCHE_ART`) dont les majuscules sont
  substituées par la carnation de chacun : onze copies du même dessin auraient divergé à la
  première retouche.
- **Les hauteurs de traits sont nommées** (`CHEVEUX`, `YEUX`, `NEZ`, `BOUCHE`, `COL`), pas semées
  dans onze fonctions. Remonter les yeux de deux pixels sur tout le lot est un réglage qu'on
  refait dix fois avant que les visages se ressemblent entre eux.
- **Un tramage se fait par matrice ordonnée, pas par formule modulo.** La lueur de fond tirait
  d'abord `(x * 3 + y * 5) % 7`, qui dessine des diagonales régulières : à l'écran ce n'était pas
  une lueur, c'étaient des rayures.
- **La boîte de dialogue n'en montre que la tête** — 60 rangées sur 80, cadrées par le haut
  (`background-size` porte la taille réelle de l'image, sinon le recadrage devient un
  écrasement). Le buste entier dans la boîte coûtait vingt-quatre rangées de décor sur les cent
  quatre-vingts de l'écran, et on venait justement de donner de la profondeur à ce décor.

Les ovales donnent la masse, l'art ASCII donne les yeux et la bouche — c'est là qu'un pixel de
travers change l'expression.

Aperçu agrandi pour inspection :
```bash
~/.local/aseprite/squashfs-root/usr/bin/aseprite --batch public/assets/tilesets/ts_interior.png \
  --scale 8 --save-as /tmp/apercu.png
```

## Limites du contenu

Registre du roman : violence brève, clinique, sans complaisance. Drogues, prostitution, body
horror des implants, mort banalisée. **La noirceur vient de l'univers et du désespoir des
personnages, pas de la description graphique.** PEGI 18 / M.
