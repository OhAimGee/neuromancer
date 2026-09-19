// La boutique du Finn — receleur. On y vend ce qu'on a volé, on y achète de
// quoi voler mieux, et on y trouve une arrière-boutique qui mène plus loin
// que la cabine du Chatsubo.
//
// Le comptoir n'est plus une liste de choix : `ouvrir_boutique` rend la main au
// jeu, qui l'affiche avec ses prix côte à côte, ses icônes et ses effets
// chiffrés. Ce qui reste ici, ce sont les SCÈNES — le testament, l'antidote, le
// recrutement, la cabine. Une transaction n'est pas une scène.

=== finn ===
# bg:map_finn # musique:ambiance_ninsei
La boutique du Finn tenait dans un couloir. Des étagères, un comptoir, et derrière le comptoir un homme qui n'avait jamais été jeune.
# speaker:finn
{&— Tiens. Le mort.|— Encore toi. Tu as toujours cette tête de facture impayée.|— Referme derrière toi. Le couloir écoute.}
-> finn_menu

= finn_menu
+ Montre-moi ce que tu as sous le comptoir.
    -> finn_comptoir

+ { knows("lady_3jane_testament") } Le testament de Lady 3Jane. Tu l'achètes combien ? # etq:CONNAISSANCE
    -> finn_testament

+ { knows("antidote_formule") } J'ai la formule d'un antidote. Tu peux le fabriquer ? # etq:CONNAISSANCE
    -> finn_antidote

+ { not crew_present("finn") } Ferme la boutique et viens avec moi. Une fois.
    -> finn_recrutement ->
    -> finn_menu

+ { not crew_present("dixie") } McCoy Pauley. Le Dixie. On dit que tu sais où est sa ROM.
    -> dixie ->
    -> finn_menu

+ Prête-moi le deck du fond.
    -> finn_cabine

+ Je remonte.
    -> hub

= finn_comptoir
# speaker:finn
{&— Sous le comptoir, il n'y a que ce que tu peux payer.|— Prends ton temps. Le compteur, lui, en prend aussi.}
~ ouvrir_boutique("finn", "finn.retour_comptoir")
-> DONE

= retour_comptoir
# bg:map_finn
Le Finn remit la boîte sous le comptoir, du pied, sans quitter Sable des yeux.
-> finn_menu

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
