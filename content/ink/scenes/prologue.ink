// PROLOGUE — Le Chatsubo, bande de Ninsei, Chiba City.
// Colonne vertébrale fixe : identique à chaque partie. Ce qui change, ce sont
// les options [CONNAISSANCE] héritées des parties précédentes.
//
// CONVENTION DE CHOIX : forme nue obligatoire, jamais de crochets.
// Voir CLAUDE.md — le moindre [ ] vide choice.tags et fait perdre les
// étiquettes et les coûts. Le texte du choix est réaffiché en sortie : c'est la
// réplique prononcée par Sable, et c'est l'interface qui lui ajoute son tiret.
//
// CONVENTION DE DIALOGUE : tiret cadratin, jamais de guillemets « ».
// Jersey 10 rend « » sous la forme de doubles chevrons.

=== prologue ===
# bg:map_chatsubo
# musique:ambiance_chatsubo
# entracte:TROIS ANS PLUS TARD

Le ciel au-dessus de Chiba avait la couleur d'un écran mort.

Sable comptait les néons pour éviter de compter les heures. Trois ans que la matrice lui était fermée. Trois ans à descendre Ninsei comme on descend un escalier dans le noir : une marche, puis une autre, sans jamais toucher le fond.

Quelque part derrière l'os frontal, la chose remua. Elle faisait toujours ça quand il pensait à la matrice.

Le Chatsubo sentait la bière tiède et le plastique chaud. Clientèle de professionnels : personne n'y buvait pour oublier, tout le monde y buvait pour attendre.

-> prologue_ratz


=== prologue_ratz ===
# speaker:ratz
# portrait:port_ratz:neutre

— Encore toi, l'artiste.

Le bras prothétique de Ratz poussa un verre sur le zinc. Antiquité militaire russe, sept fonctions, manipulateur rose sale couleur prothèses d'hôpital. Ses dents d'acier accrochèrent le néon quand il sourit.

— Tu as la tête de quelqu'un qui attend. Ça fait trois ans que tu as cette tête-là.

* Rien. J'attends rien. # etq:MENSONGE
    ~ soupcon += 2
    Ratz le regarda le temps qu'il fallait pour que ce soit insultant.
    — Bien sûr.

* J'attends que quelqu'un ait besoin de moi.
    ~ confiance += 2
    — Ça, dit Ratz, c'est la première chose vraie que tu me dis cette année.

* Vider le verre sans répondre. # etq:ACTION
    ~ confiance += 1
    Ratz hocha la tête comme si c'était une réponse acceptable. Ce l'était.

* { knows("ratz_dette") } Combien il te doit encore, le Yakuza du dessus ? # etq:CONNAISSANCE
    ~ confiance += 3
    Le sourire d'acier disparut.
    — Tu ne devrais pas savoir ça.
    Je sais beaucoup de choses que je ne devrais pas. C'est mon seul capital.

* { humanite > 20 } Laisser la chose parler à ta place. # etq:FRAGMENT # cout_humanite:5
    ~ humanite -= 5
    ~ confiance += 3
    ~ soupcon += 1
    Quelque chose se servit de sa bouche.
    — Tu as peur de la femme qui va entrer, Ratz. Tu as raison.
    Le barman se figea. Sable sentit le goût du cuivre. Il ne savait pas d'où venait la phrase, et c'était exactement le problème.

- -> prologue_molly


=== prologue_molly ===
# speaker:molly
# portrait:port_molly:neutre
# sfx:porte_pluie

La porte s'ouvrit sur la pluie.

Elle traversa la salle sans regarder personne, et personne ne la regarda, ce qui au Chatsubo revenait à un cri. Quand elle s'assit, Sable vit pourquoi : des lunettes-miroirs incrustées à même l'os, scellées dans la chair. Pas de monture. Pas d'yeux.

— Sable.

Ce n'était pas une question.

— On me dit que tu es mort pendant quatre-vingt-quatorze secondes.

~ learn("molly_rencontre")

* Quatre-vingt-quatorze virgule deux. Si on compte bien.
    ~ confiance += 2
    Un coin de sa bouche bougea. Chez elle, c'était probablement un éclat de rire.

* Qui vous dit ça ?
    ~ soupcon += 1
    — Quelqu'un qui paie pour le savoir. Ça devrait déjà t'inquiéter.

* Ne rien dire et soutenir le regard qu'elle n'a pas. # etq:ACTION
    ~ confiance += 1
    ~ soupcon += 1
    Elle laissa le silence s'étirer, puis parut approuver.
    — Bien. Les bavards meurent d'abord.

- -> prologue_offre


=== prologue_offre ===
# speaker:molly
# portrait:port_molly:menacante

— On me dit aussi que tu n'es pas revenu seul.

Sable ne bougea pas. Derrière l'os frontal, la chose devint très attentive.

— Mon employeur veut ce que tu as dans le crâne. En échange, il répare ton système nerveux. Tu te rebranches. Tu redeviens ce que tu étais.

Sable ouvrit la bouche.

— Avant que tu répondes.

Dix lames de scalpel jaillirent de sous ses ongles, prirent la lumière, disparurent.

— Tu as dormi dur, hier soir. Tu as maintenant quinze sacs à paroi fine dans les artères. Ils se dissolvent. Douze cycles, à peu près. Ensuite ton sang devient de la soupe.

Elle posa un jeton de crédit sur le zinc.

— L'employeur a l'antidote. Moi j'ai ton adresse. Toi tu as douze cycles. On commence quand ?

~ learn("toxine_posee")

* Je commence maintenant.
    ~ confiance += 3
    — Évidemment.

* Et si je refuse ?
    ~ soupcon += 2
    — Alors tu meurs dans douze cycles au lieu de mourir plus tard. À ton âge et dans ton état, la différence relève du détail comptable.

* { skill("hacking") >= 2 } Vous m'avez posé les sacs avant de me poser la question. Vous saviez déjà que j'accepterais. # etq:CONNAISSANCE
    ~ confiance += 2
    ~ soupcon += 3
    Les miroirs le fixèrent une seconde de trop.
    — Mon employeur sait beaucoup de choses. C'est précisément ce qui devrait te faire peur.
    ~ learn("employeur_omniscient")

* { humanite > 20 } Et lui ? Vous avez demandé à lui ? # etq:FRAGMENT # cout_humanite:10
    ~ humanite -= 10
    ~ soupcon += 4
    Le silence dura trop longtemps.
    — Répète ça, dit Molly.
    Il ne put pas. La chose s'était retirée, et elle avait emporté la phrase avec elle.
    ~ learn("fragment_a_une_volonte")

-
    Molly se leva. Elle ne lui laissa pas le temps de décider s'il avait accepté.

    — Première chose. Il me faut un nom : celui de l'homme qui a payé pour te retrouver. Il dort dans les registres d'une corpo de Ninsei, et tu es assis à trente mètres d'un point d'accès.

    Elle désigna le fond de la salle du menton.

    — La cabine, là-bas. Elle est vieille, elle est lente, et elle ne mène pas loin. C'est tout ce que tu as. Rapporte-moi quelque chose avant que je change d'avis sur ton utilité.

    ~ learn("contrat_accepte")
    ~ resolve_scene("prologue")
    # horloge:demarrer
    -> DONE
