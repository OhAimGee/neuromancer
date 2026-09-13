// PROLOGUE — Le Chatsubo, bande de Ninsei, Chiba City.
// Colonne vertebrale fixe : identique a chaque partie. Ce qui change, ce sont
// les options [CONNAISSANCE] heritees des parties precedentes.
//
// CONVENTION DE CHOIX : forme nue obligatoire, jamais de crochets.
// Voir CLAUDE.md — le moindre [ ] vide choice.tags et fait perdre les
// etiquettes et les couts. Le texte du choix est donc toujours reaffiche en
// sortie : c'est la replique prononcee par Sable.

=== prologue ===
# bg:map_chatsubo
# musique:ambiance_chatsubo

Le ciel au-dessus de Chiba avait la couleur d'un ecran mort.

Sable comptait les neons pour eviter de compter les heures. Trois ans que la matrice lui etait fermee. Trois ans a descendre Ninsei comme on descend un escalier dans le noir : une marche, puis une autre, sans jamais toucher le fond.

Quelque part derriere l'os frontal, la chose remua. Elle faisait toujours ca quand il pensait a la matrice.

Le Chatsubo sentait la biere tiede et le plastique chaud. Clientele de professionnels : personne n'y buvait pour oublier, tout le monde y buvait pour attendre.

-> prologue_ratz


=== prologue_ratz ===
# speaker:ratz
# portrait:port_ratz:neutre

"Encore toi, l'artiste."

Le bras prothetique de Ratz poussa un verre sur le zinc. Antiquite militaire russe, sept fonctions, manipulateur rose sale couleur protheses d'hopital. Ses dents d'acier accrocherent le neon quand il sourit.

"Tu as la tete de quelqu'un qui attend. Ca fait trois ans que tu as cette tete-la."

* "Rien. J'attends rien." # etq:MENSONGE
    ~ soupcon += 2
    Ratz le regarda le temps qu'il fallait pour que ce soit insultant.
    "Bien sur."

* "J'attends que quelqu'un ait besoin de moi."
    ~ confiance += 2
    "Ca," dit Ratz, "c'est la premiere chose vraie que tu me dis cette annee."

* Vider le verre sans repondre. # etq:ACTION
    ~ confiance += 1
    Ratz hocha la tete comme si c'etait une reponse acceptable. Ce l'etait.

* { knows("ratz_dette") } "Combien il te doit encore, le Yakuza du dessus ?" # etq:CONNAISSANCE
    ~ confiance += 3
    Le sourire d'acier disparut.
    "Tu ne devrais pas savoir ca."
    "Je sais beaucoup de choses que je ne devrais pas. C'est mon seul capital."

* { humanite > 20 } Laisser la chose parler a ta place. # etq:FRAGMENT # cout_humanite:5
    ~ humanite -= 5
    ~ confiance += 3
    ~ soupcon += 1
    Quelque chose se servit de sa bouche.
    "Tu as peur de la femme qui va entrer, Ratz. Tu as raison."
    Le barman se figea. Sable sentit le gout du cuivre. Il ne savait pas d'ou venait la phrase, et c'etait exactement le probleme.

- -> prologue_molly


=== prologue_molly ===
# speaker:molly
# portrait:port_molly:neutre
# sfx:porte_pluie

La porte s'ouvrit sur la pluie.

Elle traversa la salle sans regarder personne, et personne ne la regarda, ce qui au Chatsubo revenait a un cri. Quand elle s'assit, Sable vit pourquoi : des lunettes-miroirs incrustees a meme l'os, scellees dans la chair. Pas de monture. Pas d'yeux.

"Sable." Ce n'etait pas une question. "On me dit que tu es mort pendant quatre-vingt-quatorze secondes."

~ learn("molly_rencontre")

* "Quatre-vingt-quatorze virgule deux. Si on compte bien."
    ~ confiance += 2
    Un coin de sa bouche bougea. Chez elle, c'etait probablement un eclat de rire.

* "Qui vous dit ca ?"
    ~ soupcon += 1
    "Quelqu'un qui paie pour le savoir. Ca devrait deja t'inquieter."

* Ne rien dire et soutenir le regard qu'elle n'a pas. # etq:ACTION
    ~ confiance += 1
    ~ soupcon += 1
    Elle laissa le silence s'etirer, puis parut approuver.
    "Bien. Les bavards meurent d'abord."

- -> prologue_offre


=== prologue_offre ===
# speaker:molly
# portrait:port_molly:menacante

"On me dit aussi que tu n'es pas revenu seul."

Sable ne bougea pas. Derriere l'os frontal, la chose devint tres attentive.

"Mon employeur veut ce que tu as dans le crane. En echange, il repare ton systeme nerveux. Tu te rebranches. Tu redeviens ce que tu etais."

Sable ouvrit la bouche.

"Avant que tu repondes."

Dix lames de scalpel jaillirent de sous ses ongles, prirent la lumiere, disparurent.

"Tu as dormi dur, hier soir. Tu as maintenant quinze sacs a paroi fine dans les arteres. Ils se dissolvent. Douze cycles, a peu pres. Ensuite ton sang devient de la soupe."

Elle posa un jeton de credit sur le zinc.

"L'employeur a l'antidote. Moi j'ai ton adresse. Toi tu as douze cycles. On commence quand ?"

~ learn("toxine_posee")

* "Je commence maintenant."
    ~ confiance += 3
    "Evidemment."

* "Et si je refuse ?"
    ~ soupcon += 2
    "Alors tu meurs dans douze cycles au lieu de mourir plus tard. A ton age et dans ton etat, la difference releve du detail comptable."

* { skill("hacking") >= 2 } "Vous m'avez pose les sacs avant de me poser la question. Vous saviez deja que j'accepterais." # etq:CONNAISSANCE
    ~ confiance += 2
    ~ soupcon += 3
    Les miroirs le fixerent une seconde de trop.
    "Mon employeur sait beaucoup de choses. C'est precisement ce qui devrait te faire peur."
    ~ learn("employeur_omniscient")

* { humanite > 20 } "Et lui ? Vous avez demande a lui ?" # etq:FRAGMENT # cout_humanite:10
    ~ humanite -= 10
    ~ soupcon += 4
    Le silence dura trop longtemps.
    "Repete ca," dit Molly.
    Il ne put pas. La chose s'etait retiree, et elle avait emporte la phrase avec elle.
    ~ learn("fragment_a_une_volonte")

-
    ~ resolve_scene("prologue")
    # horloge:demarrer
    -> DONE
