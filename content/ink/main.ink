// NEUROMANCER — point d'entree narratif
//
// main.ink ne raconte rien : il declare l'etat global et aiguille.
// Chaque scene se termine par -> DONE et rend la main au moteur, qui decide
// de la suite. C'est ce qui rend la structure en hub possible.

INCLUDE shared/globals.ink
INCLUDE scenes/ouverture.ink
INCLUDE scenes/prologue.ink

-> ouverture
