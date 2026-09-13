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

--- Enregistre le sprite et exporte le PNG a cote.
function L.enregistrer(sprite, cheminAseprite, cheminPng)
  sprite:saveAs(cheminAseprite)
  app.command.SaveFileCopyAs{ filename = cheminPng }
  print(string.format("  %s  (%dx%d, %d calque(s))",
    app.fs.fileName(cheminAseprite), sprite.width, sprite.height, #sprite.layers))
end

return L
