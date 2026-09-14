-- Portraits de dialogue : 48x48, un fichier par personnage.
--
--   tools/aseprite.sh tools/aseprite/portraits.lua
--
-- Un fichier par personnage et non une planche : la boite de dialogue les
-- charge par url() en CSS, et decouper dans une planche imposerait des
-- coordonnees dans le code pour un gain de quelques kilo-octets.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local N = 48

local function creer()
  local sprite = Sprite(N, N)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = 'Portrait'
  return sprite, sprite.cels[1].image
end

local function pt(img, x, y, cle) L.point(img, 0, 0, x, y, cle, N) end
local function plein(img, x1, y1, x2, y2, cle) L.rectPlein(img, 0, 0, x1, y1, x2, y2, cle, N) end

--- Ovale plein. Un crane n'est pas un cercle : a 48 pixels, la difference
--- entre un rayon unique et deux rayons est celle entre une tete et une bille.
local function ovale(img, cx, cy, rx, ry, cle)
  for y = cy - ry, cy + ry do
    for x = cx - rx, cx + rx do
      local dx, dy = (x - cx) / rx, (y - cy) / ry
      if dx * dx + dy * dy <= 1.0 then pt(img, x, y, cle) end
    end
  end
end

--- Pose un fragment d'art ASCII a un endroit precis du portrait.
-- Les ovales donnent la masse, l'art ASCII donne les yeux et la bouche : c'est
-- la qu'un pixel de travers change l'expression.
local function patch(img, ox, oy, lignes)
  for y, ligne in ipairs(lignes) do
    for x = 1, #ligne do
      local c = ligne:sub(x, x)
      if c ~= '.' then pt(img, ox + x - 1, oy + y - 1, c) end
    end
  end
end

--- Fond commun : deux valeurs, la plus claire en bas.
-- Il est deliberement plus clair que les cheveux. La premiere version peignait
-- des cheveux '1' sur un fond '1' : la chevelure existait bien dans le fichier,
-- et le portrait n'en avait aucune a l'ecran.
local function fond(img)
  plein(img, 0, 0, N - 1, 25, '2')
  plein(img, 0, 26, N - 1, N - 1, '3')
end

--- Le crane, dans l'ordre qui fait une tete et pas un casque : cheveux
--- d'abord, visage par-dessus. L'inverse donne une masse capillaire qui mange
--- le front jusqu'aux sourcils.
-- Rend les bornes utiles du visage : haut du front, ligne des yeux, menton.
local function crane(img, cheveux, peau, ombre, clair, epaisseur)
  ovale(img, 24, 18, 13, 14, cheveux)      -- masse capillaire
  ovale(img, 24, 24, 10, 12, peau)         -- front et joues
  ovale(img, 24, 29, 8, 8, peau)           -- machoire

  for y = 12, 36 do                        -- eclairage de trois quarts
    for x = 14, 18 do
      local dedans = (x - 24) * (x - 24) / 100 + (y - 24) * (y - 24) / 144 <= 1.0
        or (x - 24) * (x - 24) / 64 + (y - 29) * (y - 29) / 64 <= 1.0
      if dedans and x <= 16 + math.floor((y - 12) / 9) then pt(img, x, y, ombre) end
    end
  end
  -- Le cote eclaire est un liseré de deux pixels, pas un aplat : une plage
  -- claire large se lisait comme une tache de peinture sur la joue.
  for y = 15, 34 do
    local rang = nil
    for x = 34, 26, -1 do
      if (x - 24) * (x - 24) / 100 + (y - 24) * (y - 24) / 144 <= 1.0
        or (x - 24) * (x - 24) / 64 + (y - 29) * (y - 29) / 64 <= 1.0 then
        rang = x
        break
      end
    end
    if rang then
      for d = 0, (epaisseur or 2) - 1 do pt(img, rang - d, y, clair) end
    end
  end
end

--- Buste : epaules et cou. Le cou avant le visage, sinon le menton flotte.
local function buste(img, vetement, lisere, peau, ombre)
  plein(img, 20, 32, 27, 43, peau)
  plein(img, 20, 32, 22, 43, ombre)
  plein(img, 1, 41, 46, 47, vetement)
  plein(img, 1, 41, 46, 42, lisere)
end

-- ---------------------------------------------------------------- SABLE ----
-- Cowboy brule. Creux, mal rase, prises de trodes encore visibles aux tempes.

local function sable()
  local sprite, img = creer()
  fond(img)
  buste(img, '1', '2', 'x', 'w')
  crane(img, '0', 'x', 'w', 'y', 2)

  patch(img, 12, 12, {                     -- cheveux courts, implantation basse
    '...000000000000000...',
    '..00010000100001000..',
    '.0000.00010.0000.000.',
    '..00...000...00...00.',
  })

  patch(img, 15, 20, {                     -- arcades lourdes, regard eteint
    'wwwwwwwww.wwwwwwwww',
    'w4www4ww...ww4www4w',
    '.4zz4..w...w..4zz4.',
    '.40b4..w...w..4b04.',
    '..44...w...w...44..',
  })

  patch(img, 22, 25, {                     -- nez droit, arete eclairee
    '.wy4',
    '.wy4',
    'ww44',
    '4ww4',
  })

  patch(img, 19, 32, { '4wwwwwww4', '.4444444.' })       -- bouche fermee

  patch(img, 17, 34, {                     -- barbe de trois jours, sur la machoire
    '.w.w.w..w.w.w.',
    '..w...w.w...w.',
  })

  patch(img, 14, 18, { '4j4', 'jlj', '4j4' })            -- prises de trodes
  patch(img, 31, 18, { '4j4', 'jlj', '4j4' })

  return L.enregistrer(sprite, 'port_sable', 'portraits')
end

-- ---------------------------------------------------------------- MOLLY ----
-- Lentilles-miroirs scellees dans la chair. Pas de monture, pas d'yeux : la
-- bande reflechissante est tout le portrait, le reste ne doit pas la disputer.

local function molly()
  local sprite, img = creer()
  fond(img)
  buste(img, '0', '1', 'y', 'x')
  patch(img, 15, 41, { '1000000000000000001', '.10000000000000001.' })

  crane(img, '0', 'y', 'x', 'z', 1)

  plein(img, 11, 16, 13, 36, '0')          -- le carre noir tombe sur les joues
  plein(img, 35, 16, 37, 36, '0')
  plein(img, 13, 18, 13, 34, '1')
  plein(img, 35, 18, 35, 34, '1')
  patch(img, 12, 11, {                     -- frange nette, coupee au rasoir
    '0000000000000000000000000',
    '0000010000000001000000000',
    '.00000000000000000000000.',
  })

  patch(img, 14, 19, {                     -- la bande miroir, scellee a l'os
    '.4444444444444444444.',
    '4cccccccccccccccccc44',
    '4cbbbccccccccdzzzdcc4',
    '4chbbbccccczzzzzddcc4',
    '4chhbbcccczzdddddccc4',
    '4cchhbccccczdcccccdc4',
    '.4444444444444444444.',
  })

  patch(img, 23, 27, { 'x.', 'x.', 'xx' })               -- nez fin
  patch(img, 20, 33, { '4wwwwwww4', '.4444444.' })       -- bouche sans avis

  return L.enregistrer(sprite, 'port_molly', 'portraits')
end

-- ----------------------------------------------------------------- RATZ ----
-- Le barman. Il remplit son cadre. Dents d'acier, bras militaire russe.

local function ratz()
  local sprite, img = creer()
  fond(img)
  plein(img, 0, 39, 47, 47, '2')           -- carrure : pas d'epaules, un bloc
  plein(img, 0, 39, 47, 40, '3')
  plein(img, 17, 31, 31, 41, 'x')
  plein(img, 17, 31, 20, 41, 'w')

  ovale(img, 24, 20, 14, 13, '1')          -- tete large, cheveux plaques
  ovale(img, 24, 24, 12, 12, 'x')
  ovale(img, 24, 29, 11, 9, 'x')
  for y = 14, 36 do
    for x = 11, 16 do
      if (x - 24) * (x - 24) / 144 + (y - 24) * (y - 24) / 144 <= 1.0 then pt(img, x, y, 'w') end
    end
  end
  for y = 16, 30 do
    for x = 32, 36 do
      if (x - 24) * (x - 24) / 144 + (y - 24) * (y - 24) / 144 <= 1.0 then pt(img, x, y, 'y') end
    end
  end

  patch(img, 12, 11, {                     -- cheveux gras, en meches
    '.1111111111111111111111.',
    '11.11.211.11.211.11.1111',
    '.1..1..11..1..11..1..11.',
  })

  patch(img, 14, 20, {                     -- petits yeux enfonces
    'wwwwwww...wwwwwwwww',
    '4004.ww...ww.4004.w',
    '40z4.ww...ww.4z04.w',
    '.44..ww...ww..44...',
  })

  patch(img, 21, 25, { '.wx4..', 'wwx4..', 'wwww4.', '.4444.' })   -- nez casse

  -- Le sourire d'acier. Le seul endroit clair du portrait : c'est lui qu'on
  -- doit voir avant d'avoir lu le nom.
  patch(img, 15, 31, {
    '.4ttttttttttttt4.',
    '4tttttttttttttttt',
    'tdcdcdcdcdcdcdcdt',
    'tzdzdzdzdzdzdzdzt',
    't4t4t4t4t4t4t4t4t',
    '4tcdcdcdcdcdcdct4',
    '.44tttttttttt44..',
  })

  -- Pas de bras prothetique ici : au coin d'un buste de 48 pixels il se lit
  -- comme un objet tombe dans le cadre. Le sourire d'acier porte le personnage,
  -- et le bras appartient a la prose.
  patch(img, 30, 15, { '.t', 'tu', 'tu', '.t' })          -- vieille cicatrice

  return L.enregistrer(sprite, 'port_ratz', 'portraits')
end

-- ------------------------------------------------------------- FRAGMENT ----
-- La chose dans la tete de Sable. Elle n'a pas de visage : un visage la rendrait
-- sympathique. Un balayage qui s'interrompt, et une attention au milieu.

local function fragment()
  local sprite, img = creer()
  local hasard = L.rng(94002)

  plein(img, 0, 0, N - 1, N - 1, '0')

  for y = 0, N - 1 do
    local densite = 12 - math.floor(math.abs(y - 24) / 3)
    for _ = 1, densite do
      pt(img, hasard(N), y, ({ 'e', 'e', 'f', 'i', 'i', 'j' })[1 + hasard(6)])
    end
  end

  for _ = 1, 7 do                          -- decrochages : l'image ne tient pas
    local y, x1 = hasard(N), hasard(N)
    plein(img, x1, y, math.min(N - 1, x1 + 6 + hasard(18)),
      math.min(N - 1, y + hasard(3)), ({ 'f', 'j', 'g' })[1 + hasard(3)])
  end

  L.cercle(img, 0, 0, 24, 24, 15, 'f', N)  -- l'attention, au centre
  L.cercle(img, 0, 0, 24, 24, 11, 'g', N)
  ovale(img, 24, 24, 6, 6, 'e')
  L.cercle(img, 0, 0, 24, 24, 6, 'h', N)
  ovale(img, 24, 24, 2, 2, 'h')
  pt(img, 24, 24, 'Z')

  plein(img, 0, 19, N - 1, 19, 'h')        -- le glitch a une horloge
  plein(img, 0, 20, N - 1, 20, 'e')
  plein(img, 0, 30, N - 1, 30, 'k')

  return L.enregistrer(sprite, 'port_fragment', 'portraits')
end

for _, faire in ipairs({ sable, molly, ratz, fragment }) do faire() end
