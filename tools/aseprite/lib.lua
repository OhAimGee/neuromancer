-- Outils communs pour la generation d'assets.
-- Le lanceur (tools/aseprite.sh) definit DOSSIER_SCRIPTS avant le chargement.

local P = dofile(DOSSIER_SCRIPTS .. "/palette.lua")

local L = { palette = P }

L.TUILE = 16

--- Generateur pseudo-aleatoire deterministe.
-- Indispensable : sans graine fixe, chaque regeneration du tileset produirait un
-- bruit different et polluerait le diff git.
function L.rng(graine)
  local etat = graine
  return function(n)
    etat = (etat * 1103515245 + 12345) % 2147483648
    return etat % n
  end
end

--- Dessine une tuile decrite en art ASCII.
-- lignes : table de chaines, une par rangee de pixels. '.' = transparent.
function L.tuileAscii(img, ox, oy, lignes)
  for y, ligne in ipairs(lignes) do
    for x = 1, #ligne do
      local cle = ligne:sub(x, x)
      if cle ~= '.' then
        img:drawPixel(ox + x - 1, oy + y - 1, P.rgba(cle))
      end
    end
  end
end

--- Remplit une tuile d'un aplat, puis y pose des taches.
--
-- Le bruit pixel par pixel donne de la neige de televiseur, pas de la matiere :
-- une surface usee se lit par amas irreguliers, pas par poivre et sel. On pose
-- donc quelques taches de 2 a 5 pixels, puis un grain tres epars par-dessus.
--
-- taches : liste ordonnee { {cle, nombre}, ... }. Une liste et non une table
-- indexee par cle, car pairs() n'a pas d'ordre garanti en Lua et ruinerait la
-- reproductibilite que la graine est censee assurer.
function L.tuileMatiere(img, ox, oy, fond, taches, grain, graine)
  local hasard = L.rng(graine)

  for y = 0, L.TUILE - 1 do
    for x = 0, L.TUILE - 1 do
      img:drawPixel(ox + x, oy + y, P.rgba(fond))
    end
  end

  for _, tache in ipairs(taches) do
    local cle, nombre = tache[1], tache[2]
    for _ = 1, nombre do
      local cx, cy = hasard(L.TUILE), hasard(L.TUILE)
      local taille = 2 + hasard(4)
      for _ = 1, taille do
        local px = (cx + hasard(3) - 1) % L.TUILE
        local py = (cy + hasard(3) - 1) % L.TUILE
        img:drawPixel(ox + px, oy + py, P.rgba(cle))
      end
    end
  end

  if grain then
    for _ = 1, grain[2] do
      img:drawPixel(ox + hasard(L.TUILE), oy + hasard(L.TUILE), P.rgba(grain[1]))
    end
  end
end

--- Trace une ligne horizontale dans une tuile.
function L.ligneH(img, ox, oy, y, x1, x2, cle)
  for x = x1, x2 do
    img:drawPixel(ox + x, oy + y, P.rgba(cle))
  end
end

--- Trace une ligne verticale dans une tuile.
function L.ligneV(img, ox, oy, x, y1, y2, cle)
  for y = y1, y2 do
    img:drawPixel(ox + x, oy + y, P.rgba(cle))
  end
end

--- Primitives de forme, en coordonnees locales a la tuile.
-- Elles servent aux sprites du cyberespace : 24x24 ecrit en art ASCII ferait
-- deux cents lignes par planche pour un resultat moins regulier.

function L.point(img, ox, oy, x, y, cle, taille)
  local t = taille or 1
  if x < 0 or y < 0 or x >= t or y >= t then return end
  img:drawPixel(ox + x, oy + y, P.rgba(cle))
end

--- Contour de cercle, trace par l'algorithme du point milieu.
function L.cercle(img, ox, oy, cx, cy, r, cle, taille)
  local x, y, d = r, 0, 1 - r
  while x >= y do
    local pts = {
      { cx + x, cy + y }, { cx + y, cy + x }, { cx - y, cy + x }, { cx - x, cy + y },
      { cx - x, cy - y }, { cx - y, cy - x }, { cx + y, cy - x }, { cx + x, cy - y },
    }
    for _, pt in ipairs(pts) do L.point(img, ox, oy, pt[1], pt[2], cle, taille) end
    y = y + 1
    if d <= 0 then d = d + 2 * y + 1 else x = x - 1; d = d + 2 * (y - x) + 1 end
  end
end

function L.disque(img, ox, oy, cx, cy, r, cle, taille)
  for y = cy - r, cy + r do
    for x = cx - r, cx + r do
      local dx, dy = x - cx, y - cy
      if dx * dx + dy * dy <= r * r then L.point(img, ox, oy, x, y, cle, taille) end
    end
  end
end

--- Contour de losange (distance de Manhattan).
function L.losange(img, ox, oy, cx, cy, r, cle, taille)
  for i = 0, r do
    L.point(img, ox, oy, cx + i, cy - r + i, cle, taille)
    L.point(img, ox, oy, cx + r - i, cy + i, cle, taille)
    L.point(img, ox, oy, cx - i, cy + r - i, cle, taille)
    L.point(img, ox, oy, cx - r + i, cy - i, cle, taille)
  end
end

function L.losangePlein(img, ox, oy, cx, cy, r, cle, taille)
  for y = cy - r, cy + r do
    local largeur = r - math.abs(y - cy)
    for x = cx - largeur, cx + largeur do L.point(img, ox, oy, x, y, cle, taille) end
  end
end

-- Les bornes sont normalisees : une boucle numerique Lua ne s'execute pas si
-- la borne haute est inferieure a la borne basse, et un rectangle donne a
-- l'envers ne dessinait alors rien du tout, en silence.
local function bornes(a, b)
  if a <= b then return a, b end
  return b, a
end

function L.rect(img, ox, oy, x1, y1, x2, y2, cle, taille)
  x1, x2 = bornes(x1, x2)
  y1, y2 = bornes(y1, y2)
  for x = x1, x2 do
    L.point(img, ox, oy, x, y1, cle, taille)
    L.point(img, ox, oy, x, y2, cle, taille)
  end
  for y = y1, y2 do
    L.point(img, ox, oy, x1, y, cle, taille)
    L.point(img, ox, oy, x2, y, cle, taille)
  end
end

function L.rectPlein(img, ox, oy, x1, y1, x2, y2, cle, taille)
  x1, x2 = bornes(x1, x2)
  y1, y2 = bornes(y1, y2)
  for y = y1, y2 do
    for x = x1, x2 do L.point(img, ox, oy, x, y, cle, taille) end
  end
end

--- Enregistre la source .aseprite et exporte le PNG servi a l'execution.
--
-- Les deux ne vivent pas au meme endroit : Vite ne sert que public/, et il n'y
-- a aucune raison d'embarquer les sources editables dans le build.
--   assets/tilesets/<nom>.aseprite   source, versionnee, non servie
--   public/assets/tilesets/<nom>.png  runtime, servi
function L.enregistrer(sprite, nom, sousDossier)
  local source = RACINE_PROJET .. '/assets/' .. sousDossier .. '/' .. nom .. '.aseprite'
  local runtime = RACINE_PROJET .. '/public/assets/' .. sousDossier .. '/' .. nom .. '.png'

  sprite:saveAs(source)
  app.command.SaveFileCopyAs{ filename = runtime }

  print(string.format("  %s.aseprite + %s.png  (%dx%d, %d calque(s))",
    nom, nom, sprite.width, sprite.height, #sprite.layers))
  return runtime:gsub('%.png$', '.json')
end

return L
