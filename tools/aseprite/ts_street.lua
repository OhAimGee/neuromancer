-- Tileset des exterieurs : la bande de Ninsei, et la rue Jules-Verne de
-- Freeside qui est la meme chose en orbite.
--
--   tools/aseprite.sh tools/aseprite/ts_street.lua
--
-- Regle apprise sur ts_interior : deux variantes valent mieux qu'une tuile
-- parfaite. Vingt copies d'une meme tuile d'asphalte sur une rangee se lisent
-- immediatement comme un motif, et la rue devient un papier peint.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local T = L.TUILE

-- L'ordre fait foi. Ajouter a la fin, ne jamais reordonner.
local TUILES = {
  'ciel',
  'mur_tole',
  'mur_tole_b',
  'mur_brique',
  'grille',
  'store',
  'porte',
  'climatiseur',
  'cables',
  'bache',
  'enseigne_rose',
  'enseigne_cyan',
  'enseigne_ambre',
  'neon_vertical',
  'bordure',
  'trottoir',
  'trottoir_b',
  'asphalte',
  'asphalte_b',
  'flaque',
  'poubelle',
}

local sprite = Sprite(#TUILES * T, T)
L.palette.appliquer(sprite)
sprite.layers[1].name = 'Tuiles'
local img = sprite.cels[1].image

local function x(i) return (i - 1) * T end

-- 1. Ciel — il n'y a pas de ciel a Chiba, il y a ce qui reste entre les
-- batiments. Quelques lueurs lointaines, jamais d'etoile.
L.tuileMatiere(img, x(1), 0, '0', { { '1', 2 } }, { '1', 3 }, 31337)

-- 2-3. Tole ondulee — l'ondulation est verticale et reguliere : c'est elle qui
-- donne l'echelle du mur. La variante decale la rouille, pas les nervures.
local function tole(i, graine)
  L.tuileMatiere(img, x(i), 0, '2', { { '1', 2 }, { '3', 2 } }, { 'n', 2 }, graine)
  for c = 0, T - 1, 4 do
    L.ligneV(img, x(i), 0, c, 0, T - 1, '1')
    L.ligneV(img, x(i), 0, c + 1, 0, T - 1, '3')
  end
  L.ligneH(img, x(i), 0, 0, 0, T - 1, '1')
  L.ligneH(img, x(i), 0, 15, 0, T - 1, '1')
end
tole(2, 1201)
tole(3, 8803)

-- 4. Brique — pas un appareillage regulier : les rangees sont decalees d'une
-- demi-brique, sinon le mur se lit comme du carrelage.
L.tuileMatiere(img, x(4), 0, '3', { { '2', 3 }, { 'm', 2 } }, { '4', 3 }, 5150)
for r = 0, T - 1, 4 do
  L.ligneH(img, x(4), 0, r, 0, T - 1, '1')
  local decal = (r % 8 == 0) and 0 or 4
  for c = decal, T - 1, 8 do L.ligneV(img, x(4), 0, c, r, math.min(r + 3, T - 1), '1') end
end

-- 5. Grille de ventilation — la seule source de vapeur de la rue.
L.tuileAscii(img, x(5), 0, {
  '1111111111111111',
  '1aaaaaaaaaaaaaa1',
  '1a111111111111a1',
  '1a144444444441a1',
  '1a111111111111a1',
  '1a144444444441a1',
  '1a111111111111a1',
  '1a144444444441a1',
  '1a111111111111a1',
  '1a144444444441a1',
  '1a111111111111a1',
  '1a144444444441a1',
  '1a111111111111a1',
  '1aaaaaaaaaaaaaa1',
  '1111111111111111',
  '0000000000000000',
})

-- 6. Rideau de fer baisse — tout est ferme sur Ninsei, tout le temps.
L.tuileAscii(img, x(6), 0, {
  'aaaaaaaaaaaaaaaa',
  '4444444444444444',
  '3333333333333333',
  '2222222222222222',
  '4444444444444444',
  '3333333333333333',
  '2222222222222222',
  '4444444444444444',
  '3333333333333333',
  '2222222222222222',
  '4444444444444444',
  '3333333333333333',
  '2222222222222222',
  '4444444444444444',
  'aaaaaaaaaaaaaaaa',
  '1111111111111111',
})

-- 7. Porte — un rectangle noir avec une lampe au-dessus. C'est tout ce qu'un
-- bar de Ninsei montre de lui-meme.
L.tuileAscii(img, x(7), 0, {
  '2222222222222222',
  '222222pppp222222',
  '22222ppoopp22222',
  '2222222222222222',
  '2211111111112222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '2210000000012222',
  '1110000000011111',
})

-- 8. Climatiseur — il goutte. Sur Ninsei tout goutte.
L.tuileAscii(img, x(8), 0, {
  '2222222222222222',
  '2aaaaaaaaaaaaaa2',
  '2a4444444444442a',
  '2a1b1b1b1b1b1b1a',
  '2a4444444444442a',
  '2a1b1b1b1b1b1b1a',
  '2a4444444444442a',
  '2a1b1b1b1b1b1b1a',
  '2a4444444444442a',
  '2aaaaaaaaaaaaaa2',
  '22222222222222b2',
  '2222222222222222',
  '222222222222b222',
  '2222222222222222',
  '22222222222b2222',
  '2222222222222222',
})

-- 9. Cables — personne n'a jamais debranche quoi que ce soit ici, on a rajoute
-- par-dessus. Le cable est NOIR sur un fond clair : la premiere version
-- dessinait des cables '1' sur un ciel '0', ce qui donnait une tuile vide.
L.tuileAscii(img, x(9), 0, {
  '2222222222222222',
  '0000000000000000',
  '4444444444444444',
  '2222222222222222',
  '2200000000000022',
  '2222222222222222',
  '0002222222222000',
  '2220000000000222',
  '2222222222222222',
  '2222000000022222',
  '2222222222222222',
  '0000002222222222',
  '2222220000000000',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
})

-- 10. Bache — le seul tissu de la rue, et il est tendu de travers.
L.tuileAscii(img, x(10), 0, {
  '1111111111111111',
  'uuuuuuuuuuuuuuuu',
  'tttttttttttttttt',
  'uuuutttuuuuttuuu',
  'tttttttttttttttt',
  'utuutuutuutuutuu',
  'tttttttttttttttt',
  '1111111111111111',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
})

-- 11-13. Enseignes — des signes qu'on ne lit pas. C'est voulu : une enseigne
-- lisible devient un mot, et un mot dans un decor attire l'oeil pour rien.
local function enseigne(i, sombre, vif, halo)
  L.tuileAscii(img, x(i), 0, {
    '1111111111111111',
    '1aaaaaaaaaaaaaa1',
    '1a111111111111a1',
    '1a1XX11X111XX1a1',
    '1a1X1X1X1X1X11a1',
    '1a1XX11X11XXX1a1',
    '1a1X1X1X1X1X11a1',
    '1a111111111111a1',
    '1a11XX111XX111a1',
    '1a11X1X1X11X11a1',
    '1a11XX11X1X111a1',
    '1a11X1X1XX1X11a1',
    '1a111111111111a1',
    '1aaaaaaaaaaaaaa1',
    '1111111111111111',
    'oooooooooooooooo',
  })
  -- Les traits de l'enseigne sont poses en deux passes : le halo d'abord, le
  -- filament par-dessus. Un neon sans halo ne brille pas, il est peint.
  for py = 0, T - 1 do
    for px = 0, T - 1 do
      local c = img:getPixel(x(i) + px, py)
      if c == L.palette.rgba('X') then
        img:drawPixel(x(i) + px, py, L.palette.rgba(vif))
        for _, d in ipairs({ { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 } }) do
          local nx, ny = px + d[1], py + d[2]
          if nx >= 0 and nx < T and ny >= 0 and ny < T
            and img:getPixel(x(i) + nx, ny) == L.palette.rgba('1') then
            img:drawPixel(x(i) + nx, ny, L.palette.rgba(halo))
          end
        end
      end
    end
  end
  L.ligneH(img, x(i), 0, 15, 0, T - 1, sombre)
end
-- 'X' n'existe pas dans la palette : on peint donc en deux temps, en placant
-- d'abord une couleur reelle qui sert de gabarit.
L.palette.cles['X'] = 0xff00ff
enseigne(11, 'e', 'h', 'f')
enseigne(12, 'i', 'l', 'j')
enseigne(13, 'm', 'p', 'n')

-- 14. Neon vertical — la banniere d'un etage entier, vue de la rue.
L.tuileAscii(img, x(14), 0, {
  '111aaaaaaaaaa111',
  '111a11111111a111',
  '111a1ggggg11a111',
  '111a1g111g11a111',
  '111a1ggggg11a111',
  '111a11111111a111',
  '111a1kkkkk11a111',
  '111a1k11k111a111',
  '111a1kkkkk11a111',
  '111a11111111a111',
  '111a1ooooo11a111',
  '111a1o111o11a111',
  '111a1ooooo11a111',
  '111a11111111a111',
  '111aaaaaaaaaa111',
  '1111111111111111',
})

-- 15. Bordure de trottoir — la jonction, peinte et repeinte.
L.tuileAscii(img, x(15), 0, {
  '3333333333333333',
  '4444444444444444',
  'aaaaaaaaaaaaaaaa',
  '3333333333333333',
  '2222222222222222',
  '1111111111111111',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
  '2222222222222222',
})

-- 16-17. Trottoir — dalles de 8, joint sec. La variante decale le joint.
local function trottoir(i, decal, graine)
  L.tuileMatiere(img, x(i), 0, '3', { { '2', 3 }, { '4', 2 } }, { '4', 4 }, graine)
  L.ligneH(img, x(i), 0, 0, 0, T - 1, '2')
  L.ligneH(img, x(i), 0, 8, 0, T - 1, '2')
  L.ligneV(img, x(i), 0, decal, 0, T - 1, '2')
end
trottoir(16, 0, 7788)
trottoir(17, 8, 3355)

-- 18-19. Asphalte mouille — plus sombre que le trottoir, et il rend la lumiere.
-- Les eclats de neon sont horizontaux : une reflexion sur une flaque s'etale,
-- elle ne pique pas.
local function asphalte(i, graine, teinte)
  L.tuileMatiere(img, x(i), 0, '1', { { '0', 4 }, { '2', 2 } }, { '2', 3 }, graine)
  local hasard = L.rng(graine + 1)
  for _ = 1, 3 do
    local py = hasard(T)
    local px = hasard(T - 4)
    for k = 0, 2 + hasard(3) do
      if px + k < T then img:drawPixel(x(i) + px + k, py, L.palette.rgba(teinte)) end
    end
  end
end
asphalte(18, 9090, 'e')
asphalte(19, 6161, 'i')

-- 20. Flaque — le seul endroit de la rue ou le neon est net.
L.tuileAscii(img, x(20), 0, {
  '1111111111111111',
  '1110000000011111',
  '1100eeeeee001111',
  '1000ffffff000111',
  '100eeeeeeee00111',
  '100ffgffgff000111',
  '100eeeeeeee00111',
  '1000iiiijj000111',
  '11000jjjj0001111',
  '1110000000011111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
})

-- 21. Poubelle et sacs — la matiere premiere de Ninsei.
L.tuileAscii(img, x(21), 0, {
  '1111111111111111',
  '1111111111111111',
  '111aaaaaaaaaa111',
  '11a4444444444a11',
  '11a3333333333a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11a3222222223a11',
  '11aaaaaaaaaaaa11',
  '1111111111111111',
  '1111111111111111',
})

local manifeste = L.enregistrer(sprite, 'ts_street', 'tilesets')

local f = io.open(manifeste, 'w')
f:write('{\n  "tuile": 16,\n  "colonnes": ' .. #TUILES .. ',\n  "noms": [\n')
for i, nom in ipairs(TUILES) do
  f:write('    "' .. nom .. '"' .. (i < #TUILES and ',' or '') .. '\n')
end
f:write('  ]\n}\n')
f:close()
print('  ts_street.json  (' .. #TUILES .. ' tuiles)')
