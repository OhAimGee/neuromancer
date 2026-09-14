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
  'comptoir_face',
  'etagere_b',
  'mur_tuyaux',
  'sol_beton_b',
  'neon_bout_g',
  'neon_bout_d',
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
-- Un seul joint horizontal, et en '2' et non en '1' : deux joints noirs par
-- tuile donnaient des assises de briques couchees sur toute la moitie basse de
-- l'ecran. Le joint vertical suffit a poser une dalle.
L.tuileMatiere(img, x(3), 0, '3', { { '2', 4 }, { '4', 2 } }, { '4', 3 }, 4242)
L.ligneH(img, x(3), 0, 0, 0, T - 1, '2')
L.ligneV(img, x(3), 0, 0, 0, T - 1, '2')

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
-- Trois bouteilles de 3 px et non quatre de 2 px : a 2 px de large, un corps
-- de bouteille se lit comme une rayure. Et deux teintes d'alcool plus un verre
-- terne, pas un nuancier : la version precedente faisait code-barres.
L.tuileAscii(img, x(6), 0, {
  '1111111111111111',
  '111n1111r1111j11',
  '111n1111r1111j11',
  '11onm11srq11jii1',
  '11onm11srq11jii1',
  '11onm11srq11jii1',
  '11onm11srq11jii1',
  '11onm11srq11jii1',
  '11onm11srq11jii1',
  'aaaaaaaaaaaaaaaa',
  '3333333333333333',
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

-- 9. Facade du comptoir — la tuile 5 porte l'arete eclairee, celle-ci non :
-- empiler deux fois la tuile 5 donnerait deux aretes et un joint visible.
L.tuileAscii(img, x(9), 0, {
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '3332333333332333',
  '2221222222221222',
  '2221222222221222',
  '2221222222221222',
  '2221222222221222',
  '1110111111110111',
  '1110111111110111',
  '1110111111110111',
  '0000000000000000',
  '0000000000000000',
  '0000000000000000',
})

-- 10. Etagere, seconde garniture — une tuile unique repetee huit fois se voit
-- immediatement comme un motif. Alterner deux variantes suffit a casser l'oeil.
L.tuileAscii(img, x(10), 0, {
  '1111111111111111',
  '11g111111n111111',
  '11g111111n111111',
  '1hgf11111pon1111',
  '1hgf11111pon1111',
  '1hgf11111pon1111',
  '1hgf11111pon1111',
  '1hgf11111pon1111',
  '1hgf11111pon1111',
  'aaaaaaaaaaaaaaaa',
  '3333333333333333',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
})

-- 11. Gaine technique — le mur de beton seul n'a aucune verticale et se lit
-- comme un aplat bruite. Deux conduits suffisent a donner une echelle.
L.tuileAscii(img, x(11), 0, {
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '22aaaaa22aaaaa22',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '22aaaaa22aaaaa22',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
  '222ba42222ba4222',
})

-- 12. Sol, seconde dalle — joint vertical decale et grain d'une autre graine :
-- vingt copies de la meme tuile sur une rangee se voient a l'oeil nu.
L.tuileMatiere(img, x(12), 0, '3', { { '2', 4 }, { '4', 2 } }, { '4', 3 }, 9001)
L.ligneH(img, x(12), 0, 0, 0, T - 1, '2')
L.ligneV(img, x(12), 0, 8, 0, T - 1, '2')

-- 13-14. Bouts du tube neon — une barre coupee net aux deux extremites se lit
-- comme un element d'interface, pas comme un objet accroche a un mur.
L.tuileAscii(img, x(13), 0, {
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '111aa41111111111',
  '111aa41111111111',
  '111aa4eeeeeeeeee',
  '111aa4ffffffffff',
  '111aa4gggggggggg',
  '111aa4hhhhhhhhhh',
  '111aa4gggggggggg',
  '111aa4ffffffffff',
  '111aa4eeeeeeeeee',
  '111aa41111111111',
  '111aa41111111111',
  '1111111111111111',
  '1111111111111111',
})

L.tuileAscii(img, x(14), 0, {
  '1111111111111111',
  '1111111111111111',
  '1111111111111111',
  '11111111114aa111',
  '11111111114aa111',
  'eeeeeeeeee4aa111',
  'ffffffffff4aa111',
  'gggggggggg4aa111',
  'hhhhhhhhhh4aa111',
  'gggggggggg4aa111',
  'ffffffffff4aa111',
  'eeeeeeeeee4aa111',
  '11111111114aa111',
  '11111111114aa111',
  '1111111111111111',
  '1111111111111111',
})

local manifeste = L.enregistrer(sprite, 'ts_interior', 'tilesets')

-- Manifeste : les tilemaps designent les tuiles par nom, jamais par index brut.
local f = io.open(manifeste, 'w')
f:write('{\n  "tuile": 16,\n  "colonnes": ' .. #TUILES .. ',\n  "noms": [\n')
for i, nom in ipairs(TUILES) do
  f:write('    "' .. nom .. '"' .. (i < #TUILES and ',' or '') .. '\n')
end
f:write('  ]\n}\n')
f:close()
print('  ts_interior.json  (' .. #TUILES .. ' tuiles)')
