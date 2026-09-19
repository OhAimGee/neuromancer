// Acte I — l'equipage. Six candidats, trois places.
//
// Vingt combinaisons, et c'est la que se joue la rejouabilite. Chacun a une
// condition d'entree differente : un se paie, un se vole dans la matrice, un
// se merite, un ne se refuse pas. On n'emmene jamais les memes deux fois sans
// le vouloir.
//
// Les places sont comptees par le jeu (places_libres), pas par le recit : le
// magasin d'equipage est l'etat de la partie, pas une variable Ink.
//
// Chaque scene est un TUNNEL (`-> riviera ->`) et se termine par `->->` : elle
// rend la main a l'endroit d'ou on l'a appelee. Un recrutement n'a donc pas a
// savoir dans quel lieu il se joue, et le meme candidat peut se presenter
// ailleurs sans qu'on touche a son texte.
//
// Tous les choix sont COLLES (+). Un choix a usage unique disparait apres avoir
// ete pris, et une scene reentrante dont tous les choix sont epuises n'a plus
// aucun contenu : Ink sort alors du knot et remonte jusqu'a la fin du fichier,
// ce qui se lit « unexpectedly reached end of content » et plante 127 parties
// sur 500 au fuzzing.

=== equipage_plein ===
Trois. C'est tout ce qu'un homme peut surveiller en même temps, et Sable n'était pas sûr de pouvoir en surveiller trois.
->->

// --- RIVIERA : au Chatsubo, il se produit. Il ne se recrute pas, il s'accepte.

=== riviera ===
# bg:map_chatsubo # musique:ambiance_chatsubo
Il y avait un homme au fond de la salle, et autour de lui une femme faite de lumière qui se déshabillait très lentement.
Personne ne regardait la femme. Tout le monde regardait ailleurs avec beaucoup d'application, ce qui revient à regarder.
# speaker:riviera
— Elle n'existe pas. C'est ce qui la rend supportable.
— Peter Riviera. Je projette. Ce que vous voyez sort de chez moi, et ce que vous ressentez en le voyant aussi.

{ places_libres() == 0: -> equipage_plein }

+ Qu'est-ce que vous voulez ?
    # speaker:riviera
    — Un public. Vous allez quelque part où il va se passer quelque chose, et je préfère le voir de près.
    -> riviera_choix

+ { knows("villa_straylight_plan") } Vous savez ce qu'il y a dans la Villa Straylight. # etq:CONNAISSANCE
    ~ confiance += 3
    # speaker:riviera
    Le sourire ne bougea pas, mais la femme de lumière s'éteignit d'un coup.
    — Je sais surtout qui y habite. Ce n'est pas la même chose, et c'est beaucoup plus utile.
    -> riviera_choix

+ Partir sans lui parler. # geste
    Sable sortit. Derrière lui, la femme de lumière recommença depuis le début, pour personne.
    ->->

= riviera_choix
Sable savait exactement ce qu'il regardait. Un homme qui fait souffrir pour le plaisir de la mise en scène, et qui ouvre des portes qu'aucun honnête homme n'ouvre.

+ L'emmener. # etq:ACTION # geste # cout_humanite:10
    ~ humanite -= 10
    ~ recruter("riviera")
    ~ learn("riviera_embarque")
    — Excellent. Je vous préviens : je ne suis utile que quand ça tourne mal.
    Ce n'était pas une mise en garde. C'était un programme.
    ->->

+ Non. Je sais ce que vous êtes, et je n'en ai pas besoin.
    # speaker:riviera
    — Dommage. Vous auriez été un très bon décor.
    ->->

// --- LE FINN : il se paie, et il ne s'en cache pas.

=== finn_recrutement ===
# speaker:finn
— Tu veux que je ferme boutique et que je te suive ? Sur Ninsei, fermer boutique c'est mourir plus tard, mais mourir quand même.

{ places_libres() == 0: -> equipage_plein }

+ { credits >= 3000 } Trois mille. Ferme. # cout_credits:3000
    ~ credits -= 3000
    ~ recruter("finn")
    ~ confiance += 2
    # speaker:finn
    Il compta, puis rangea la caisse sous le comptoir comme on enterre quelqu'un.
    — Une chose. Si quelqu'un m'offre plus, je te le dirai avant d'accepter. C'est tout ce que je peux promettre honnêtement.
    ~ learn("finn_embarque")
    ->->

+ { knows("lady_3jane_testament") } Tu prends le testament, et tu viens avec. # etq:CONNAISSANCE
    ~ soupcon += 2
    ~ recruter("finn")
    # speaker:finn
    — Tu me donnes un papier qui vaut la peau de celui qui le porte, et tu me demandes de le porter.
    — D'accord. À ce prix-là, autant être là quand ça se vend.
    ~ learn("finn_embarque")
    ->->

+ Laisser tomber. # geste
    ->->

// --- DIXIE : un construct ROM. On ne le recrute pas, on le vole.
// C'est la seule recrue qui exige une plongee, et c'est voulu : elle attache
// le hacking a la structure de la partie.

=== dixie ===
# bg:map_finn # musique:ambiance_ninsei
# speaker:finn
— McCoy Pauley. Le Dixie Flatline. Le meilleur cowboy de sa génération, mort trois fois et revenu deux.
— Sense/Net garde sa personnalité sur une cartouche ROM dans une bibliothèque. Un construct. Il ne vit pas, il se souvient.

{ places_libres() == 0: -> equipage_plein }

+ { knows("dixie_rom_localisee") } J'ai la cartouche. # etq:CONNAISSANCE
    -> dixie_branche

+ Où exactement ?
    # speaker:finn
    — Dans leurs archives. Tu te branches, tu descends, et tu la prends. Personne ne surveille les morts.
    ~ learn("dixie_rom_a_voler")
    ->->

+ Un mort n'aide personne.
    # speaker:finn
    — Un mort qui se souvient de comment percer une glace de rang neuf, si.
    ->->

= dixie_branche
~ recruter("dixie")
Sable brancha la cartouche sur son deck. Le construct s'alluma sans préambule, comme on rallume une pièce.
# speaker:dixie
— Salut, gamin. J'étais où ?
Il ne se souvenait pas de la dernière fois. Il ne se souviendrait pas de celle-ci. C'était la condition.
— Une chose. Quand c'est fini, tu m'effaces. Tu promets ça ou tu me débranches tout de suite.

+ Je promets.
    ~ learn("promesse_dixie")
    # speaker:dixie
    — Bien. Les vivants promettent facilement, mais c'est déjà mieux que rien.
    ->->

+ Je ne promets rien. # etq:MENSONGE
    ~ soupcon += 2
    # speaker:dixie
    — Honnête. Je préfère. Ça veut dire que tu réfléchis.
    ->->

// --- MAELCUM : le port. Il ne se paie pas et il ne se menace pas.

=== maelcum ===
# bg:map_ninsei # musique:ambiance_ninsei
Le port était au bout de Ninsei, là où le néon s'arrête et où l'eau commence. Il pleuvait dessus depuis toujours.
Amarré entre deux cargos, un remorqueur peint de vert, d'or et de rouge, et qui n'essayait pas de se cacher.
Le remorqueur de Zion sentait la ganja, l'huile et le métal chaud. Le dub sortait des cloisons comme si le bateau le fabriquait lui-même.
# speaker:maelcum
— Babylone t'a mis quelque chose dans le sang, mon frère. Ça se voit à la façon dont tu comptes les heures.

{ places_libres() == 0: -> equipage_plein }

+ Je ne compte pas les heures.
    ~ soupcon += 2
    # speaker:maelcum
    — Si.
    -> maelcum_offre

+ Douze cycles. Ensuite je fonds.
    ~ confiance += 4
    # speaker:maelcum
    — Alors on ne perd pas de temps en politesses.
    -> maelcum_offre

+ { knows("wintermute_existe") } Il y a une chose dans ma tête, et elle a un nom. # etq:CONNAISSANCE
    ~ confiance += 5
    # speaker:maelcum
    — Les Loa parlent par qui les laisse parler. Chez nous ça n'a rien d'une maladie.
    — Tu es un cheval, mon frère. Reste à savoir qui monte.
    ~ learn("lecture_loa")
    -> maelcum_offre

= maelcum_offre
# speaker:maelcum
— Je pilote. Je ne tue pas. Si tu tues devant moi, je te descends au port le plus proche et tu continues seul.

+ Accepter ses conditions. # etq:ACTION # geste
    ~ recruter("maelcum")
    ~ learn("maelcum_embarque")
    — Alors on est d'accord. Jah aide ceux qui savent ce qu'ils demandent.
    ->->

+ { humanite > 30 } Personne ne me dit qui je tue. # etq:MENACE
    ~ soupcon += 4
    # speaker:maelcum
    Il ne se leva pas et ne haussa pas la voix.
    — Alors va-t'en. Tu connais le chemin, tu l'as pris pour venir.
    ->->

+ Partir sans insister. # geste
    ->->

// --- YONDERBOY : les Panther Moderns. On les contacte par le reseau.

=== yonderboy ===
# bg:map_coffin # musique:ambiance_ninsei
L'écran du cercueil s'alluma tout seul. Personne ne l'avait allumé, et c'était le message.
# speaker:yonderboy
— On a lu ton trafic. Tu fouilles des registres corpo avec un deck de musée. C'est mignon.
— Lupus Yonderboy. Panther Moderns. On ne vend rien, on ne loue rien. On participe.

{ places_libres() == 0: -> equipage_plein }

+ Participer à quoi ?
    # speaker:yonderboy
    — À ce qui est intéressant. Tu vas faire quelque chose de spectaculaire et tu ne le sais pas encore.
    -> yonderboy_choix

+ { knows("operation_poing_hurlant") } Je vais entrer chez Tessier-Ashpool. # etq:CONNAISSANCE
    ~ confiance += 4
    # speaker:yonderboy
    Un silence, puis un rire qui n'avait pas de corps derrière.
    — Ça, c'est intéressant. Ça, on le fait gratuitement.
    -> yonderboy_choix

+ Couper l'écran. # geste
    L'écran s'éteignit. Il se ralluma deux secondes, juste pour montrer qu'il pouvait.
    ->->

= yonderboy_choix
+ L'embarquer. # etq:ACTION # geste
    ~ recruter("yonderboy")
    ~ learn("yonderboy_embarque")
    # speaker:yonderboy
    — Parfait. Préviens-nous avant que ça devienne ennuyeux. On part quand ça devient ennuyeux.
    ->->

+ Non. Le chaos ne se dirige pas, et je n'ai pas le temps d'essayer.
    # speaker:yonderboy
    — C'est exact. C'est même tout l'intérêt.
    ->->
