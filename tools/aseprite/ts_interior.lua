-- Tileset des interieurs : Chatsubo, boutique du Finn, hotel-cercueil.
-- Tuiles de 16x16 alignees sur une bande horizontale.
--
--   tools/aseprite.sh tools/aseprite/ts_interior.lua

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local T = L.TUILE

-- L'ordre fait foi : l'index dans cette table est l'index de tuile utilise par
-- les tilemaps. Ne jamais reordonner, seulement ajouter a la fin.
local TUILES = {
  'mur_beton',
  'mur_tache',
  'sol_beton',
  'plinthe',
  'comptoir',
  'etagere',
  'neon_magenta',
  'terminal',
}

local sprite = Sprite(#TUILES * T, T)
L.palette.appliquer(sprite)
sprite.layers[1].name = 'Tuiles'
local img = sprite.cels[1].image

local function x(i) return (i - 1) * T end

-- 1. Mur de beton — taches d'usure, aucune structure.
L.tuileMatiere(img, x(1), 0, '2', { { '3', 3 }, { '1', 3 } }, { '3', 4 }, 1337)

-- 2. Mur tache — meme mur, plus une coulure de rouille.
L.tuileMatiere(img, x(2), 0, '2', { { '3', 3 }, { '1', 3 } }, { '3', 4 }, 1337)
L.tuileAscii(img, x(2), 0, {
  '................',
  '.....mm.........',
  '....mnnm........',
  '....mnom........',
  '.....nnm........',
  '.....mn.........',
  '.....mm.........',
  '......m.........',
  '......m.........',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
})

-- 3. Sol de beton — un cran plus clair que le mur pour que les joints se lisent.
L.tuileMatiere(img, x(3), 0, '3', { { '2', 4 }, { '4', 2 } }, { '4', 3 }, 4242)
L.ligneH(img, x(3), 0, 0, 0, T - 1, '1')
L.ligneH(img, x(3), 0, 8, 0, T - 1, '1')

-- 4. Plinthe — jonction mur / sol.
L.tuileAscii(img, x(4), 0, {
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
  '4444444444444444',
  'aaaaaaaaaaaaaaaa',
  '3333333333333333',
  '1111111111111111',
  '1111111111111111',
  '0000000000000000',
})

-- 5. Comptoir de zinc — arete eclairee, panneau a joints verticaux.
L.tuileAscii(img, x(5), 0, {
  'dddddddddddddddd',
  'cccccccccccccccc',
  'bbbbbbbbbbbbbbbb',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  '4444444444444444',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '0000000000000000',
  '0000000000000000',
})

-- 6. Etagere a bouteilles — le seul endroit colore du Chatsubo.
L.tuileAscii(img, x(6), 0, {
  '1111111111111111',
  '1hh11kk11pp11ss1',
  '1hh11kk11pp11ss1',
  '1ff11jj11oo11rr1',
  '1ff11jj11oo11rr1',
  '1ff11jj11oo11rr1',
  '1ff11jj11oo11rr1',
  '1ee11ii11mm11qq1',
  'aaaaaaaaaaaaaaaa',
  '3333333333333333',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
})

-- 7. Neon magenta — tube horizontal et son halo.
L.tuileAscii(img, x(7), 0, {
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  'eeeeeeeeeeeeeeee',
  'ffffffffffffffff',
  'gggggggggggggggg',
  'hhhhhhhhhhhhhhhh',
  'gggggggggggggggg',
  'ffffffffffffffff',
  'eeeeeeeeeeeeeeee',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
})

-- 8. Terminal mural — point d'acces physique au reseau.
L.tuileAscii(img, x(8), 0, {
  'aaaaaaaaaaaaaaaa',
  'a44444444444444a',
  'a4iiiiiiiiiiii4a',
  'a4ikkiikiikkii4a',
  'a4iiiiiiiiiiii4a',
  'a4ikikkiikikii4a',
  'a4iiiiiiiiiiii4a',
  'a4iiklliiikiii4a',
  'a4iiiiiiiiiiii4a',
  'a4ikkiikiikiii4a',
  'a4iiiiiiiiiiii4a',
  'a44444444444444a',
  'aaaaaaaaaaaaaaaa',
  '3333333333333333',
  '1111111111111111',
  '0000000000000000',
})

local base = RACINE_PROJET .. '/assets/tilesets/ts_interior'
L.enregistrer(sprite, base .. '.aseprite', base .. '.png')

-- Manifeste : les tilemaps designent les tuiles par nom, jamais par index brut.
local f = io.open(base .. '.json', 'w')
f:write('{\n  "tuile": 16,\n  "colonnes": ' .. #TUILES .. ',\n  "noms": [\n')
for i, nom in ipairs(TUILES) do
  f:write('    "' .. nom .. '"' .. (i < #TUILES and ',' or '') .. '\n')
end
f:write('  ]\n}\n')
f:close()
print('  ts_interior.json  (' .. #TUILES .. ' tuiles)')
