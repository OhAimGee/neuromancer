// Molly, et ce qui arrive quand on a le nom.
//
// C'est le seul chemin vers la fin negociee. Sans le nom, Molly n'a rien a
// dire, et l'horloge continue de descendre.

=== molly_appel ===
# bg:map_chatsubo
Il n'y avait pas de numéro. Il y avait une phrase à dire au barman, et Molly arrivait quand elle voulait bien arriver.
# speaker:molly
{&— Parle.|— Tu as huit secondes avant que je raccroche.|— Dis-moi quelque chose que je ne sais pas.}

+ { knows("identite_employeur") } J'ai le nom. Armitage. # etq:CONNAISSANCE
    -> molly_nom

+ { knows("dossier_medical_armitage") } Ton employeur s'appelait Corto avant. Il a un dossier médical long comme le bras. # etq:CONNAISSANCE
    ~ confiance += 3
    # speaker:molly
    — Je sais.
    — Ce que tu dois savoir, toi, c'est qu'un homme reconstruit à partir d'un autre homme n'a aucune raison de tenir parole. Garde ça pour le moment où tu le verras.
    -> molly_appel

+ { knows("villa_straylight_plan") } Tu travailles pour quelqu'un qui prépare une entrée par la Villa Straylight. # etq:CONNAISSANCE
    ~ soupcon += 3
    # speaker:molly
    Long silence. Le genre où quelqu'un décide s'il va vous tuer plus tard.
    — Tu es allé chercher très loin pour un homme qui ne peut plus plonger profond.
    — Ne redis jamais ce nom sur une ligne ouverte.
    -> molly_appel

+ { not knows("identite_employeur") } Rien encore.
    # speaker:molly
    — Alors tu me fais perdre un cycle, et tu n'en as pas tant que ça.
    -> hub

+ Raccrocher.
    -> hub

= molly_nom
~ confiance += 5
# speaker:molly
Elle ne demanda pas où il l'avait pris.
— Armitage. Bien. Il veut te voir, et maintenant tu sais assez pour que ça t'inquiète.
— Entrepôt neuf, bassin de Ninsei, dans un cycle. Il apporte l'antidote. Tu apportes ce que tu as dans le crâne.
~ learn("rendez_vous_obtenu")
~ resolve_scene("molly_nom")
-> rendez_vous

=== rendez_vous ===
# bg:map_entrepot # musique:ambiance_ninsei
~ cycles_restants -= 1
L'entrepôt sentait le sel et le béton neuf. Armitage se tenait debout au milieu, très droit, comme un homme qui a appris la station debout dans une armée qui n'existe plus.
# speaker:armitage
— Vous avez le fichier. Je le vois à la façon dont vous tenez votre tête.
Il ouvrit une mallette. À l'intérieur, une seule ampoule grise.

+ Donner le fragment. Prendre l'ampoule. Rentrer.
    -> fin_la_rue

+ Demander ce qu'il y a après. # etq:ACTION
    -> rendez_vous_contrat

+ { knows("operation_poing_hurlant") } Poing Hurlant. Vous y étiez, colonel. Vous en êtes le seul revenu. # etq:CONNAISSANCE
    -> rendez_vous_corto

+ { antidote_en_poche } Garder le fragment. J'ai déjà mon antidote. # etq:ACTION
    -> fin_la_rue_seul

+ { humanite > 20 } Laisser la chose répondre à ma place. # etq:FRAGMENT # cout_humanite:15
    ~ humanite -= 15
    -> rendez_vous_fragment

= rendez_vous_corto
~ soupcon += 5
# speaker:armitage
Le visage ne bougea pas. C'était ça, le pire : le visage ne bougeait jamais.
— Ce nom appartient à un dossier fermé.
— Mais puisque vous l'avez ouvert : oui. Ils m'ont envoyé mourir sur un point d'accès et j'ai mis trois ans à comprendre que j'étais mort.
~ learn("armitage_est_corto")
— Prenez l'ampoule. Nous nous reverrons, et ce jour-là vous travaillerez pour la même chose que moi. Vous ne saurez simplement pas laquelle.
-> fin_la_rue

= rendez_vous_fragment
Quelque chose se servit de sa bouche, et cette fois Armitage l'entendit aussi.
# speaker:fragment
— Bonjour. Tu me cherches depuis longtemps et tu me cherchais dans le mauvais crâne.
Armitage recula d'un pas. C'était la première fois que Sable voyait ce corps faire quelque chose qu'il n'avait pas décidé.
# speaker:armitage
— Prenez l'antidote. Sortez. Ceci n'était pas la conversation prévue.
~ learn("armitage_a_peur")
-> fin_la_rue

// La passerelle vers l'acte III. `rendez_vous` etait un cul-de-sac : toutes
// ses branches finissaient dans la rue. Armitage n'a jamais voulu le fragment
// pour lui-meme, et le dire ouvre le run.

= rendez_vous_contrat
# speaker:armitage
— Après, il y a un travail. Celui pour lequel on vous a posé les sacs, puisque vous demandez.
— Freeside. Villa Straylight. Une famille qui ne sort plus depuis deux siècles, et dans cette famille une femme qui connaît un mot.
— Ce que vous portez dans le crâne est la moitié d'une chose. L'autre moitié est là-haut derrière de la glace de rang Kuang, et elle attend depuis plus longtemps que nous deux.
Il referma la mallette sans la donner. C'était la réponse à une question que Sable n'avait pas encore posée.
# speaker:armitage
— L'antidote est au bout du travail. Pas avant. Vous n'avez pas de raison de me croire et vous n'avez pas d'autre option.

+ Accepter. Monter. # etq:ACTION
    ~ learn("contrat_freeside")
    ~ resolve_scene("rendez_vous_contrat")
    -> freeside

+ { antidote_en_poche } Refuser. J'ai mon antidote et vous n'avez plus rien. # etq:ACTION
    -> fin_la_rue_seul

+ Refuser. Prendre l'ampoule et disparaître. # etq:MENACE
    ~ soupcon += 5
    # speaker:armitage
    Il regarda Sable pendant trois secondes et lui tendit la mallette.
    — Comme vous voudrez. On vous retrouvera quand la chose se réveillera, et elle se réveillera.
    -> fin_la_rue
