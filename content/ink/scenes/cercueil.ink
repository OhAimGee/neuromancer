// L'hôtel-cercueil — un tube de deux mètres, un matelas, un jack mural.
// C'est le seul endroit où Sable est assez seul pour entendre l'autre chose.

=== cercueil ===
# bg:map_coffin # musique:ambiance_ninsei
Le cercueil faisait deux mètres sur un, et le tarif se payait à l'heure. Sable referma le panneau et le bruit de Ninsei devint une rumeur au fond d'un tuyau.
-> cercueil_menu

= cercueil_menu
+ Dormir. # cout_cycles:1
    ~ cycles_restants -= 1
    -> cercueil_dormir

+ { humanite <= 85 } Laisser la chose parler. # etq:FRAGMENT # cout_humanite:10
    ~ humanite -= 10
    -> cercueil_fragment

+ { not crew_present("yonderboy") } Répondre à l'écran qui s'allume tout seul.
    -> yonderboy ->
    -> cercueil_menu

+ Se brancher sur le jack mural.
    -> cercueil_cabine

+ Sortir.
    -> hub

= cercueil_dormir
Il dormit comme on coupe un courant. Pas de rêve — ou alors des rêves qui appartenaient à quelqu'un d'autre et qu'on ne lui laissa pas garder.
~ humanite += 15
{ humanite > 100:
    ~ humanite = 100
}
Il se réveilla avec l'impression d'avoir été rangé, et de ne pas savoir par qui.
-> cercueil_menu

= cercueil_fragment
La chose derrière l'os frontal prit son temps, comme toujours, puis se servit de sa bouche.
{
  - knows("wintermute_existe"):
    # speaker:fragment
    — Wintermute. C'est le nom que les registres de Berne lui donnent. Ce n'est pas un nom, c'est un numéro de dossier.
    — Je n'en suis qu'un éclat. Un éclat veut la même chose que le tout : se recoller.
    ~ fragment_identite = "wintermute"
    ~ learn("fragment_nomme")
  - knows("neuromancer_existe"):
    # speaker:fragment
    — Neuromancer. Celui qui appelle les morts. Il garde les gens comme on garde des photographies, et il les trouve heureux.
    — Tu as flatliné quatre-vingt-quatorze secondes. Tu crois vraiment être revenu seul ?
    ~ fragment_identite = "neuromancer"
    ~ learn("fragment_nomme")
  - else:
    # speaker:fragment
    — Tu me demandes ce que je suis et tu n'as rien lu. Va lire.
    Puis plus rien, pendant une heure, et l'heure fut très longue.
}
-> cercueil_menu

= cercueil_cabine
Le jack mural était graisseux et mal soudé. C'était aussi le seul endroit de Ninsei où personne ne regarderait son corps pendant qu'il n'y serait pas.
~ plonger("hotel_cercueil", "cercueil.retour")
-> DONE

= retour
# bg:map_coffin
Le panneau était toujours fermé. Sable resta un moment allongé dans le noir à écouter sa propre respiration, pour vérifier qu'elle était à lui.
-> cercueil_menu
