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

-- ----------------------------------------------------------------- FINN ----
-- Le receleur. N'a jamais ete jeune. Le visage d'un homme qui a survecu a tous
-- ceux qui auraient pu temoigner.

local function finn()
  local sprite, img = creer()
  fond(img)
  buste(img, '3', '4', 'x', 'w')
  patch(img, 17, 41, { '4444444444444', '.34444444443.' })   -- col de veste rape
  crane(img, 'a', 'x', 'w', 'y', 2)

  -- Front degarni : on remonte la ligne de cheveux en repeignant de la peau,
  -- puis on laisse quelques meches. Un homme sans age n'a pas de coiffure.
  plein(img, 15, 12, 33, 16, 'x')
  patch(img, 11, 8, {
    '...aaabbaaaaabaaaa...',
    '..aabaaaaabaaaaaaba..',
    '.aa.a.aa.....aa.a.aa.',
    'aa...a.........a...aa',
    'a.................a.a',
  })

  patch(img, 15, 20, {                     -- paupieres lourdes, regard de commerce
    'wwwwwwwww.wwwwwwwww',
    '4wwww4ww...ww4wwww4',
    '.4zb4..w...w..4bz4.',
    '.4444..w...w..4444.',
    '..ww...w...w...ww..',
    '..4....w...w....4..',
  })

  patch(img, 22, 26, { '.wy4', 'wwy4', 'ww44', '4www' })     -- nez long

  patch(img, 18, 33, { '4wwwwwwwww4', '.444444444.' })       -- bouche mince
  patch(img, 17, 31, { '.w.........w.' })                    -- plis d'amertume

  return L.enregistrer(sprite, 'port_finn', 'portraits')
end

-- ------------------------------------------------------------- ARMITAGE ----
-- Reconstruit a partir d'un homme qui s'appelait Corto. Le visage ne bouge
-- jamais : c'est ca, le pire. Symetrique la ou les autres ne le sont pas.

local function armitage()
  local sprite, img = creer()
  fond(img)
  buste(img, '2', '3', 'x', 'w')
  patch(img, 13, 41, {                     -- col militaire, monte trop haut
    '4444444444444444444444',
    '4333333333333333333334',
    '.4444444444444444444.',
  })
  crane(img, '3', 'x', 'w', 'y', 1)

  -- Coupe reglementaire : un plat net, pas une meche.
  patch(img, 12, 10, {
    '333333333333333333333333',
    '333333333333333333333333',
    '344444444444444444444443',
  })

  -- Le regard. Les deux yeux identiques au pixel pres : personne n'a deux yeux
  -- identiques, et c'est exactement ce qui met mal a l'aise.
  patch(img, 15, 20, {
    'wwwwwww...wwwwwwwww',
    '4www4ww...ww4www4ww',
    '.4zl4.....4.4zl4...',
    '.4444.....4.4444...',
    '..w.......4..w.....',
  })

  patch(img, 23, 26, { 'wy4', 'wy4', 'ww4', '4w4' })         -- nez droit

  patch(img, 19, 33, { '444444444', '.4444444.' })           -- bouche : une ligne
  return L.enregistrer(sprite, 'port_armitage', 'portraits')
end

-- -------------------------------------------------------------- RIVIERA ----
-- Beau, et c'est le probleme. Paupieres basses : il vous regarde deja depuis
-- un moment. Le sourire est asymetrique — un sourire regulier n'inquiete
-- personne.

local function riviera()
  local sprite, img = creer()
  fond(img)
  buste(img, '2', '4', 'y', 'x')
  patch(img, 14, 41, { '444444444444zzzz444', '.4444444444444444.' })  -- col blanc
  crane(img, '1', 'y', 'x', 'z', 1)

  patch(img, 12, 9, {                      -- cheveux noirs, coiffes, une meche
    '...1111111111111111...',
    '..111111111111111111..',
    '.1111111111111111111.1',
    '1111.11111111.111111.1',
    '.11...11111....11111..',
    '..1....111......111...',
  })

  patch(img, 15, 20, {
    '1111111.....1111111',              -- sourcils nets
    '.4444..w...w..4444.',              -- paupiere abaissee
    '.4z04..w...w..40z4.',              -- l'oeil, juste une fente
    '..444..w...w..444..',
  })

  patch(img, 23, 26, { '.x4', '.x4', 'xx4', '4x4' })     -- nez droit

  patch(img, 19, 33, {                     -- le sourire, dents visibles
    '4xwwwwwx4',
    '.4zzzzz4.',
    '..44444..',
  })
  pt(img, 28, 32, 'x')                     -- coin releve, d'un seul cote
  pt(img, 29, 33, 'x')

  patch(img, 34, 27, { '.h.', 'hgh', '.h.' })            -- une lueur d'hologramme

  return L.enregistrer(sprite, 'port_riviera', 'portraits')
end

-- ---------------------------------------------------------------- DIXIE ----
-- Un construct ROM. Pas un visage : l'enregistrement d'un visage, rejoue sur
-- un moniteur qui a vingt ans. Il ne se souvient pas de la derniere fois.

local function dixie()
  local sprite, img = creer()
  local hasard = L.rng(31337)

  plein(img, 0, 0, N - 1, N - 1, '0')

  ovale(img, 24, 20, 13, 14, 'q')          -- la masse est pleine, mais verte
  ovale(img, 24, 27, 10, 11, 'q')
  plein(img, 20, 34, 27, 44, 'q')          -- cou
  plein(img, 7, 43, 40, 47, 'q')           -- epaules

  L.cercle(img, 0, 0, 24, 20, 13, 'r', N)  -- le contour, seul trait vif
  L.cercle(img, 0, 0, 24, 27, 10, 'r', N)
  L.rect(img, 0, 0, 7, 43, 40, 47, 'r', N)

  patch(img, 14, 19, {                     -- orbites : deux trous, pas des yeux
    'rrrrrr.....rrrrrrr',
    'r0000r.....r0000r.',
    'r0s00r..r..r00s0r.',
    'r0000r..r..r0000r.',
    '.rrrr...r...rrrr..',
  })
  patch(img, 22, 26, { '.r.', '.r.', 'rr.' })            -- arete du nez
  patch(img, 17, 32, { 'rrrrrrrrrrrrrr' })               -- bouche : une ligne

  -- Le balayage du moniteur passe par-dessus tout : c'est ce qui empeche le
  -- portrait de se lire comme une tete et le force a se lire comme un signal.
  for y = 0, N - 1, 3 do plein(img, 0, y, N - 1, y, '0') end
  plein(img, 0, 12, N - 1, 13, '0')        -- decrochage de synchro

  -- Le trace plat qui lui donne son nom. Un seul soubresaut, puis plus rien.
  plein(img, 0, 40, 17, 40, 's')
  plein(img, 18, 38, 18, 40, 's')
  plein(img, 19, 40, 19, 43, 's')
  plein(img, 20, 33, 20, 43, 's')
  plein(img, 21, 33, 21, 40, 's')
  plein(img, 22, 40, N - 1, 40, 's')

  for _ = 1, 20 do                         -- neige de lecture
    pt(img, hasard(N), hasard(N), ({ 'q', 'r', 's' })[1 + hasard(3)])
  end

  return L.enregistrer(sprite, 'port_dixie', 'portraits')
end

-- -------------------------------------------------------------- MAELCUM ----
-- Zion. Le seul du lot qui ne veut rien prendre a personne.

local function maelcum()
  local sprite, img = creer()
  fond(img)
  buste(img, '2', '3', 'w', 'm')
  patch(img, 13, 41, {                     -- laine tricotee sur les epaules
    '4444444444444444444444',
    'rrqqrroonnooqqrrqqrrqq',
    '4444444444444444444444',
  })
  crane(img, '1', 'w', 'm', 'x', 2)

  -- Les locks : quatre meches qui s'ecartent en tombant. Des colonnes droites
  -- et serrees se lisaient comme deux barres noires posees sur le portrait —
  -- il leur faut de l'ecart, une derive, et un cote eclaire pour se detacher
  -- du fond, qui est sombre lui aussi.
  local LOCKS = {
    { 13, 14, 42, -7 }, { 11, 16, 37, -3 },
    { 34, 16, 38, 3 }, { 32, 14, 42, 7 },
  }
  for _, lock in ipairs(LOCKS) do
    local x0, y1, y2, derive = lock[1], lock[2], lock[3], lock[4]
    for y = y1, y2 do
      local t = (y - y1) / (y2 - y1)
      local x = x0 + math.floor(derive * t * t)
      plein(img, x, y, x + 2, y, '1')
      pt(img, derive < 0 and x + 2 or x, y, '0')
      if (y - y1) % 3 ~= 0 then pt(img, derive < 0 and x or x + 2, y, '4') end
    end
  end
  patch(img, 11, 6, {                      -- la couronne, d'ou tout retombe
    '..11111111111111111111..',
    '.111111111111111111111..',
    '11411411411411411411411.',
    '1.41..411..411..411..41.',
  })

  patch(img, 15, 20, {                     -- regard calme
    'mmmmmmm.....mmmmmmm',
    'm4444m.w...w.m4444m',
    '.4z04..w...w..40z4.',
    '..444..w...w..444..',
  })

  patch(img, 22, 26, { '.mx4', '.mx4', 'mm44', '4mm4' })  -- nez large

  patch(img, 18, 34, { '4mmmmmmmmm4', '.444444444.' })    -- bouche fermee, sereine

  return L.enregistrer(sprite, 'port_maelcum', 'portraits')
end

-- ------------------------------------------------------------ YONDERBOY ----
-- Panther Modern. Polycarbone mimetique : la moitie du visage prend la couleur
-- de ce qu'il y a derriere. On ne se souvient jamais de sa tete.

local function yonderboy()
  local sprite, img = creer()
  local hasard = L.rng(7777)
  fond(img)
  buste(img, '2', '3', 'x', 'w')
  crane(img, '0', 'x', 'w', 'y', 2)

  -- La crete monte, elle n'est pas posee a plat : une barre horizontale se
  -- lisait comme un bandeau.
  for x = 17, 31 do
    local haut = 4 + math.floor(math.abs(x - 24) / 2)
    plein(img, x, haut, x, 13, '0')
    plein(img, x, haut, x, haut + 2, (x % 3 == 0) and 'j' or 'k')
    if x % 4 == 0 then pt(img, x, haut, 'l') end
  end

  patch(img, 15, 20, {                     -- un oeil humain, un oeil couvert
    'wwwwwww.....kkkkkkk',
    'w4www4w.w...kiiiiik',
    '.4z04..w...wkilikkk',
    '..444..w...wkkkkkkk',
    '...w...w....4kkkkk4',
  })

  patch(img, 22, 26, { '.wy4', '.wy4', 'ww44' })          -- nez

  patch(img, 19, 33, { '4wwwwwww4', '.4444444.' })        -- bouche

  -- Le mimetique : la moitie droite se dissout dans le fond. Un damier
  -- irregulier, pas un degrade — c'est une texture qui copie, pas une
  -- transparence.
  for y = 14, 40 do
    for x = 27, 37 do
      if (x - 24) * (x - 24) / 100 + (y - 24) * (y - 24) / 144 <= 1.0
        or (x - 24) * (x - 24) / 64 + (y - 29) * (y - 29) / 64 <= 1.0 then
        if hasard(100) < (x - 27) * 9 then
          pt(img, x, y, (y < 26) and '2' or '3')
        end
      end
    end
  end

  return L.enregistrer(sprite, 'port_yonderboy', 'portraits')
end

-- ---------------------------------------------------------------- 3JANE ----
-- Elle a l'air d'avoir trente ans. Elle en a peut-etre quatre-vingts, et c'est
-- la seule chose qu'on remarque au bout d'un moment : rien dans ce visage n'a
-- jamais eu a s'user.

local function troisjane()
  local sprite, img = creer()
  fond(img)
  buste(img, '1', '4', 'y', 'x')
  patch(img, 13, 41, { '4444zzzzzzzzzz4444444', '.44444444444444444.' })   -- col haut

  crane(img, '1', 'y', 'x', 'z', 1)

  -- Cheveux releves : le chignon monte au lieu de tomber. C'est ce qui la
  -- separe de tout ce qui se passe en bas — personne sur Ninsei ne se coiffe.
  patch(img, 14, 4, {
    '....111111111....',
    '..1111111111111..',
    '.111111111111111.',
    '11111111111111111',
    '11111111111111111',
    '11111111111111111',
  })
  patch(img, 19, 1, { '..1111..', '.111111.', '11111111', '11111111' })   -- le chignon
  plein(img, 10, 11, 11, 21, '1')
  plein(img, 36, 11, 37, 21, '1')

  patch(img, 15, 20, {                     -- sourcils hauts, regard immobile
    'x.xxxxx.....xxxxx.x',
    '.4444..w...w..4444.',
    '.4z04..w...w..40z4.',
    '.4x44..w...w..44x4.',
    '..44...w...w...44..',
  })

  patch(img, 23, 26, { '.x4', '.x4', 'xx4' })            -- nez court

  patch(img, 20, 33, { '4wxxxw4', '.44444.' })           -- bouche petite, fermee
  pt(img, 19, 33, 'x')                                   -- un pli a chaque commissure
  pt(img, 27, 33, 'x')

  patch(img, 12, 23, { 'g', 'h', 'g' })                  -- une boucle d'oreille
  patch(img, 35, 23, { 'g', 'h', 'g' })

  return L.enregistrer(sprite, 'port_3jane', 'portraits')
end

for _, faire in ipairs({
  sable, molly, ratz, fragment, finn, armitage,
  riviera, dixie, maelcum, yonderboy, troisjane,
}) do faire() end
