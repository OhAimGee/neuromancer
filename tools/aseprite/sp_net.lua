-- Icones du cyberespace : une planche de sprites 24x24, un par type de noeud.
--
--   tools/aseprite.sh tools/aseprite/sp_net.lua
--
-- Le fond reste transparent : le rendu Pixi pose ces icones par-dessus une
-- grille et des liens traces a la volee.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local T = 24

-- L'ordre fait foi. Ajouter en fin de liste, ne jamais reordonner.
local SPRITES = {
  'relais',
  'bdd',
  'glace',
  'glace_noire',
  'leurre',
  'sanctuaire',
  'coeur',
  'avatar',
}

local sprite = Sprite(#SPRITES * T, T)
L.palette.appliquer(sprite)
sprite.layers[1].name = 'Noeuds'
local img = sprite.cels[1].image
local function x(i) return (i - 1) * T end
local C = 11 -- centre d'une case de 24 (0..23)

-- 1. Relais — simple nœud de routage, sans contenu.
L.losange(img, x(1), 0, C, C, 7, 'i', T)
L.losange(img, x(1), 0, C, C, 6, 'k', T)
L.losangePlein(img, x(1), 0, C, C, 2, 'l', T)

-- 2. BDD — pile de disques. C'est la silhouette que le leurre imite.
for _, y in ipairs({ 4, 9, 14, 19 }) do
  L.rectPlein(img, x(2), 0, 4, y - 2, 18, y, 'q', T)
  L.rectPlein(img, x(2), 0, 4, y - 2, 18, y - 2, 's', T)
  L.rectPlein(img, x(2), 0, 5, y - 1, 17, y - 1, 'r', T)
end
L.rectPlein(img, x(2), 0, 4, 3, 18, 3, 's', T)

-- 3. Glace — un mur, pas une cible. Silhouette fermee, hexagonale.
L.disque(img, x(3), 0, C, C, 9, 'j', T)
L.disque(img, x(3), 0, C, C, 7, '0', T)
L.cercle(img, x(3), 0, C, C, 9, 'l', T)
for i = -7, 7, 2 do
  L.rectPlein(img, x(3), 0, C + i, C - 6, C + i, C + 6, 'k', T)
end

-- 4. Glace noire — meme silhouette, autre promesse.
L.disque(img, x(4), 0, C, C, 9, 't', T)
L.disque(img, x(4), 0, C, C, 7, '0', T)
L.cercle(img, x(4), 0, C, C, 9, 'v', T)
for i = -7, 7, 2 do
  L.rectPlein(img, x(4), 0, C + i, C - 6, C + i, C + 6, 'u', T)
end
L.losangePlein(img, x(4), 0, C, C, 3, 'v', T)
L.losangePlein(img, x(4), 0, C, C, 1, '0', T)

-- 5. Leurre revele — la meme pile, brulee. Avant revelation, le rendu affiche
-- la BDD : un pot de miel qui s'annonce n'en est pas un.
for _, y in ipairs({ 4, 9, 14, 19 }) do
  L.rectPlein(img, x(5), 0, 4, y - 2, 18, y, '1', T)
  L.rectPlein(img, x(5), 0, 4, y - 2, 18, y - 2, '3', T)
end
L.losangePlein(img, x(5), 0, C, C, 5, 'u', T)
L.losangePlein(img, x(5), 0, C, C, 3, 'v', T)
L.losangePlein(img, x(5), 0, C, C, 1, '0', T)

-- 6. Sanctuaire — zone morte. Aucun eclat, un anneau creux.
L.cercle(img, x(6), 0, C, C, 9, 'b', T)
L.cercle(img, x(6), 0, C, C, 6, 'a', T)
for i = 0, 3 do
  L.point(img, x(6), 0, C - 9 + i * 6, C, '2', T)
  L.point(img, x(6), 0, C, C - 9 + i * 6, '2', T)
end

-- 7. Coeur — noyau du reseau. Dense, magenta, insistant.
L.disque(img, x(7), 0, C, C, 10, 'e', T)
L.cercle(img, x(7), 0, C, C, 10, 'g', T)
L.cercle(img, x(7), 0, C, C, 8, 'f', T)
L.cercle(img, x(7), 0, C, C, 5, 'g', T)
L.disque(img, x(7), 0, C, C, 3, 'h', T)
L.disque(img, x(7), 0, C, C, 1, 'Z', T)

-- 8. Avatar du joueur — un reticule, pose PAR-DESSUS le noeud courant. Une
-- silhouette pleine le masquerait : le joueur a besoin de voir sur quoi il est.
local function coin(sx, sy, dx, dy)
  L.rectPlein(img, x(8), 0, sx, sy, sx + dx * 5, sy, 'l', T)
  L.rectPlein(img, x(8), 0, sx, sy, sx, sy + dy * 5, 'l', T)
  L.point(img, x(8), 0, sx, sy, 'Z', T)
end
coin(0, 0, 1, 1)
coin(23, 0, -1, 1)
coin(0, 23, 1, -1)
coin(23, 23, -1, -1)

local manifeste = L.enregistrer(sprite, 'sp_net', 'sprites')

local f = io.open(manifeste, 'w')
f:write('{\n  "tuile": ' .. T .. ',\n  "colonnes": ' .. #SPRITES .. ',\n  "noms": [\n')
for i, nom in ipairs(SPRITES) do
  f:write('    "' .. nom .. '"' .. (i < #SPRITES and ',' or '') .. '\n')
end
f:write('  ]\n}\n')
f:close()
print('  sp_net.json  (' .. #SPRITES .. ' sprites)')
