// Le hub — la bande de Ninsei entre deux plongees.
//
// Tout repasse par `hub` : c'est la que l'horloge est relue, et c'est ou le
// moteur revient apres une plongee quand le recit ne dit pas autrement. Les
// choix sont colles (+) : un lieu ne disparait pas parce qu'on y est alle.

=== hub ===
{ cycles_restants <= 0: -> fin_toxine }
-> hub_menu

= hub_menu
# bg:map_chatsubo
{ hub_menu == 1:
    Le jeton de crédit de Molly était toujours sur le zinc. Sable ne l'avait pas pris, et personne d'autre n'y avait touché : au Chatsubo on sait à quoi ressemble un piège.
    Douze cycles. Il fallait un nom, et le nom dormait derrière de la glace. # glose:horloge
  - else:
    {&Dehors, la pluie de Ninsei tombait sur le néon et n'éteignait rien.|Le Chatsubo n'avait ni fenêtre ni horloge. Sable comptait quand même.|Quelque part sous sa peau, quinze poches se dissolvaient à leur rythme.|Ratz essuyait un verre avec un chiffon plus sale que le verre.}
}

+ Se brancher sur la cabine du fond.
    -> hub_cabine

+ Descendre chez le Finn. # cout_cycles:1
    ~ cycles_restants -= 1
    -> finn

+ Monter à l'hôtel-cercueil. # cout_cycles:1
    ~ cycles_restants -= 1
    -> cercueil

+ Appeler Molly.
    -> molly_appel

+ Parler à Ratz.
    -> hub_ratz

= hub_cabine
La cabine était vieille de vingt ans et sentait le plastique cuit. Sable posa les trodes sur ses tempes et laissa la surface venir à lui.
~ plonger("chatsubo", "hub.retour")
-> DONE

// Retour de plongee. Le recit commente ce que Sable a ramene, puis rend la
// main au hub — l'horloge y sera relue.
= retour
# bg:map_chatsubo
Il revint dans son corps par la nuque, comme toujours, avec le goût de cuivre et une minute de retard sur ses propres mains.
{ knows("identite_employeur"):
    Un nom. Il l'avait. Il aurait préféré ne pas l'avoir.
  - else:
    Rien qui ressemblait à un nom. La cabine ne menait pas assez loin, et Molly le savait en le disant.
}
-> hub

= hub_ratz
# speaker:ratz
— Tu as la tête de quelqu'un qui a vu le fond d'une base de données.
{&— Bois quelque chose. Ça ne t'aidera pas.|— Le bar ne fait pas crédit aux morts. Tu es encore debout, donc tu paies.|— Trois clients ont demandé après toi ce soir. Aucun n'a laissé de nom.}

+ { not knows("identite_employeur") } Tu connais un moyen d'aller plus profond que la cabine ?
    ~ soupcon += 1
    # speaker:ratz
    — Il y a une borne publique sur Ninsei et une arrière-boutique chez le Finn.
    — La borne est gratuite et surveillée. Le Finn est payant et ne surveille rien. Choisis ton poison, l'artiste.

+ { knows("lady_3jane_testament") } Ce que je porte vaut cher. À qui on vend ça, ici ? # etq:CONNAISSANCE
    # speaker:ratz
    — Pas à moi. Je vends de la bière tiède.
    — Le Finn achète tout ce qui n'a pas de propriétaire vivant. Descends, et ne lui dis pas que tu sais ce que ça vaut.

+ Rien. Sortir.

- -> hub
