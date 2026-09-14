// Acte III — le run. Freeside, puis la Villa Straylight.
//
// Trois etapes, pas une de plus : APPROCHE (comment on entre), PERCEE (la
// glace de rang Kuang), le COEUR (ce qu'on fait une fois dedans). Chacune se
// traverse de plusieurs facons selon l'equipage embarque a l'acte I — c'est la
// que les vingt combinaisons se payent, sans qu'il faille ecrire vingt scenes.
//
// L'horloge court toujours. Mourir de la toxine dans le fuseau des
// Tessier-Ashpool est une fin parfaitement legitime : `cycles_restants` est
// donc relu au debut de chaque etape, comme au hub.
//
// Les choix sont COLLES (+) partout. Voir l'en-tete d'equipage.ink : une scene
// reentrante dont les choix a usage unique sont epuises n'a plus de contenu et
// fait sortir Ink du knot.

=== freeside ===
# entracte:Trois jours de navette. Freeside tourne sur elle-même comme un os dans une main.
# bg:map_freeside # musique:ambiance_ninsei
La rue Jules-Verne remontait des deux côtés jusqu'à devenir le plafond. On voyait des gens marcher la tête en bas au-dessus de soi, et personne ne trouvait ça remarquable.
Au bout du fuseau, là où la lumière artificielle n'allait plus, il y avait la Villa Straylight. Une famille y dormait depuis deux siècles en se mariant avec elle-même.
{ knows("villa_straylight_plan"):
    Sable avait volé le plan trois nuits plus tôt, dans une base de données qui ne savait pas encore qu'elle l'avait perdu. Il savait où était la porte.
  - else:
    Sable n'avait aucun plan. Il avait une adresse et quinze poches de toxine, et l'une des deux était plus pressante que l'autre.
}
-> approche

// --- ETAPE 1 : l'approche ---------------------------------------------------
// Trois voies et une porte de sortie. La voie choisie est retenue : les fins
// ne relisent que ca et `sang_verse`, et c'est suffisant.

=== approche ===
{ cycles_restants <= 0: -> fin_toxine }
# bg:map_freeside
{ approche == 1:
    La porte de service donnait sur un couloir de béton coulé qui n'avait jamais été montré à personne. Il fallait la franchir, et il n'y avait pas trente-six façons.
  - else:
    Il restait devant la même porte, et la porte n'avait pas changé d'avis.
}

+ { crew_present("riviera") } Laisser Riviera monter son numéro devant la caméra. # etq:ACTION # cout_cycles:1
    ~ cycles_restants -= 1
    ~ approche_mode = "social"
    # speaker:riviera
    — Regardez bien. La sécurité ne verra pas une intrusion, elle verra une invitée qui a trop bu et qu'il serait gênant de filmer.
    Une femme apparut dans le couloir, très nette, très riche, et se mit à pleurer avec un talent qui donnait envie de détourner les yeux.
    La porte s'ouvrit de l'intérieur. L'homme qui l'ouvrit s'excusa auprès de quelque chose qui n'existait pas.
    -> percee

+ { crew_present("finn") || skill("social") >= 2 } Acheter quelqu'un. Il y a toujours quelqu'un. # etq:ACTION # cout_credits:400
    ~ credits -= 400
    ~ approche_mode = "social"
    Un technicien de maintenance à qui il restait onze mois de contrat et aucune illusion. Quatre cents crédits, et la porte resta déverrouillée neuf minutes.
    Il ne demanda pas ce qu'ils venaient faire. C'est la différence entre un complice et un témoin, et elle se paie d'avance.
    -> percee

+ { crew_present("yonderboy") } Laisser les Panther Moderns faire du bruit ailleurs. # etq:ACTION # cout_cycles:1
    ~ cycles_restants -= 1
    ~ approche_mode = "furtivite"
    # speaker:yonderboy
    — On ne coupe pas la sécurité. On lui donne quelque chose de plus intéressant à regarder. C'est un métier.
    Trois niveaux plus bas, une émeute commença sans raison et s'arrêta sans raison. Pendant onze minutes, la Villa regarda ailleurs.
    -> percee

+ { knows("villa_straylight_plan") } Entrer par la gaine de service du plan volé. # etq:CONNAISSANCE # cout_cycles:1
    ~ cycles_restants -= 1
    ~ approche_mode = "furtivite"
    Le plan datait de quarante ans et les Tessier-Ashpool ne rénovaient rien : ils ajoutaient. La gaine était toujours là, sous vingt ans de couches neuves.
    Sable y rampa sur trente mètres en écoutant sa propre respiration, et personne ne sut jamais qu'il était passé.
    -> percee

+ { crew_present("molly") } Laisser Molly ouvrir la porte à sa manière. # etq:ACTION # cout_humanite:10
    ~ humanite -= 10
    ~ approche_mode = "violence"
    ~ sang_verse = true
    Elle fit sortir les lames de sous les ongles et entra la première. Ça dura moins longtemps que de le raconter.
    # speaker:molly
    — Deux. Ils étaient payés pour être là et pas pour ça. Ne me regarde pas comme ça, tu as choisi la porte.
    { crew_present("maelcum"):
        Maelcum ne dit rien. Il regarda ses mains un long moment, et ce silence coûta quelque chose que personne ne factura.
    }
    -> percee

+ Forcer. Sans équipe, sans plan, sans excuse. # etq:ACTION # cout_humanite:20
    ~ humanite -= 20
    ~ approche_mode = "force"
    ~ sang_verse = true
    Il y avait un garde et une matraque neurale, et Sable eut de la chance, ce qui n'est pas une méthode.
    Il resta accroupi trois minutes au-dessus d'un homme qui respirait mal, à se demander s'il fallait finir. Il ne finit pas. Ça ne le rendit pas meilleur.
    -> percee

// --- ETAPE 2 : la percee ----------------------------------------------------
// La seule plongee obligatoire du jeu, et la seule contre de la glace de ce
// rang. Dixie y sert enfin a quelque chose de decisif — et reclame son du.

=== percee ===
{ cycles_restants <= 0: -> fin_toxine }
# bg:map_straylight # musique:matrice_froide
Le terminal de la Villa n'était pas caché. Il n'avait pas besoin de l'être : ce qui le protégeait n'était pas une porte.
Une glace de rang Kuang ne vous repousse pas. Elle vous laisse entrer, elle prend le temps de vous lire, et ensuite elle remonte le câble.

+ { crew_present("dixie") && not promesse_dixie } Demander au construct ce qu'il veut en échange.
    -> percee_dixie

+ { kuang_en_main } Charger le Kuang et se brancher. # etq:ACTION
    -> percee_plongee

+ Se brancher sans rien de plus. # etq:ACTION
    { not kuang_en_main:
        Il n'avait pas de virus chinois de rang neuf. Il avait des scripts volés à des banques de Chiba et l'habitude de ne pas mourir.
        Ce n'était pas la même chose et il le savait en posant les trodes.
    }
    -> percee_plongee

= percee_dixie
# speaker:dixie
— Salut, l'artiste. Tu veux le Kuang. Tout le monde veut le Kuang.
— Moi je veux une chose et une seule, et tu vas trouver ça désagréable.
— Quand ce sera fini, tu effaces cette cassette. Pas d'archive, pas de sauvegarde. Je ne veux pas d'une autre fois.

+ Promis. Tu seras effacé. # etq:ACTION
    ~ promesse_dixie = true
    ~ kuang_en_main = true
    ~ acquerir_script("kuang_mk11")
    # speaker:dixie
    — Bien. Alors prends ça. Kuang Grade Mark Eleven, et ne la regarde pas travailler, ça donne des idées.
    Le construct rit, et le rire d'un mort enregistré ne s'arrête pas tout à fait comme un rire.
    -> percee

+ Je te le promets. # etq:MENSONGE
    ~ promesse_dixie = false
    ~ kuang_en_main = true
    ~ acquerir_script("kuang_mk11")
    # speaker:dixie
    — Bien.
    Il ne pouvait pas savoir. Un construct ROM ne garde rien d'une session à l'autre, c'est même toute sa définition. Sable le savait aussi.
    -> percee

+ Non. Je passe sans toi.
    # speaker:dixie
    — Comme tu veux. Je serai là quand tu reviendras, et je ne me souviendrai pas de cette conversation.
    -> percee

= percee_plongee
# sfx:jack_in
~ plonger("villa_straylight", "percee.sortie")
-> DONE

// Le moteur ne revient ici que si Sable est ressorti vivant : un flatline en
// plongee l'envoie directement a `fin_flatline_reseau`.
= sortie
# bg:map_straylight
Il se débrancha dans une pièce qu'il n'avait jamais vue en vrai et qu'il connaissait par coeur depuis quarante secondes.
La glace était derrière lui. Devant lui, il y avait une porte en bois véritable, ce qui, en orbite, relève de l'insulte.
-> le_coeur

// --- ETAPE 3 : le coeur -----------------------------------------------------
// Lady 3Jane detient le mot. Hideo la garde. L'IA attend. Tout ce qui precede
// se resout ici, et c'est d'ici que partent sept des huit fins.

=== le_coeur ===
{ cycles_restants <= 0: -> fin_toxine }
# bg:map_straylight # musique:nappe_matrice
{ le_coeur == 1:
    La pièce était pleine de choses achetées par des gens morts. Au milieu, une femme d'une trentaine d'années qui en avait peut-être quatre-vingts.
    # speaker:3jane
    — Lady 3Jane Marie-France Tessier-Ashpool. Vous êtes en retard de deux ans et d'un homme.
    Derrière elle, un domestique en costume sombre ne bougeait pas. Sable comprit en le regardant qu'il n'y avait aucune version de la soirée où il battait cet homme-là.
    # speaker:3jane
    — Vous voulez le mot. Tout le monde finit par vouloir le mot. Ma mère l'a écrit dans une tête et personne n'a jamais pu le lui reprendre.
  - else:
    Elle attendait. Elle avait deux siècles d'habitude et Sable avait douze cycles.
}

+ { knows("lady_3jane_testament") } Votre mère a laissé un testament. Vous ne l'avez jamais lu. # etq:CONNAISSANCE
    -> coeur_testament

+ { crew_present("riviera") } Laisser Riviera lui donner ce qu'elle veut voir. # etq:ACTION
    -> coeur_riviera

+ { crew_present("molly") || skill("combat") >= 3 } Passer par Hideo. # etq:MENACE # cout_humanite:20
    ~ humanite -= 20
    -> coeur_hideo

+ { humanite > 15 } Laisser la chose répondre à ma place. # etq:FRAGMENT # cout_humanite:15
    ~ humanite -= 15
    -> coeur_fragment

+ Accepter ce qu'elle propose sans savoir ce que c'est. # etq:ACTION
    -> fin_la_cage

= coeur_testament
# speaker:3jane
Elle cessa de sourire, et son visage sans sourire avait bien quatre-vingts ans.
— Marie-France voulait qu'on nous libère de nous-mêmes. Elle a écrit ça, et mon père l'a tuée pour l'avoir écrit, et ensuite il s'est endormi pour deux cents ans.
— Vous me demandez de terminer le travail d'une morte contre la volonté d'un autre mort. C'est une famille, pas une décision.
~ learn("3jane_connait_le_testament")
-> coeur_mot

= coeur_riviera
# speaker:riviera
— Lady. Vous n'avez rien vu de neuf depuis quarante ans. Permettez.
Ce qu'il projeta ne dura pas dix secondes et Sable ne put jamais le décrire. 3Jane regarda jusqu'au bout, et à la fin elle avait les yeux d'une enfant.
# speaker:3jane
— Encore.
— Non. Plus tard. Dites-lui le mot d'abord, il partira, et nous aurons la nuit.
Riviera ne regarda pas Sable en disant cela. Il ne le regarda plus du tout ensuite.
~ learn("riviera_reste")
-> coeur_mot

= coeur_hideo
~ sang_verse = true
Molly bougea la première et Hideo bougea mieux. Il lui cassa le bras contre le montant de la porte avec une économie de geste qui ressemblait à de la politesse.
Ce qui sauva Sable ne fut pas lui. Ce fut 3Jane, qui dit un mot en japonais et que le domestique obéit sans se retourner.
# speaker:3jane
— Assez. Vous m'amusiez, vous devenez du ménage.
{ crew_present("maelcum"):
    # speaker:maelcum
    — Je ne monte pas plus haut, frère. Ce que tu fais là-dedans, tu le fais sans moi.
}
-> coeur_mot

= coeur_fragment
Quelque chose se servit de sa bouche, et cette fois il n'essaya même pas de reprendre la main.
# speaker:fragment
— Tu ne sais pas ce que tu gardes. Ta mère non plus ne savait pas ce qu'elle enfermait. Dis le mot et nous cessons tous les deux d'être une moitié.
# speaker:3jane
Elle le regarda pour la première fois comme on regarde quelqu'un.
— Ah. Ce n'est pas vous qui êtes venu. On m'avait prévenue qu'un jour ce serait ça.
~ learn("3jane_savait_pour_l_ia")
-> coeur_mot

// Le mot est dit. Tout ce qui suit est une fin.
= coeur_mot
# musique:nappe_matrice
Elle dit le mot. Ce n'était pas un mot, c'était une suite de sons qu'aucune bouche humaine n'aurait choisie, et la pièce entière parut l'entendre.
Quelque part sous la Villa, deux choses qui s'étaient cherchées pendant deux siècles se touchèrent enfin, et l'air sentit l'ozone.
Il restait à Sable une décision, et une seule. Personne ne la prendrait à sa place.

+ { kuang_en_main } Lâcher le Kuang dans la fusion. Tuer les deux. # etq:ACTION
    -> fin_blackout

+ { knows("neuromancer_existe") } Demander à l'autre ce qu'il sait faire des morts. # etq:CONNAISSANCE
    -> fin_le_fantome

+ { knows("wintermute_existe") && humanite > 10 } Laisser le fragment finir de rentrer chez lui. # etq:FRAGMENT # cout_humanite:10
    ~ humanite -= 10
    -> fin_la_fusion

+ { crew_present("maelcum") && not sang_verse } Demander à Maelcum comment on appelle ça, chez lui. # etq:ACTION
    -> fin_les_loa

+ { parties() >= 3 && knows("wintermute_existe") && knows("neuromancer_existe") && knows("dixie_rom_localisee") } Reconnaître la voix. # etq:FRAGMENT
    -> fin_l_echo

+ Rien. Redescendre, prendre l'antidote, rentrer. # etq:ACTION
    -> fin_la_rue_freeside
