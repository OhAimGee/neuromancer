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

-- Fonte de titre, 7x9. Huit glyphes suffisent a ecrire NEUROMANCER, et une
-- fonte complete pour onze lettres serait du travail jete.
local GLYPHES = {
  N = { '##...##', '##...##', '###..##', '###..##', '##.#.##', '##..###', '##..###', '##...##', '##...##' },
  E = { '#######', '#######', '##.....', '######.', '######.', '##.....', '##.....', '#######', '#######' },
  U = { '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.', '..###..' },
  R = { '######.', '#######', '##...##', '##...##', '######.', '#####..', '##.##..', '##..##.', '##...##' },
  O = { '.#####.', '#######', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '.#####.' },
  M = { '##...##', '###.###', '#######', '##.#.##', '##.#.##', '##...##', '##...##', '##...##', '##...##' },
  A = { '..###..', '.#####.', '##...##', '##...##', '#######', '#######', '##...##', '##...##', '##...##' },
  C = { '.#####.', '#######', '##...##', '##.....', '##.....', '##.....', '##...##', '#######', '.#####.' },
}

local MOT = 'NEUROMANCER'
local LARGEUR_G, HAUTEUR_G, CHASSE = 7, 9, 8

local function logo()
  local largeur = #MOT * CHASSE
  local sprite = Sprite(largeur + 8, HAUTEUR_G + 10)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = 'Logo'
  local img = sprite.cels[1].image

  -- Une ombre portee magenta, decalee d'un pixel en bas a droite, puis les
  -- lettres en blanc par-dessus.
  --
  -- Premiere version : trois copies du mot decalees de plus ou moins un pixel,
  -- pour imiter l'aberration chromatique d'un tube mal regle. Sur des jambages
  -- de deux pixels, les trois couches se recouvraient entierement et le mot
  -- devenait une suite de colonnes magenta et cyan. Une frange ne marche que
  -- si le trait est plus large que le decalage.
  local function ecrire(dx, dy, cle)
    for i = 1, #MOT do
      local glyphe = GLYPHES[MOT:sub(i, i)]
      local ox = 4 + (i - 1) * CHASSE + dx
      for y, ligne in ipairs(glyphe) do
        for x = 1, LARGEUR_G do
          if ligne:sub(x, x) == '#' then
            img:drawPixel(ox + x - 1, 4 + y - 1 + dy, L.palette.rgba(cle))
          end
        end
      end
    end
  end
  ecrire(1, 1, 'f')
  ecrire(0, 0, 'z')

  -- Le soulignement cyan : il tient le mot et il donne l'enseigne.
  for x = 3, sprite.width - 5 do
    img:drawPixel(x, 15, L.palette.rgba('j'))
    img:drawPixel(x, 16, L.palette.rgba('k'))
  end
  for x = 3, sprite.width - 5, 7 do
    img:drawPixel(x, 17, L.palette.rgba('i'))
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
