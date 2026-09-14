// La boutique du Finn — receleur. On y vend ce qu'on a volé, on y achète de
// quoi voler mieux, et on y trouve une arrière-boutique qui mène plus loin
// que la cabine du Chatsubo.

=== finn ===
# bg:map_finn # musique:ambiance_ninsei
La boutique du Finn tenait dans un couloir. Des étagères, un comptoir, et derrière le comptoir un homme qui n'avait jamais été jeune.
# speaker:finn
{&— Tiens. Le mort.|— Encore toi. Tu as toujours cette tête de facture impayée.|— Referme derrière toi. Le couloir écoute.}
-> finn_menu

= finn_menu
+ { knows("lady_3jane_testament") } Le testament de Lady 3Jane. Combien ? # etq:CONNAISSANCE
    -> finn_testament

+ { knows("antidote_formule") } J'ai la formule d'un antidote. Tu peux le fabriquer ? # etq:CONNAISSANCE
    -> finn_antidote

+ { credits >= 800 } Acheter un MIMIC. Huit cents. # cout_credits:800
    ~ credits -= 800
    ~ acquerir_script("mimic")
    # speaker:finn
    — Il ne casse rien. Il te rend ennuyeux, et un opérateur ennuyeux vit plus vieux qu'un opérateur doué.
    -> finn_menu

+ { credits >= 1200 } Acheter une BOUCLE. Mille deux cents. # cout_credits:1200
    ~ credits -= 1200
    ~ acquerir_script("boucle")
    # speaker:finn
    — Trois ticks où la trace oublie de compter. Trois. Pas quatre. Les gens meurent sur le quatrième.
    -> finn_menu

+ { not crew_present("finn") } Lui proposer de fermer boutique.
    -> finn_recrutement ->
    -> finn_menu

+ { not crew_present("dixie") } Parler d'un mort qui se souvient.
    -> dixie ->
    -> finn_menu

+ Faire poser quelque chose.
    -> finn_atelier

+ Se brancher sur l'arrière-boutique.
    -> finn_cabine

+ Remonter.
    -> hub

= finn_testament
# speaker:finn
— Doucement. Ne dis pas ce nom ici, dis-le à voix basse et dis-le une fois.
Il compta des billets sans les regarder, ce qui voulait dire qu'il les comptait très bien.
~ credits += 1500
— Quinze cents. Et tu ne l'as jamais eu, et je ne l'ai jamais acheté.
-> finn_menu

= finn_antidote
# speaker:finn
— Une formule, c'est du papier. Il me faut la chimie, et la chimie coûte.
{ credits >= 2000:
    ~ credits -= 2000
    ~ antidote_en_poche = true
    — Deux mille. Reviens dans un cycle.
    Il revint dans un cycle. Le Finn posa sur le comptoir une ampoule grise, de la taille d'un ongle.
    — Ça ne te rendra rien. Ça t'empêche seulement de fondre. Ne confonds pas.
  - else:
    — Deux mille crédits. Tu en as {credits}. Reviens quand tu sauras compter.
}
-> finn_menu

// L'atelier — ce que les plans volés deviennent.
//
// Un plan sans atelier est un butin mort : c'est ici que le pillage cesse
// d'être un solde de crédits. Chaque implant se paie trois fois, et la
// troisième monnaie est la seule qu'on ne regagne jamais.
= finn_atelier
# speaker:finn
{&— L'arrière-arrière-boutique. Ne regarde pas le plafond, il y a des taches.|— Rallonge-toi. Ça ira plus vite si tu ne parles pas.}
{ not a_plan("bande_passante") and not a_plan("reflexes_neuraux") and not a_plan("coprocesseur") and not a_plan("filtre_noir") and not a_plan("lentilles_molly") and not a_plan("glandes_toxiques"):
    — Sauf que tu n'as rien à me donner à lire. Vole-moi des plans, et je te vends un corps.
}
-> finn_pose

= finn_pose
+ { a_plan("bande_passante") and not has_implant("bande_passante") and credits >= 1400 and cycles_restants >= 1 and humanite >= 4 } Bande passante. Quatorze cents. # cout_credits:1400 # cout_cycles:1 # cout_humanite:4
    ~ credits -= 1400
    ~ cycles_restants -= 1
    ~ humanite -= 4
    ~ poser_implant("bande_passante")
    # speaker:finn
    — Le temps va te paraître plus large là-dedans. Ce n'est pas une impression, c'est l'horloge qui ment moins.
    -> finn_pose

+ { a_plan("reflexes_neuraux") and not has_implant("reflexes_neuraux") and credits >= 1800 and cycles_restants >= 1 and humanite >= 6 } Réflexes neuraux. Mille huit cents. # cout_credits:1800 # cout_cycles:1 # cout_humanite:6
    ~ credits -= 1800
    ~ cycles_restants -= 1
    ~ humanite -= 6
    ~ poser_implant("reflexes_neuraux")
    # speaker:finn
    — Tu sentiras la trace monter. Ça ne veut pas dire qu'elle ne monte plus. Beaucoup confondent, une fois.
    -> finn_pose

+ { a_plan("coprocesseur") and not has_implant("coprocesseur") and credits >= 2400 and cycles_restants >= 2 and humanite >= 8 } Coprocesseur. Deux mille quatre. # cout_credits:2400 # cout_cycles:2 # cout_humanite:8
    ~ credits -= 2400
    ~ cycles_restants -= 2
    ~ humanite -= 8
    ~ poser_implant("coprocesseur")
    # speaker:finn
    — Un rang de glace en plus. Un. Les gens entendent deux, et on me les ramène en sac.
    -> finn_pose

+ { a_plan("filtre_noir") and not has_implant("filtre_noir") and credits >= 3000 and cycles_restants >= 2 and humanite >= 10 } Filtre noir. Trois mille. # cout_credits:3000 # cout_cycles:2 # cout_humanite:10
    ~ credits -= 3000
    ~ cycles_restants -= 2
    ~ humanite -= 10
    ~ poser_implant("filtre_noir")
    # speaker:finn
    — La première frappe, il la boit. La deuxième, il regarde. Compte jusqu'à une.
    -> finn_pose

+ { a_plan("lentilles_molly") and not has_implant("lentilles_molly") and credits >= 2000 and cycles_restants >= 1 and humanite >= 12 } Lentilles miroir. Deux mille. # cout_credits:2000 # cout_cycles:1 # cout_humanite:12
    ~ credits -= 2000
    ~ cycles_restants -= 1
    ~ humanite -= 12
    ~ poser_implant("lentilles_molly")
    Le Finn scella les lentilles aux orbites et recula d'un pas pour juger son travail.
    # speaker:finn
    — Voilà. Plus personne ne lira rien sur toi. Toi non plus, remarque.
    -> finn_pose

+ { a_plan("glandes_toxiques") and not has_implant("glandes_toxiques") and credits >= 2600 and cycles_restants >= 1 and humanite >= 14 } Glandes toxiques. Deux mille six. # cout_credits:2600 # cout_cycles:1 # cout_humanite:14
    ~ credits -= 2600
    ~ cycles_restants -= 1
    ~ humanite -= 14
    ~ poser_implant("glandes_toxiques")
    # speaker:finn
    — Deux sacs sous la langue. Ne les mords pas en dormant. Ce conseil est compris dans le prix.
    -> finn_pose

+ Se rhabiller.
    -> finn_menu

= finn_cabine
L'arrière-boutique n'avait pas de porte, seulement un rideau de perles et un vieux deck posé sur une caisse de munitions vide.
# speaker:finn
— Ne casse rien et ne reviens pas mort. Les deux me coûtent.
~ plonger("boutique_finn", "finn.retour")
-> DONE

= retour
# bg:map_finn
Sable arracha les trodes. Le Finn n'avait pas bougé, et le rideau de perles oscillait encore.
-> finn_menu
