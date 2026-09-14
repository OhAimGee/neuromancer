// La boutique du Finn — receleur. On y vend ce qu'on a volé, on y achète de
// quoi voler mieux, et on y trouve une arrière-boutique qui mène plus loin
// que la cabine du Chatsubo.

=== finn ===
# bg:map_finn
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
