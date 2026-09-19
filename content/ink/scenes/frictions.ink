// Les scenes de friction — deux equipiers, une piece, trois jours de navette.
//
// C'est l'astuce economique du design : six candidats pour trois places font
// vingt équipes, et une scene par PAIRE en couvre beaucoup plus qu'une scene
// par personne. Elles ne se jouent qu'a Freeside, une seule par partie, et
// c'est voulu — deux disputes d'affilee feraient une sitcom.
//
// Elles ont un cout mecanique leger et un cout narratif reel : ce qu'on y
// apprend se garde (learn) et reparait dans les parties suivantes.
//
// Tunnel : `-> frictions ->`. Tous les choix COLLES, voir equipage.ink.

=== frictions ===
{ friction_jouee: ->-> }
~ friction_jouee = true
{
  - crew_present("riviera") && crew_present("molly"): -> f_riviera_molly
  - crew_present("riviera") && crew_present("maelcum"): -> f_riviera_maelcum
  - crew_present("dixie") && crew_present("molly"): -> f_dixie_molly
  - crew_present("dixie") && crew_present("yonderboy"): -> f_dixie_yonderboy
  - crew_present("finn") && crew_present("yonderboy"): -> f_finn_yonderboy
  - crew_present("maelcum") && crew_present("yonderboy"): -> f_maelcum_yonderboy
  - else: ->->
}

// --- RIVIERA + MOLLY : elle sait ce qu'il est, il sait qu'elle le sait ------

= f_riviera_molly
# bg:map_freeside
Trois jours de navette, et Riviera avait passé le troisième a projeter des choses dans le couloir pour voir qui regardait.
# speaker:molly
— Une fois de plus et je te coupe les mains. Pas pour t'arrêter. Pour voir la tête que tu fais quand tu ne peux plus rien montrer.
# speaker:riviera
— Vous dites ça comme si c'était une menace. Vous ne savez pas encore ce que je peux montrer avec une seule main.

+ Molly, il nous fait entrer. Garde tes lames pour la Villa.
    ~ soupcon += 2
    # speaker:molly
    — Je les garde. Je compte aussi.
    Elle ne le regarda plus du voyage, ce qui, avec ses lentilles, ne se voit pas et se sent très bien.
    ~ learn("molly_surveille_riviera")
    ->->

+ Riviera, arrête. Tout de suite. # etq:MENACE
    ~ confiance += 2
    # speaker:riviera
    Il sourit, et il s'arrêta, ce qui était pire.
    — Comme vous voudrez. Je garde ça pour un moment où ça servira davantage.
    ~ learn("riviera_attend_son_moment")
    ->->

+ Laisser faire. Regarder ce qu'il sait faire. # etq:FRAGMENT # geste # cout_humanite:10
    ~ humanite -= 10
    Sable regarda jusqu'au bout. Il y avait quelque chose dans le crâne qui trouvait ça instructif, et c'était bien le problème.
    ~ boost_competence("social")
    ~ learn("riviera_a_un_public")
    ->->

// --- RIVIERA + MAELCUM : la foi contre le spectacle de la douleur -----------

= f_riviera_maelcum
# bg:map_freeside
# speaker:maelcum
— Cet homme fabrique de la souffrance pour le plaisir des yeux. Chez nous ça a un nom, et ce nom n'est pas un métier.
# speaker:riviera
— Chez vous on appelle Babylone tout ce qu'on ne comprend pas. C'est commode. Ça évite d'avoir à regarder.

+ Maelcum a raison, et on l'emmène quand même.
    # speaker:maelcum
    — Je sais. C'est pour ça que je viens : quelqu'un doit savoir ce qui se passe et ne pas trouver ça normal.
    ~ learn("maelcum_temoin")
    ->->

+ { crew_present("molly") } Vous réglerez ça après. Molly, sépare-les.
    # speaker:molly
    — Je ne sépare pas. Je choisis.
    Elle se plaça entre eux, dos à Maelcum, et la conversation fut terminée.
    ~ learn("molly_a_choisi")
    ->->

+ Vous avez tous les deux raison. C'est ça le problème.
    ~ confiance += 1
    Ils le regardèrent tous les deux, et pour une fois ils eurent l'air d'accord sur quelque chose.
    ->->

// --- DIXIE + MOLLY : elle a travaille avec l'original ----------------------

= f_dixie_molly
# bg:map_freeside
Molly avait branché la cassétte sur un moniteur de coursive et ne disait rien depuis dix minutes.
# speaker:dixie
— Salut. Je te connais ?
# speaker:molly
— Non.
# speaker:dixie
— Dommage. J'aurais aimé.
Elle débrancha. C'était la quatrième fois qu'elle posait la question, et la quatrième fois qu'il répondait la même chose.

+ Tu l'as connu.
    # speaker:molly
    — J'ai connu quelqu'un qui avait cette voix. Ce n'est pas pareil et ce ne le sera jamais.
    — Quand ce sera fini, tu l'effaces. Ne me fais pas te le demander deux fois.
    ~ learn("molly_veut_effacer_dixie")
    ->->

+ Ne le rebranche pas.
    ~ soupcon += 1
    # speaker:molly
    — Je le rebrancherai autant de fois qu'il faudra. C'est mon affaire.
    ->->

+ { knows("dixie_rom_localisee") } Il existe d'autres copies. # etq:CONNAISSANCE
    # speaker:molly
    Long silence.
    — Alors l'effacer ne veut rien dire, et il est mort pour rien autant de fois qu'il y a de casséttes.
    ~ learn("dixie_est_multiple")
    ->->

// --- DIXIE + YONDERBOY : le mort et celui qui n'a jamais rien risqué -------

= f_dixie_yonderboy
# bg:map_freeside
# speaker:yonderboy
— Un construct. Vrai construct, pas une simulation de salon. Tu sais combien ça vaut, sur le marché des Modernes ?
# speaker:dixie
— Je sais combien ça coûte. Ce n'est pas le même chiffre et c'est moi qui l'ai payé.

+ Il n'est pas à vendre.
    ~ confiance += 2
    # speaker:yonderboy
    — Tout est à vendre. Mais d'accord. C'est plus intéressant comme ça.
    ~ learn("yonderboy_a_une_idee")
    ->->

+ Combien ? # etq:MENSONGE
    ~ soupcon += 3
    # speaker:yonderboy
    Il rit et ne répondit pas, parce qu'une question pareille n'a pas besoin de réponse pour changer une équipe.
    ~ learn("yonderboy_sait_que_tu_vends")
    ->->

// --- FINN + YONDERBOY : le commerce contre le spectacle --------------------

= f_finn_yonderboy
# bg:map_freeside
# speaker:finn
— Une émeute. Il veut une émeute. Tu sais ce que coûte une émeute quand on tient boutique après ?
# speaker:yonderboy
— Tu ne tiendras pas boutique après. Personne ne tient rien après. C'est bien ça, l'intérêt.

+ On fait ça propre. Le Finn a raison.
    ~ approche_mode = "social"
    # speaker:yonderboy
    — Propre. D'accord. Je m'ennuierai, et un Moderne qui s'ennuie est un problème que tu découvriras plus tard.
    ~ learn("yonderboy_s_ennuie")
    ->->

+ On fait du bruit. Beaucoup. # etq:ACTION
    ~ approche_mode = "furtivite"
    # speaker:finn
    — Alors je reste sur le bateau et je compte ce que vous me devez. C'est un métier aussi.
    ~ learn("finn_reste_en_arriere")
    ->->

// --- MAELCUM + YONDERBOY : deux facons de refuser le monde -----------------

= f_maelcum_yonderboy
# bg:map_freeside
# speaker:yonderboy
— Babylone tombe, frère. C'est bien ce que tu chantes ? Nous, on la fait tomber. On ne l'attend pas.
# speaker:maelcum
— Vous casséz une vitrine et vous rentrez chez vous. Ce n'est pas la même chose que de vivre dehors.

+ Vous voulez la même chose et vous ne le saurez jamais.
    ~ confiance += 1
    Ils se turent tous les deux, ce qui n'est pas un accord, mais qui y ressemble de loin.
    ~ learn("zion_et_les_modernes")
    ->->

+ Personne ne fait tomber personne. On entre, on sort. # etq:ACTION
    # speaker:yonderboy
    — Quel dommage.
    # speaker:maelcum
    — Quelle chance.
    ->->
