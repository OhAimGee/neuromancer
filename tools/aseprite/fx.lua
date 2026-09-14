-- Effets : la pluie de Ninsei.
--
--   tools/aseprite.sh tools/aseprite/fx.lua
--
-- Une seule tuile de 16x16, TUILABLE, et c'est le CSS qui la fait tomber en
-- deplacant sa position de fond par pas d'un pixel. Une planche d'images ne
-- donnerait pas mieux et couterait quatre fichiers : la pluie n'a pas de
-- cycle, elle a une direction.
--
-- La tuile est construite sur un tore : un trait qui sort par le bas rentre
-- par le haut, et par le cote de la meme facon. Sans cela les jointures se
-- voient immediatement — une grille de traits interrompus, pas de la pluie.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local T = 16

local sprite = Sprite(T, T)
L.palette.appliquer(sprite)
sprite.layers[1].name = 'Pluie'
local img = sprite.cels[1].image

local hasard = L.rng(4711)

-- Onze gouttes, trois longueurs. Toutes penchees du meme cote : la pluie de
-- Chiba tombe de travers parce qu'il y a toujours du vent entre les tours.
local GOUTTES = 11
for _ = 1, GOUTTES do
  local x0, y0 = hasard(T), hasard(T)
  local longueur = 2 + hasard(3)
  local teinte = ({ 'a', 'b', 'c' })[1 + hasard(3)]
  for k = 0, longueur - 1 do
    local x = (x0 - math.floor(k / 3)) % T
    local y = (y0 + k) % T
    img:drawPixel(x, y, L.palette.rgba(teinte))
  end
end

-- Quelques eclats isoles : ce sont les gouttes qui passent devant un neon.
for _ = 1, 3 do
  img:drawPixel(hasard(T), hasard(T), L.palette.rgba('d'))
end

L.enregistrer(sprite, 'fx_pluie', 'ui')
