// Variables globales et pont vers le moteur.
//
// CONVENTION : ce fichier ne contient aucun texte joue. Les nombres
// d'equilibrage vivent dans data/*.json, pas ici.

// --- Jauges de scene -------------------------------------------------------
// Remises a zero par le moteur au debut de chaque scene de dialogue.
VAR confiance = 0
VAR soupcon = 0

// --- Etat de la partie -----------------------------------------------------
VAR humanite = 100
VAR cycles_restants = 12
VAR credits = 0

// Vrai quand l'ampoule est dans la poche de Sable. Une VAR et non un learn() :
// un antidote se fabrique a chaque partie, il ne s'apprend pas a vie.
VAR antidote_en_poche = false

// --- Acte III --------------------------------------------------------------
// Comment on est entre dans la Villa, et ce qu'on a laisse derriere soi. Ces
// quatre variables sont l'unique memoire du run : les fins les relisent.
VAR approche_mode = ""
VAR sang_verse = false
VAR kuang_en_main = false
VAR promesse_dixie = false
// Une seule dispute par partie : deux d'affilee feraient une sitcom.
VAR friction_jouee = false

// --- Identite du fragment --------------------------------------------------
// "" tant que le joueur ne sait rien. Valeurs possibles :
// wintermute | neuromancer | construct | demon_ta | rien
VAR fragment_identite = ""

// --- Ponts vers le moteur --------------------------------------------------
// Chaque EXTERNAL possede une fonction de repli du meme nom, juste en dessous.
// Ink utilise le repli quand la fonction n'est pas liee : cela permet de jouer
// le .ink dans Inky et de le passer au fuzzing du validateur sans bouchon.

EXTERNAL knows(info_id)
=== function knows(info_id) ===
~ return false

EXTERNAL skill(nom)
=== function skill(nom) ===
~ return 0

EXTERNAL has_implant(id)
=== function has_implant(id) ===
~ return false

EXTERNAL crew_present(id)
=== function crew_present(id) ===
~ return false

// Cloture la scene en cours : le moteur lit confiance/soupcon, calcule le
// palier parmi les 4, et ecrit l'issue dans l'etat global.
EXTERNAL resolve_scene(scene_id)
=== function resolve_scene(scene_id) ===
~ return 0

// Enregistre une information de facon permanente (profil, pas run).
EXTERNAL learn(info_id)
=== function learn(info_id) ===
~ return 0

// Augmente une competence de 1. Utilise par l'ouverture : la facon dont Sable
// est mort definit ce qu'il a garde.
// Rend la main au jeu pour une plongee dans la matrice, depuis le point
// d'acces donne. `retour` est le knot ou le recit reprend au debranchement ;
// c'est le recit qui decide de la suite, pas le moteur.
EXTERNAL plonger(point_acces, retour)
=== function plonger(point_acces, retour) ===
~ return 0

// Ouvre le comptoir d'un marchand. Meme mecanique que plonger() : le recit
// sort du dialogue, le jeu prend la main sur un ecran a lui, et reprend au knot
// annonce. Le catalogue vit dans data/boutique.json, les prix dans
// data/boutique.json pour les scripts et data/implants.json pour les implants.
EXTERNAL ouvrir_boutique(marchand, retour)
=== function ouvrir_boutique(marchand, retour) ===
~ return 0

// Ajoute un script a l'inventaire de la partie. Le recit ne connait que des
// identifiants ; les nombres restent dans data/hacking.json.
EXTERNAL acquerir_script(id)
=== function acquerir_script(id) ===
~ return 0

// `a_plan` et `poser_implant` ont disparu d'ici avec l'atelier : la pose se
// fait au comptoir (ouvrir_boutique), et le plan vole y est la condition
// d'affichage de l'article. Le recit n'a plus a connaitre le contenu du sac.

// Recrute un equipier. Sans effet si les trois places sont prises : le recit
// doit donc verifier places_libres() avant de proposer.
EXTERNAL recruter(id)
=== function recruter(id) ===
~ return 0

EXTERNAL places_libres()
=== function places_libres() ===
~ return 3

// Nombre de parties deja terminees, toutes fins confondues. Sert a une seule
// chose : la fin secrete, qui doit exiger d'avoir joue plusieurs fois. Une
// connaissance persistante ne suffirait pas — rien n'interdit de les reunir
// toutes dans la meme partie.
EXTERNAL parties()
=== function parties() ===
~ return 0

EXTERNAL boost_competence(nom)
=== function boost_competence(nom) ===
~ return 0
