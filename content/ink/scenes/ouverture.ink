// OUVERTURE — le flatline, il y a trois ans.
//
// Cette scène existe pour une seule raison : le joueur ne connaît pas
// forcément le roman. Avant le Chatsubo, il doit savoir ce qu'est la matrice,
// ce qu'est un cowboy de console, pourquoi Sable n'en est plus un, et ce qui
// est revenu avec lui. Tout est montré, rien n'est récité.
//
// Elle sert aussi de tutoriel silencieux : les premières étiquettes de choix
// apparaissent ici, dans une scène dont l'issue est déjà écrite.

=== ouverture ===
# bg:matrice # musique:matrice_froide
# entracte:CHIBA CITY — IL Y A TROIS ANS

La matrice n'est pas un lieu. C'est une convention : une hallucination consensuelle, vécue chaque jour par des milliards d'opérateurs légitimes, dans tous les pays du monde.

Sable n'était pas légitime. Il était cowboy de console : on lui payait un deck, il se collait les trodes aux tempes.
Et il allait chercher dans la mémoire des autres ce que les autres ne voulaient pas donner.

Branché, le monde devenait de la géométrie. Des grappes et des constellations de données, dépliées dans le non-espace de l'esprit. Comme des lumières de ville qui s'éloignent.

Ce soir-là : un client sans nom, un fichier sans titre, et une banque de données bien trop mal gardée pour ce qu'elle contenait.

* C'est trop facile. # etq:ACTION
    ~ learn("sable_prudent")
    Il le pensa, et il continua quand même. C'était le métier : penser une chose et faire l'autre.

* Trop facile, ça n'existe pas. Il existe des gens doués.
    ~ learn("sable_arrogant")
    Il avait vingt-six ans et il était très doué. Les deux étaient vrais. Un seul allait compter.

- -> ouverture_glace


=== ouverture_glace ===
# sfx:glace_noire

La glace monta du plancher de données comme de l'encre dans de l'eau claire.

Pas un mur commercial. Pas une alarme. Une chose noire, lente, qui avait des intentions.

La glace ordinaire protège les données. La glace noire ne s'occupe pas des données : elle remonte le lien, trouve le corps au bout, et arrête le cœur.
C'est parfaitement légal quand l'opérateur est un voleur.

Sable était un voleur.

— Glace noire, dit-il tout haut, dans une pièce vide, à trois heures du matin. # speaker:sable

Il lui restait peut-être sept secondes, et trois façons de les dépenser.

* Forcer. Le fichier d'abord, la peur ensuite. # etq:ACTION
    ~ boost_competence("hacking")
    Il jeta tout ce qu'il avait contre le mur noir. Le mur le laissa faire, parce que ça l'amusait, et Sable eut son fichier.
    Il l'a toujours. Il ne l'a jamais ouvert.

* Lui parler. Toute glace est un programme, et tout programme écoute.
    ~ boost_competence("social")
    Il lui parla. Elle répondit — pas avec des mots, avec une image : lui, de dos, plus vieux de trois ans, descendant Ninsei sous la pluie.
    Il ne comprit ce qu'il avait vu que beaucoup plus tard.

* Arracher les trodes. Se débrancher à la main. # etq:ACTION
    ~ boost_competence("combat")
    Il s'arracha les trodes du crâne avec assez de force pour emporter la peau avec.
    Deux secondes trop tard. Il apprit ce soir-là que deux secondes, c'est une durée.

- -> ouverture_flatline


=== ouverture_flatline ===
# bg:aucun
# entracte:QUATRE-VINGT-QUATORZE SECONDES

Puis rien.

Le rien n'est pas noir. Le noir est une couleur, et il faut des yeux pour la voir. Le rien n'a pas de texture, pas de bord, pas de durée.

Sable y resta quatre-vingt-quatorze secondes et deux dixièmes. C'est un chiffre qu'on lui a donné plus tard, sur un tracé. Lui n'a rien compté.

Il n'était pas seul.

-> ouverture_reveil


=== ouverture_reveil ===

Il se réveilla sous un néon chirurgical, dans une clinique de la bande de Ninsei où l'on ne demande pas les noms.

Le médecin lui montra le tracé et fit la liste sans s'asseoir.

RÉANIMATION — PARTIELLE
INTERFACE NEURALE — DÉGRADÉE
PRONOSTIC — toute plongée profonde déclenchera une crise

— Vous pourrez encore effleurer la surface, dit le médecin. Rien de plus. # speaker:medecin
— Votre système nerveux a appris à avoir peur, et il ne désapprendra pas.

Ce qui revenait à dire : vous n'êtes plus cowboy. Vous êtes quelqu'un qui l'a été.

Personne ne vit l'autre chose. Elle ne figurait sur aucun scan, parce qu'aucun scan ne la cherchait.

Sable, lui, la sentit tout de suite. Une attention. Quelque chose qui regardait par ses yeux et qui prenait son temps pour comprendre ce qu'il voyait.

* Qu'est-ce que tu es ? # etq:FRAGMENT # cout_humanite:5
    ~ humanite -= 5
    ~ learn("fragment_interroge")
    Pas de réponse. Pas cette année-là.
    Mais quelque chose, derrière l'os frontal, nota la question et la garda.

* Ne rien demander. Certaines questions sont des invitations. # etq:ACTION
    ~ learn("fragment_ignore")
    Il se tut. La chose aussi. Ils apprirent à cohabiter comme deux locataires qui se détestent et partagent un bail.

- -> prologue
