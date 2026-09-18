-- Portraits de dialogue : 64x80, un fichier par personnage.
--
--   tools/aseprite.sh tools/aseprite/portraits.lua
--
-- Un fichier par personnage et non une planche : la boite de dialogue les
-- charge par url() en CSS, et decouper dans une planche imposerait des
-- coordonnees dans le code pour un gain de quelques kilo-octets.
--
-- Le format est un BUSTE VERTICAL et non un carre. Quarante-huit pixels de cote
-- ne laissaient de place qu'a une tete flottante : pas de cou, pas d'epaules,
-- pas d'espace au-dessus du crane, et surtout aucune place pour poser une
-- lumiere. Tous les visages se lisaient comme des vignettes d'icone.
--
-- Trois regles tiennent le lot :
--
--   1. CHEVEUX D'ABORD, VISAGE PAR-DESSUS. L'ordre inverse donne une masse
--      capillaire qui mange le front jusqu'aux sourcils : tous les portraits se
--      lisaient comme des casques.
--   2. LE FOND DOIT DIFFERER DES CHEVEUX. La premiere version peignait des
--      cheveux '1' sur un fond '1' : la chevelure existait dans le fichier et
--      n'existait pas a l'ecran.
--   3. DEUX SOURCES, JAMAIS UNE. Une cle chaude d'un cote, un LISERE DE NEON
--      froid de l'autre. C'est la seule chose qui separe un visage de jeu de
--      role d'un visage de jeu de role cyberpunk — et a 64x80 on a enfin la
--      place de la poser.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local LARG, HAUT = 64, 80

local function creer()
  local sprite = Sprite(LARG, HAUT)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = 'Portrait'
  return sprite, sprite.cels[1].image
end

local function pt(img, x, y, cle)
  if x < 0 or y < 0 or x >= LARG or y >= HAUT then return end
  img:drawPixel(x, y, L.palette.rgba(cle))
end

local function plein(img, x1, y1, x2, y2, cle)
  if x1 > x2 then x1, x2 = x2, x1 end
  if y1 > y2 then y1, y2 = y2, y1 end
  for y = y1, y2 do for x = x1, x2 do pt(img, x, y, cle) end end
end

--- Ovale plein. Un crane n'est pas un cercle : la difference entre un rayon
--- unique et deux rayons est celle entre une tete et une bille.
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

----------------------------------------------------------------------------
-- La geometrie du buste. Une seule table pour tout le lot : deux portraits qui
-- ne cadrent pas pareil se lisent comme deux jeux differents des qu'ils se
-- suivent dans une conversation.

local VISAGE = { cx = 32, cy = 33, rx = 16, ry = 20 }
local MACHOIRE = { cx = 32, cy = 43, rx = 13, ry = 13 }
local CHEVELURE = { cx = 32, cy = 25, rx = 20, ry = 23 }

-- Les traits se posent a des hauteurs NOMMEES et non a des nombres semes dans
-- onze fonctions. Remonter les yeux de deux pixels sur tout le lot doit rester
-- une ligne : c'est le genre de reglage qu'on refait dix fois avant que les
-- visages se ressemblent entre eux.
local CHEVEUX, YEUX, NEZ, BOUCHE, COL = 4, 29, 36, 47, 61

local function dansTete(x, y)
  local a = (x - VISAGE.cx) ^ 2 / VISAGE.rx ^ 2 + (y - VISAGE.cy) ^ 2 / VISAGE.ry ^ 2
  local b = (x - MACHOIRE.cx) ^ 2 / MACHOIRE.rx ^ 2 + (y - MACHOIRE.cy) ^ 2 / MACHOIRE.ry ^ 2
  return a <= 1.0 or b <= 1.0
end

--- Fond : deux valeurs, la plus claire en bas, et une lueur de neon derriere
--- l'epaule du cote du lisere.
--
-- La lueur n'est pas un decor : c'est elle qui justifie le lisere sur le
-- visage. Un liseré froid sans source visible se lit comme un contour dessine,
-- pas comme une lumiere.
local function fond(img, lueur, cote)
  plein(img, 0, 0, LARG - 1, 41, '2')
  plein(img, 0, 42, LARG - 1, HAUT - 1, '3')
  if not lueur then return end
  local cx = (cote or -1) < 0 and 4 or LARG - 5
  -- Tramage ORDONNE, pas une formule modulo : la premiere version tirait
  -- `(x * 3 + y * 5) % 7`, qui dessine des diagonales regulieres. A l'ecran ce
  -- n'etait pas une lueur, c'etaient des rayures.
  local BAYER = { { 0, 8, 2, 10 }, { 12, 4, 14, 6 }, { 3, 11, 1, 9 }, { 15, 7, 13, 5 } }
  for y = 0, HAUT - 1 do
    for x = 0, LARG - 1 do
      local d = math.sqrt((x - cx) ^ 2 + ((y - 34) * 0.8) ^ 2)
      local force = 1 - d / 30
      if force > 0 and force * 16 > BAYER[(y % 4) + 1][(x % 4) + 1] then
        pt(img, x, y, lueur)
      end
    end
  end
end

--- Le crane, dans l'ordre qui fait une tete et pas un casque.
-- `cote` vaut -1 si le lisere de neon vient de la gauche, +1 s'il vient de la
-- droite ; la cle chaude vient toujours de l'autre bord.
local function crane(img, cheveux, peau, ombre, clair, lisere, cote)
  cote = cote or -1
  ovale(img, CHEVELURE.cx, CHEVELURE.cy, CHEVELURE.rx, CHEVELURE.ry, cheveux)
  ovale(img, VISAGE.cx, VISAGE.cy, VISAGE.rx, VISAGE.ry, peau)
  ovale(img, MACHOIRE.cx, MACHOIRE.cy, MACHOIRE.rx, MACHOIRE.ry, peau)

  -- Le modele : l'ombre occupe le cote du neon (une lumiere froide rasante
  -- n'eclaire qu'un liseré), la cle chaude monte de l'autre bord.
  for y = VISAGE.cy - VISAGE.ry, MACHOIRE.cy + MACHOIRE.ry do
    local gauche, droite = nil, nil
    for x = 0, LARG - 1 do
      if dansTete(x, y) then
        if gauche == nil then gauche = x end
        droite = x
      end
    end
    if gauche then
      local bordFroid = cote < 0 and gauche or droite
      local bordChaud = cote < 0 and droite or gauche
      local pas = cote < 0 and 1 or -1

      for d = 0, 4 do pt(img, bordFroid + d * pas, y, ombre) end
      -- Le cote eclaire est un liseré de deux pixels, pas un aplat : une plage
      -- claire large se lisait comme une tache de peinture sur la joue.
      for d = 0, 1 do pt(img, bordChaud - d * pas, y, clair) end
      -- Le lisere de neon : un pixel, et une trame une ligne sur trois. Plein,
      -- il devient un contour au feutre et la tete se decolle du fond.
      pt(img, bordFroid, y, lisere)
      if y % 3 ~= 0 then pt(img, bordFroid + pas, y, lisere) end
    end
  end
end

--- Cou et epaules. Le cou avant le visage, sinon le menton flotte.
local function buste(img, vetement, lisere, peau, ombre, cote, neon)
  cote = cote or -1
  -- Le cou est LARGE et commence sous la machoire. Un cou etroit fait une tete
  -- plantee sur un piquet : c'etait le defaut le plus visible du premier
  -- passage en 64x80, et il se voyait sur les onze portraits a la fois.
  plein(img, 24, 47, 40, 70, peau)
  if cote < 0 then plein(img, 24, 47, 30, 70, ombre) else plein(img, 34, 47, 40, 70, ombre) end
  -- Les epaules descendent en biais et montent haut. Une barre droite posee au
  -- ras du cadre se lit comme un mur, pas comme un corps.
  for y = COL, HAUT - 1 do
    local marge = math.max(0, 15 - (y - COL) * 3)
    plein(img, marge, y, LARG - 1 - marge, y, vetement)
  end
  for y = COL, COL + 1 do
    local marge = math.max(0, 15 - (y - COL) * 3)
    plein(img, marge, y, LARG - 1 - marge, y, lisere)
  end
  -- La meme lumiere que sur le visage, sur l'arete de l'epaule. Sans elle le
  -- buste est un aplat sombre sur un fond sombre : la tete flottait, et les
  -- onze portraits avaient l'air decoupes au ciseau.
  if neon then
    for y = COL, HAUT - 1 do
      local marge = math.max(0, 15 - (y - COL) * 3)
      local bord = cote < 0 and marge or LARG - 1 - marge
      pt(img, bord, y, neon)
      if y % 3 ~= 0 then pt(img, bord + (cote < 0 and 1 or -1), y, neon) end
    end
    local marge = 15
    for x = marge, LARG - 1 - marge do pt(img, x, COL, neon) end
  end
  -- Le cou passe DEVANT le col, sinon le vetement coupe la gorge net.
  plein(img, 26, COL, 38, COL + 5, peau)
  if cote < 0 then plein(img, 26, COL, 30, COL + 5, ombre) else plein(img, 34, COL, 38, COL + 5, ombre) end
end

--- Substitue les lettres MAJUSCULES d'un art ASCII par des cles de palette.
-- Les traits partages (nez, bouche) doivent se dessiner pareil sur onze
-- visages tout en prenant la carnation de chacun ; sans cette substitution il
-- faudrait onze copies du meme dessin, et elles divergeraient des la premiere
-- retouche. 'Z' reste une cle de palette, donc hors jeu.
local function art(lignes, cles)
  local sortie = {}
  for i, ligne in ipairs(lignes) do
    sortie[i] = ligne:gsub('[A-Y]', function(c) return cles[c] or c end)
  end
  return sortie
end

-- Le nez. Une arete eclairee, une ombre, deux narines — et rien d'autre. La
-- premiere version le dessinait en volume : a cette taille un nez en volume
-- devient une tache sombre posee au milieu du visage, et c'est tout ce qu'on
-- voyait du portrait.
local NEZ_ART = {
  '.O...C.',
  '.O...C.',
  '.O...C.',
  '.OO..C.',
  'OOO..C.',
  'OOOO.C.',
  '4OO44C4',
  '.44...4',
}

-- La bouche : la ligne des levres est sombre, la levre inferieure attrape la
-- cle chaude. Une bouche dessinee d'un seul trait se lit comme une entaille.
local BOUCHE_ART = {
  '4OOOOOOOOOOOO4',
  '.4CCCCCCCCCC4.',
  '..4444444444..',
}

local function nez(img, ombre, clair)
  patch(img, 29, NEZ, art(NEZ_ART, { O = ombre, C = clair }))
end

local function bouche(img, ombre, clair)
  patch(img, 25, BOUCHE, art(BOUCHE_ART, { O = ombre, C = clair }))
end

----------------------------------------------------------------------------
-- SABLE — cowboy brule. Creux, mal rase, prises de trodes encore visibles aux
-- tempes. C'est lui qui parle le plus : il lui faut le visage le plus lisible.

local function sable()
  local sprite, img = creer()
  fond(img, 'i', -1)
  buste(img, '1', '2', 'x', 'w', -1, 'j')
  crane(img, '0', 'x', 'w', 'y', 'j', -1)

  patch(img, 11, CHEVEUX, {                 -- cheveux courts, implantation basse
    '.....00000000000000000000000000.....',
    '..0000010000100001000010000100000...',
    '.00000.000100.00000.0001.0000000000.',
    '.0000...000....000...00...00000.000.',
    '..00.....0......00....0....000...0..',
  })

  patch(img, 18, YEUX, {                    -- arcades lourdes, regard eteint
    'wwwwwwwww........wwwwwwwww',
    '444www444........444www444',
    '.4zzb0z4..........4z0bzz4.',
    '.4444444..........4444444.',
    '..wwww..............wwww..',
  })

  nez(img, 'w', 'y')
  bouche(img, 'w', 'y')

  patch(img, 20, BOUCHE + 4, {              -- barbe de trois jours
    '.w.w.w..w.w.w.w.w.w.w.w.',
    '..w...w.w...w.w...w.w..w.',
    '...w.w...w.w...w.w...w...',
  })

  patch(img, 14, 30, { '.4j4.', '4jlj4', '.4j4.' })          -- prises de trodes
  patch(img, 45, 30, { '.4j4.', '4jlj4', '.4j4.' })

  return L.enregistrer(sprite, 'port_sable', 'portraits')
end

----------------------------------------------------------------------------
-- MOLLY — lentilles-miroirs scellees dans la chair. Pas de monture, pas d'yeux.
-- La bande reflechissante est tout le portrait, le reste ne doit pas la
-- disputer.

local function molly()
  local sprite, img = creer()
  fond(img, 'i', 1)
  buste(img, '0', '1', 'y', 'x', 1, 'k')
  crane(img, '0', 'y', 'x', 'z', 'k', 1)

  plein(img, 11, 26, 16, 58, '0')           -- les cheveux tombent sur les joues
  plein(img, 47, 26, 52, 58, '0')
  plein(img, 16, 28, 16, 56, '1')
  plein(img, 47, 28, 47, 56, '1')

  patch(img, 12, CHEVEUX, {                 -- frange nette, coupee au rasoir
    '....00000000000000000000000000000...',
    '..000000000000000000000000000000000.',
    '.0000001000000000100000000010000000.',
    '000000000000000000000000000000000000',
    '.00.0000000000000000000000000.000...',
  })

  patch(img, 16, YEUX - 2, {                -- la bande miroir, scellee a l'os
    '.4444444444444444444444444444444.',
    '44cccccccccccccccccccccccccccccc4',
    '4ccbbbccccccccccccccccdzzzzdcccc4',
    '4chbbbbcccccccccccczzzzzzzddccc44',
    '4chhbbbcccccccccczzdddddddcccc44.',
    '4cchhbbccccccccczdddcccccccdcc4..',
    '4ccchhbccccccccdcccccccccccddc4..',
    '.444444444444444444444444444444..',
  })

  nez(img, 'x', 'z')
  bouche(img, 'x', 'z')

  return L.enregistrer(sprite, 'port_molly', 'portraits')
end

----------------------------------------------------------------------------
-- RATZ — le barman. Il remplit son cadre. Dents d'acier, bras militaire russe.

local function ratz()
  local sprite, img = creer()
  fond(img, 'm', -1)
  -- Pas d'epaules : un bloc. C'est la seule silhouette du lot qui deborde, et
  -- c'est voulu — Ratz remplit son cadre. Il prend quand meme la geometrie
  -- commune : deux visages qui ne cadrent pas pareil se lisent comme deux jeux
  -- differents des qu'ils se suivent dans une conversation.
  plein(img, 24, 48, 40, 70, 'x')
  plein(img, 24, 48, 30, 70, 'w')
  plein(img, 0, COL, LARG - 1, HAUT - 1, '2')
  plein(img, 0, COL, LARG - 1, COL + 2, '3')
  plein(img, 26, COL, 38, COL + 5, 'x')
  plein(img, 26, COL, 30, COL + 5, 'w')

  crane(img, '1', 'x', 'w', 'y', 'n', -1)

  patch(img, 13, CHEVEUX + 2, {             -- cheveux gras, en meches
    '...11111111111111111111111111111111...',
    '.11.11.211.11.211.11.211.11.11111111..',
    '11..1..11..1..11..1..11..1..11..1..11.',
    '.1.....1....1.....1....1....1.....1...',
  })

  patch(img, 17, YEUX - 1, {                -- petits yeux enfonces
    'wwwwwwwwww..........wwwwwwwwww',
    '.4000044............4400004...',
    '.40zzb04............40bzz04...',
    '..44444..............44444....',
  })

  nez(img, 'w', 'y')

  -- Le sourire d'acier. Le seul endroit clair du portrait : c'est lui qu'on
  -- doit voir avant d'avoir lu le nom.
  patch(img, 18, BOUCHE - 4, {
    '.44tttttttttttttttttttttt44.',
    '4tttttttttttttttttttttttttt4',
    'tdcdcdcdcdcdcdcdcdcdcdcdcdct',
    'tzdzdzdzdzdzdzdzdzdzdzdzdzdt',
    't4t4t4t4t4t4t4t4t4t4t4t4t4t4',
    '4ttcdcdcdcdcdcdcdcdcdcdctt4.',
    '.444tttttttttttttttttttt44..',
  })

  -- Pas de bras prothetique : au coin d'un buste il se lit comme un objet tombe
  -- dans le cadre. Le sourire d'acier porte le personnage, le bras appartient a
  -- la prose.
  patch(img, 42, 21, { '.t.', 'tu.', 'tu.', '.t.', '.t.' })   -- vieille cicatrice

  return L.enregistrer(sprite, 'port_ratz', 'portraits')
end

----------------------------------------------------------------------------
-- LE FRAGMENT — la chose dans la tete de Sable. Elle n'a pas de visage : un
-- visage la rendrait sympathique. Un balayage qui s'interrompt, et une
-- attention au milieu.

local function fragment()
  local sprite, img = creer()
  local hasard = L.rng(94002)

  plein(img, 0, 0, LARG - 1, HAUT - 1, '0')

  for y = 0, HAUT - 1 do
    local densite = 14 - math.floor(math.abs(y - 40) / 4)
    for _ = 1, math.max(1, densite) do
      pt(img, hasard(LARG), y, ({ 'e', 'e', 'f', 'i', 'i', 'j' })[1 + hasard(6)])
    end
  end

  for _ = 1, 9 do                           -- decrochages : l'image ne tient pas
    local y, x1 = hasard(HAUT), hasard(LARG)
    plein(img, x1, y, math.min(LARG - 1, x1 + 8 + hasard(24)),
      math.min(HAUT - 1, y + hasard(3)), ({ 'f', 'j', 'g' })[1 + hasard(3)])
  end

  L.cercle(img, 0, 0, 32, 40, 22, 'f', LARG)   -- l'attention, au centre
  L.cercle(img, 0, 0, 32, 40, 16, 'g', LARG)
  ovale(img, 32, 40, 9, 9, 'e')
  L.cercle(img, 0, 0, 32, 40, 9, 'h', LARG)
  ovale(img, 32, 40, 3, 3, 'h')
  pt(img, 32, 40, 'Z')

  plein(img, 0, 31, LARG - 1, 31, 'h')      -- le glitch a une horloge
  plein(img, 0, 32, LARG - 1, 32, 'e')
  plein(img, 0, 50, LARG - 1, 50, 'k')

  return L.enregistrer(sprite, 'port_fragment', 'portraits')
end

----------------------------------------------------------------------------
-- LE FINN — le receleur. N'a jamais ete jeune. Le visage d'un homme qui a
-- survecu a tous ceux qui auraient pu temoigner.

local function finn()
  local sprite, img = creer()
  fond(img, 'q', -1)
  buste(img, '3', '4', 'x', 'w', -1, 'r')
  patch(img, 23, COL - 2, { '44444444444444444', '.344444444444443.' })  -- col rape
  crane(img, 'a', 'x', 'w', 'y', 'r', -1)

  -- Front degarni : on remonte la ligne de cheveux en repeignant de la peau,
  -- puis on laisse quelques meches. Un homme sans age n'a pas de coiffure.
  plein(img, 18, 14, 46, 28, 'x')
  patch(img, 12, CHEVEUX, {
    '.......aaabbaaaaabaaaaabaa......',
    '....aaabaaaaabaaaaaabaaaaaaba...',
    '..aaa.a.aa.....aa.a.aa...aa.aa..',
    '.aa....a.........a...a....a..aa.',
    'aa..................a.........a.',
  })

  patch(img, 18, YEUX, {                    -- paupieres lourdes, regard de commerce
    'wwwwwwwww........wwwwwwwww',
    '4wwww444.........444wwww4.',
    '.4zzb04...........40bzz4..',
    '.4444444.........4444444..',
    '..wwww.............wwww...',
    '...44...............44....',
  })

  nez(img, 'w', 'y')
  bouche(img, 'w', 'y')
  patch(img, 23, BOUCHE - 2, { '.w..............w.' })           -- plis d'amertume

  return L.enregistrer(sprite, 'port_finn', 'portraits')
end

----------------------------------------------------------------------------
-- ARMITAGE — reconstruit a partir d'un homme qui s'appelait Corto. Le visage ne
-- bouge jamais : c'est ca, le pire. Symetrique la ou les autres ne le sont pas.

local function armitage()
  local sprite, img = creer()
  fond(img, 'i', -1)
  buste(img, '2', '3', 'x', 'w', -1, 'b')
  patch(img, 17, COL - 3, {                 -- col militaire, monte trop haut
    '44444444444444444444444444444',
    '43333333333333333333333333334',
    '.444444444444444444444444444.',
  })
  crane(img, '3', 'x', 'w', 'y', 'b', -1)

  patch(img, 13, CHEVEUX + 1, {             -- coupe reglementaire : un plat net
    '..333333333333333333333333333333333..',
    '.33333333333333333333333333333333333.',
    '3333333333333333333333333333333333333',
    '3444444444444444444444444444444444443',
  })

  -- Le regard. Les deux yeux identiques au pixel pres : personne n'a deux yeux
  -- identiques, et c'est exactement ce qui met mal a l'aise.
  patch(img, 18, YEUX, {
    'wwwwwwww..........wwwwwwww',
    '4www444............444www4',
    '.4zzl04............40lzz4.',
    '.444444............444444.',
    '..ww..................ww..',
  })

  nez(img, 'w', 'y')
  bouche(img, 'w', 'y')

  return L.enregistrer(sprite, 'port_armitage', 'portraits')
end

----------------------------------------------------------------------------
-- RIVIERA — beau, et c'est le probleme. Paupieres basses : il vous regarde deja
-- depuis un moment. Le sourire est asymetrique — un sourire regulier n'inquiete
-- personne.

local function riviera()
  local sprite, img = creer()
  fond(img, 'e', 1)
  buste(img, '2', '4', 'y', 'x', 1, 'g')
  patch(img, 18, COL - 2, { '44444444444zzzzzz4444444444', '.4444444444444444444444444.' })
  crane(img, '1', 'y', 'x', 'z', 'g', 1)

  patch(img, 12, CHEVEUX - 1, {             -- cheveux noirs, coiffes, une meche
    '......11111111111111111111......',
    '...1111111111111111111111111....',
    '..111111111111111111111111111.1.',
    '.1111111111111111111111111111.1.',
    '111111.111111111111.1111111111.1',
    '.11111...11111111.....11111111..',
    '..111.....1111111.......111111..',
    '...1.......11111.........1111...',
  })

  patch(img, 18, YEUX, {
    '11111111111......11111111111',           -- sourcils nets
    '.4444444...........4444444..',           -- paupiere abaissee
    '.44z0b4............4b0z44...',           -- l'oeil, juste une fente
    '..44444............44444....',
  })

  nez(img, 'x', 'z')

  patch(img, 25, BOUCHE, {                  -- le sourire, dents visibles
    '4xwwwwwwwwwwwx4',
    '.4zzzzzzzzzzz4.',
    '..44444444444..',
  })
  pt(img, 39, BOUCHE - 1, 'x'); pt(img, 40, BOUCHE, 'x')   -- coin releve, d'un seul cote

  patch(img, 50, 40, { '.h.', 'hgh', '.h.' })  -- une lueur d'hologramme

  return L.enregistrer(sprite, 'port_riviera', 'portraits')
end

----------------------------------------------------------------------------
-- DIXIE — un construct ROM. Pas un visage : l'enregistrement d'un visage,
-- rejoue sur un moniteur qui a vingt ans. Il ne se souvient pas de la derniere
-- fois.

local function dixie()
  local sprite, img = creer()
  local hasard = L.rng(31337)

  plein(img, 0, 0, LARG - 1, HAUT - 1, '0')

  ovale(img, 32, 28, 18, 19, 'q')           -- la masse est pleine, mais verte
  ovale(img, 32, 38, 14, 15, 'q')
  plein(img, 26, 48, 38, 64, 'q')           -- cou
  plein(img, 8, 62, 55, HAUT - 1, 'q')      -- epaules

  L.cercle(img, 0, 0, 32, 28, 18, 'r', LARG)
  L.cercle(img, 0, 0, 32, 38, 14, 'r', LARG)
  L.rect(img, 0, 0, 8, 62, 55, HAUT - 1, 'r', LARG)

  patch(img, 18, 28, {                      -- orbites : deux trous, pas des yeux
    'rrrrrrrr.......rrrrrrrr',
    'r000000r.......r000000r',
    'r00ss00r...r...r00ss00r',
    'r000000r...r...r000000r',
    '.rrrrrr....r....rrrrrr.',
  })
  patch(img, 30, 38, { '.r..', '.r..', '.r..', 'rr..' })      -- arete du nez
  patch(img, 23, 48, { 'rrrrrrrrrrrrrrrrrr' })                -- bouche : une ligne

  -- Le balayage du moniteur passe par-dessus tout : c'est ce qui empeche le
  -- portrait de se lire comme une tete et le force a se lire comme un signal.
  for y = 0, HAUT - 1, 3 do plein(img, 0, y, LARG - 1, y, '0') end
  plein(img, 0, 17, LARG - 1, 18, '0')      -- decrochage de synchro

  -- Le trace plat qui lui donne son nom. Un seul soubresaut, puis plus rien.
  plein(img, 0, 58, 22, 58, 's')
  plein(img, 23, 54, 23, 58, 's')
  plein(img, 24, 58, 24, 62, 's')
  plein(img, 25, 46, 25, 62, 's')
  plein(img, 26, 46, 26, 58, 's')
  plein(img, 27, 58, LARG - 1, 58, 's')

  for _ = 1, 34 do                          -- neige de lecture
    pt(img, hasard(LARG), hasard(HAUT), ({ 'q', 'r', 's' })[1 + hasard(3)])
  end

  return L.enregistrer(sprite, 'port_dixie', 'portraits')
end

----------------------------------------------------------------------------
-- MAELCUM — Zion. Le seul du lot qui ne veut rien prendre a personne.

local function maelcum()
  local sprite, img = creer()
  fond(img, 'm', -1)
  buste(img, '2', '3', 'w', 'm', -1, 'o')
  patch(img, 17, COL - 2, {                 -- laine tricotee sur les epaules
    '4444444444444444444444444444',
    'rrqqrroonnooqqrrqqrrqqrroonn',
    '4444444444444444444444444444',
  })
  crane(img, '1', 'w', 'm', 'x', 'o', -1)

  -- Les locks : six meches qui s'ecartent en tombant. Des colonnes droites et
  -- serrees se lisaient comme deux barres noires posees sur le portrait — il
  -- leur faut de l'ecart, une derive, et un cote eclaire pour se detacher du
  -- fond, qui est sombre lui aussi.
  local LOCKS = {
    { 18, 20, 64, -11 }, { 15, 22, 58, -6 }, { 13, 26, 52, -2 },
    { 48, 26, 52, 2 }, { 46, 22, 58, 6 }, { 43, 20, 64, 11 },
  }
  for _, lock in ipairs(LOCKS) do
    local x0, y1, y2, derive = lock[1], lock[2], lock[3], lock[4]
    for y = y1, y2 do
      local t = (y - y1) / (y2 - y1)
      local x = x0 + math.floor(derive * t * t)
      plein(img, x, y, x + 3, y, '1')
      pt(img, derive < 0 and x + 3 or x, y, '0')
      if (y - y1) % 3 ~= 0 then pt(img, derive < 0 and x or x + 3, y, '4') end
    end
  end
  patch(img, 12, CHEVEUX - 1, {             -- la couronne, d'ou tout retombe
    '.....11111111111111111111111....',
    '...111111111111111111111111111..',
    '..1111111111111111111111111111..',
    '.111111111111111111111111111111.',
    '1141141141141141141141141141111.',
    '1.41..411..411..411..411..41.11.',
  })

  patch(img, 18, YEUX, {                    -- regard calme
    'mmmmmmmm..........mmmmmmmm',
    'm44444m............m44444m',
    '.44z0b4............4b0z44.',
    '..44444............44444..',
  })

  nez(img, 'm', 'x')
  bouche(img, 'm', 'x')

  return L.enregistrer(sprite, 'port_maelcum', 'portraits')
end

----------------------------------------------------------------------------
-- YONDERBOY — Panther Modern. Polycarbone mimetique : la moitie du visage prend
-- la couleur de ce qu'il y a derriere. On ne se souvient jamais de sa tete.

local function yonderboy()
  local sprite, img = creer()
  local hasard = L.rng(7777)
  fond(img, 'i', -1)
  buste(img, '2', '3', 'x', 'w', -1, 'k')
  crane(img, '0', 'x', 'w', 'y', 'k', -1)

  -- La crete monte, elle n'est pas posee a plat : une barre horizontale se
  -- lisait comme un bandeau.
  for x = 22, 42 do
    local haut = 3 + math.floor(math.abs(x - 32) / 2)
    plein(img, x, haut, x, 20, '0')
    plein(img, x, haut, x, haut + 3, (x % 3 == 0) and 'j' or 'k')
    if x % 4 == 0 then pt(img, x, haut, 'l') end
  end

  patch(img, 18, YEUX, {                    -- un oeil humain, un oeil couvert
    'wwwwwwww..........kkkkkkkkk',
    'w4www44w...........kiiiiiik',
    '.44z0b4............kiliiikk',
    '..44444............kkkkkkkk',
    '...ww...............4kkkkk4',
  })

  nez(img, 'w', 'y')
  bouche(img, 'w', 'y')

  -- Le mimetique : la moitie droite se dissout dans le fond. Un damier
  -- irregulier, pas un degrade — c'est une texture qui copie, pas une
  -- transparence.
  for y = 20, 56 do
    for x = 36, 50 do
      if dansTete(x, y) and hasard(100) < (x - 36) * 7 then
        pt(img, x, y, (y < 38) and '2' or '3')
      end
    end
  end

  return L.enregistrer(sprite, 'port_yonderboy', 'portraits')
end

----------------------------------------------------------------------------
-- LADY 3JANE — elle a l'air d'avoir trente ans. Elle en a peut-etre
-- quatre-vingts, et c'est la seule chose qu'on remarque au bout d'un moment :
-- rien dans ce visage n'a jamais eu a s'user.

local function troisjane()
  local sprite, img = creer()
  fond(img, 'm', 1)
  buste(img, '1', '4', 'y', 'x', 1, 'p')
  patch(img, 17, COL - 3, { '4444zzzzzzzzzzzzzz44444444', '.44444444444444444444444.' })
  crane(img, '1', 'y', 'x', 'z', 'p', 1)

  -- Cheveux releves : le chignon monte au lieu de tomber. C'est ce qui la
  -- separe de tout ce qui se passe en bas — personne sur Ninsei ne se coiffe.
  patch(img, 18, 6, {
    '.....1111111111111.....',
    '...111111111111111111..',
    '..1111111111111111111..',
    '.111111111111111111111.',
    '11111111111111111111111',
    '11111111111111111111111',
    '11111111111111111111111',
    '11111111111111111111111',
  })
  patch(img, 25, 1, { '...11111...', '..1111111..', '.111111111.', '11111111111', '11111111111' })
  plein(img, 14, 17, 16, 32, '1')
  plein(img, 47, 17, 49, 32, '1')

  patch(img, 18, YEUX - 1, {                -- sourcils hauts, regard immobile
    'xx.xxxxxx.........xxxxxx.xx',
    '.4444444...........4444444.',
    '.44z0b4............4b0z44..',
    '.44x444............444x44..',
    '..44444............44444...',
  })

  nez(img, 'x', 'z')

  patch(img, 27, BOUCHE, { '4wwxxxxxxww4', '.4444444444.' })      -- bouche petite
  pt(img, 26, BOUCHE, 'x'); pt(img, 39, BOUCHE, 'x')              -- un pli aux commissures

  patch(img, 13, 40, { 'g', 'h', 'g' })                           -- boucles d'oreille
  patch(img, 50, 40, { 'g', 'h', 'g' })

  return L.enregistrer(sprite, 'port_3jane', 'portraits')
end

for _, faire in ipairs({
  sable, molly, ratz, fragment, finn, armitage,
  riviera, dixie, maelcum, yonderboy, troisjane,
}) do faire() end
