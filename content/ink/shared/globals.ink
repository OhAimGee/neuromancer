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
