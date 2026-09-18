-- Interface : logo-titre, horloge de toxine, icones de butin.
--
--   tools/aseprite.sh tools/aseprite/ui.lua
--
-- Ce qui N'EST PAS ici, et volontairement : le cadre de dialogue, les boutons
-- et les jauges. Ils sont faits en CSS, ils tiennent la grille de 10 et de 8,
-- ils se redimensionnent avec `--px`, et les remplacer par du 9-slice ne
-- gagnerait rien qu'un risque de regression. Les assets ci-dessous existent
-- parce qu'aucun CSS ne les ferait : une typographie dessinee, une fiole qui
-- se vide, et quatre pictogrammes.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")

-- ---------------------------------------------------------- LOGO TITRE ----

-- Fonte de titre, 9x13. Huit glyphes suffisent a ecrire NEUROMANCER, et une
-- fonte complete pour onze lettres serait du travail jete.
--
-- La premiere version faisait 96x19 : deux couleurs, une ombre portee droite,
-- et l'allure d'un titre de demo. Le probleme n'etait pas la taille mais
-- l'absence de matiere — un lettrage plat ne devient pas une enseigne en
-- grossissant. Ce qui suit ne dessine donc pas des lettres mais les EROdE :
-- le masque est pose une fois, et chaque passe le regarde pour decider ou est
-- l'arete, ou est l'ombre, et ou le neon deborde.
local GLYPHES = {
  N = { '#####.###', '#####.###', '#####.###', '#####.###',
        '###.#####', '###.#####', '###.#####', '###.#####',
        '###..####', '###..####', '###..####', '###..####', '###..####' },
  E = { '#########', '#########',
        '###......', '###......', '###......',
        '#######..', '#######..', '#######..',
        '###......', '###......', '###......',
        '#########', '#########' },
  U = { '###...###', '###...###', '###...###', '###...###', '###...###',
        '###...###', '###...###', '###...###', '###...###', '###...###',
        '###...###', '.#######.', '..#####..' },
  R = { '#######..', '########.', '###...###', '###...###', '###...###',
        '########.', '#######..', '#####....', '###.##...', '###..##..',
        '###...##.', '###....##', '###....##' },
  O = { '..#####..', '.#######.', '###...###', '###...###', '###...###',
        '###...###', '###...###', '###...###', '###...###', '###...###',
        '###...###', '.#######.', '..#####..' },
  M = { '###...###', '####.####', '#########', '###.#.###', '###.#.###',
        '###...###', '###...###', '###...###', '###...###', '###...###',
        '###...###', '###...###', '###...###' },
  A = { '...###...', '..#####..', '.###.###.', '###...###', '###...###',
        '###...###', '#########', '#########', '###...###', '###...###',
        '###...###', '###...###', '###...###' },
  C = { '..#####..', '.#######.', '###...###', '###......', '###......',
        '###......', '###......', '###......', '###......', '###...###',
        '###...###', '.#######.', '..#####..' },
}

local MOT = 'NEUROMANCER'
local LARGEUR_G, HAUTEUR_G, CHASSE = 9, 13, 11
local LARG_LOGO, HAUT_LOGO = 128, 28
local X0, Y0 = 4, 5
local RAYON_HALO = 3
local BAYER = { 0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5 }

local function logo()
  local sprite = Sprite(LARG_LOGO, HAUT_LOGO)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = 'Logo'
  local img = sprite.cels[1].image

  local function poser(x, y, cle)
    if x >= 0 and y >= 0 and x < LARG_LOGO and y < HAUT_LOGO then
      img:drawPixel(x, y, L.palette.rgba(cle))
    end
  end

  -- Le masque d'abord, le dessin ensuite. Chaque passe interroge le masque au
  -- lieu de redessiner le mot : c'est ce qui permet a l'arete de savoir de quel
  -- cote est le vide.
  local masque = {}
  local function plein(x, y) return masque[y * LARG_LOGO + x] == true end
  for i = 1, #MOT do
    local glyphe = GLYPHES[MOT:sub(i, i)]
    local ox = X0 + (i - 1) * CHASSE
    for y, ligne in ipairs(glyphe) do
      for x = 1, LARGEUR_G do
        if ligne:sub(x, x) == '#' then
          masque[(Y0 + y - 1) * LARG_LOGO + (ox + x - 1)] = true
        end
      end
    end
  end

  -- 1. Le halo cyan, CUIT dans l'image. Un bloom applique au runtime
  -- adoucirait le pixel art ; ici la diffusion est faite de pixels entiers,
  -- pris dans la palette, et elle survit a l'agrandissement en plus proche
  -- voisin.
  --
  -- Le halo est TRAME, et ce n'est pas un ornement. Onze lettres a onze pixels
  -- de chasse laissent deux pixels entre chaque jambage : une diffusion pleine
  -- sur trois pixels se referme d'une lettre a l'autre et le mot se retrouve
  -- pose sur une plaque turquoise opaque — verifie a l'ecran, c'est exactement
  -- ce qui s'est passe. Un damier de Bayer garde la lueur poreuse, donc le ciel
  -- passe au travers et les lettres se detachent encore.
  for y = 0, HAUT_LOGO - 1 do
    for x = 0, LARG_LOGO - 1 do
      if not plein(x, y) then
        local meilleur = 99
        for dy = -RAYON_HALO, RAYON_HALO do
          for dx = -RAYON_HALO, RAYON_HALO do
            if plein(x + dx, y + dy) then
              local d = dx * dx + dy * dy
              if d < meilleur then meilleur = d end
            end
          end
        end
        local seuil = BAYER[(y % 4) * 4 + (x % 4) + 1]
        if meilleur <= 1 then poser(x, y, 'j')
        elseif meilleur <= 4 and seuil < 10 then poser(x, y, 'j')
        elseif meilleur <= 9 and seuil < 6 then poser(x, y, 'i') end
      end
    end
  end

  -- 2. L'ombre portee magenta, un pixel a droite et deux en bas. Une frange ne
  -- marche que si le trait est plus large que le decalage : sur des jambages de
  -- trois pixels, deux passent.
  --
  -- Le decalage horizontal est de UN et non de deux, et c'est la seule valeur
  -- qui marche : la chasse laisse deux pixels entre deux lettres, et une ombre
  -- decalee de deux les remplit exactement. Le mot devenait une chaine de
  -- lettres soudees par leur propre ombre.
  for y = 0, HAUT_LOGO - 1 do
    for x = 0, LARG_LOGO - 1 do
      if plein(x, y) and not plein(x + 1, y + 2) then poser(x + 1, y + 2, 'f') end
    end
  end

  -- 3. Le corps cisele. La lumiere vient du haut et de la gauche : un pixel qui
  -- a du vide au-dessus ou a sa gauche est une arete, un pixel qui a du vide en
  -- dessous ou a sa droite est un chanfrein. Sur des jambages de trois pixels,
  -- cela donne exactement arete / coeur / chanfrein, sans rien dessiner a la
  -- main.
  local hasard = L.rng(1984)
  local MILIEU = Y0 + 6
  for y = 0, HAUT_LOGO - 1 do
    for x = 0, LARG_LOGO - 1 do
      if plein(x, y) then
        local arete = not plein(x, y - 1) or not plein(x - 1, y)
        local chanfrein = not plein(x, y + 1) or not plein(x + 1, y)
        local cle
        if arete then cle = 'z'
        elseif chanfrein then cle = '4'
        else cle = (y < MILIEU) and 'd' or 'c' end
        -- Un cran de bruit : l'enseigne a vingt ans et le tube fatigue. Sans
        -- lui, les grandes surfaces de coeur se lisent comme du plastique.
        if not arete and not chanfrein and hasard(100) < 9 then cle = 'b' end
        if arete and hasard(100) < 4 then cle = 'l' end
        poser(x, y, cle)
      end
    end
  end

  -- 4. Le soulignement cyan : il tient le mot et il donne l'enseigne.
  local base = Y0 + HAUTEUR_G + 3
  for x = 3, LARG_LOGO - 5 do
    poser(x, base, 'j')
    poser(x, base + 1, 'k')
  end
  for x = 3, LARG_LOGO - 5, 7 do
    poser(x, base + 2, 'i')
  end

  return L.enregistrer(sprite, 'logo_titre', 'ui')
end

-- ------------------------------------------------------ HORLOGE TOXINE ----

-- Douze etats d'une meme fiole : c'est le minuteur de la partie, et il vaut
-- mieux le voir se vider qu'en lire le chiffre. Une planche horizontale, une
-- case par cycle restant, de 0 a 12.

local ETATS = 13
local FIOLE = 12

local function horloge()
  local sprite = Sprite(ETATS * FIOLE, 16)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = 'Horloge'
  local img = sprite.cels[1].image

  for n = 0, ETATS - 1 do
    local ox = n * FIOLE
    local plein = math.floor((n / 12) * 10 + 0.5)     -- hauteur de liquide, 0..10

    -- La fiole, en verre gris : '#' n'est pas une couleur de la palette, et
    -- L.tuileAscii lit chaque caractere comme une cle.
    L.tuileAscii(img, ox, 0, {
      '............',
      '...cccccc...',
      '...c....c...',
      '..cc....cc..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..c......c..',
      '..cc....cc..',
      '...cccccc...',
      '............',
    })

    -- Le liquide. Vert tant qu'il reste du temps, rouge sur les deux derniers
    -- cycles : la couleur doit changer avant le chiffre, pas apres.
    local cle = (n <= 2) and 'u' or 'r'
    local vif = (n <= 2) and 'v' or 's'
    for y = 13 - plein, 13 do
      for x = 3, 8 do L.point(img, ox, 0, x, y, cle, 999) end
    end
    if plein > 0 then
      for x = 3, 8 do L.point(img, ox, 0, x, 13 - plein, vif, 999) end
    end
    -- Un reflet vertical : sans lui la fiole est un tube, pas du verre.
    for y = 4, 13 do L.point(img, ox, 0, 3, y, '4', 999) end
  end

  return L.enregistrer(sprite, 'ui_horloge_toxine', 'ui')
end

-- -------------------------------------------------------- ICONES BUTIN ----

-- Quatre pictogrammes de 16x16, dans l'ordre de data/hacking.json :
-- credits, plans, scripts, infos. L'ordre fait foi — l'interface decale la
-- planche par index.

local function butin()
  local sprite = Sprite(4 * 16, 16)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = 'Butin'
  local img = sprite.cels[1].image

  -- CREDITS : une puce de paiement, pas une piece. Personne n'a vu de piece
  -- depuis longtemps.
  L.tuileAscii(img, 0, 0, {
    '................',
    '..pppppppppppp..',
    '..p..........p..',
    '..p.oooooooo.p..',
    '..p.o......o.p..',
    '..p.o.pppp.o.p..',
    '..p.o.p..p.o.p..',
    '..p.o.p..p.o.p..',
    '..p.o.pppp.o.p..',
    '..p.o......o.p..',
    '..p.oooooooo.p..',
    '..p..........p..',
    '..pppppppppppp..',
    '................',
    '................',
    '................',
  })

  -- PLANS : une coupe technique. Des traits fins et une cote.
  L.tuileAscii(img, 16, 0, {
    '................',
    '.kkkkkkkkkkkkk..',
    '.k...........k..',
    '.k.lll...lll.k..',
    '.k.l.l...l.l.k..',
    '.k.lll...lll.k..',
    '.k..l.....l..k..',
    '.k..lllllll..k..',
    '.k...........k..',
    '.k.l.l.l.l.l.k..',
    '.k...........k..',
    '.kkkkkkkkkkkkk..',
    '................',
    '................',
    '................',
    '................',
  })

  -- SCRIPTS : une cartouche. C'est du logiciel vole, il a une forme physique.
  L.tuileAscii(img, 32, 0, {
    '................',
    '..ssssssssssss..',
    '..s..........s..',
    '..s.rrrrrrrr.s..',
    '..s.r......r.s..',
    '..s.r.ssss.r.s..',
    '..s.r......r.s..',
    '..s.rrrrrrrr.s..',
    '..s..........s..',
    '..ss.ss.ss.sss..',
    '...s..s..s..s...',
    '...s..s..s..s...',
    '................',
    '................',
    '................',
    '................',
  })

  -- INFOS : un dossier ouvert. C'est le seul butin qui change le recit, donc
  -- le seul qui a droit au magenta.
  L.tuileAscii(img, 48, 0, {
    '................',
    '..hhhh..........',
    '..h..hhhhhhhhh..',
    '..h...........h.',
    '..h.ggggggggg.h.',
    '..h...........h.',
    '..h.ggggggg...h.',
    '..h...........h.',
    '..h.ggggggggg.h.',
    '..h...........h.',
    '..h.ggggg.....h.',
    '..h...........h.',
    '..hhhhhhhhhhhhh.',
    '................',
    '................',
    '................',
  })

  return L.enregistrer(sprite, 'icons_butin', 'ui')
end

logo()
horloge()
butin()
