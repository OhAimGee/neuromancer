-- Etalonnage nuit des plans de parallaxe.
--
--   tools/aseprite.sh tools/aseprite/etalonner.lua
--
-- Les plans d'Ansimuz sont beaux et ne sont pas les notres : ciel de coucher de
-- soleil rose, hautes lumieres chaudes, et surtout des milliers de couleurs la
-- ou le projet en tient trente-deux. Ce script les fait entrer dans la direction
-- artistique au lieu de la contredire :
--
--   1. etalonnage nuit — desature, tire vers le bleu nuit, creuse les mediums,
--      ecrase les hautes lumieres. C'est le plafond qui enleve la carte postale.
--   2. les neons y echappent — un pixel assez sature et assez clair garde sa
--      teinte. Sans cette exception, la nuit mange l'enseigne avec la facade.
--   3. halo CUIT dans l'image — les neons diffusent sur quelques pixels ici, une
--      fois pour toutes. Un bloom pose au rendu tournerait sur 320x180 et
--      adoucirait le pixel art : la regle du projet l'interdit, et elle a raison.
--   4. quantification sur les 32 couleurs, avec un Bayer 4x4 sur les degrades.
--
-- Deterministe : aucune source d'aleatoire, aucun pairs(). Deux executions
-- donnent le meme MD5.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local P = L.palette

local SRC = RACINE_PROJET .. '/assets/parallax-src'
local DST = RACINE_PROJET .. '/public/assets/parallax'

----------------------------------------------------------------------------
-- Reglages

local fichier = io.open(RACINE_PROJET .. '/data/etalonnage.json', 'r')
if not fichier then error("data/etalonnage.json introuvable") end
local reglages = json.decode(fichier:read('a'))
fichier:close()

----------------------------------------------------------------------------
-- Couleur

local function versHSV(r, g, b)
  local mx, mn = math.max(r, g, b), math.min(r, g, b)
  local d = mx - mn
  local h = 0
  if d > 0 then
    if mx == r then h = ((g - b) / d) % 6
    elseif mx == g then h = (b - r) / d + 2
    else h = (r - g) / d + 4 end
    h = h / 6
  end
  return h, (mx > 0 and d / mx or 0), mx
end

local function versRGB(h, s, v)
  if s <= 0 then return v, v, v end
  local i = math.floor(h * 6) % 6
  local f = h * 6 - math.floor(h * 6)
  local p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
  if i == 0 then return v, t, p
  elseif i == 1 then return q, v, p
  elseif i == 2 then return p, v, t
  elseif i == 3 then return p, q, v
  elseif i == 4 then return t, p, v
  else return v, p, q end
end

local function borne(x, a, b) return x < a and a or (x > b and b or x) end

----------------------------------------------------------------------------
-- La palette, en flottants, une fois pour toutes. L'ordre est celui de
-- palette.lua : c'est lui qui fait foi partout ailleurs dans le projet.

local PAL = {}
for i, cle in ipairs(P.ordre) do
  local hex = P.cles[cle]
  PAL[i] = {
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  }
end

--- Plus proche voisin, distance RGB ponderee : l'oeil pese le vert plus que le
--- bleu, et une distance euclidienne brute choisit des bleus pour des gris.
local function plusProche(r, g, b)
  local meilleur, distance = 1, math.huge
  for i = 1, #PAL do
    local c = PAL[i]
    local dr, dg, db = r - c[1], g - c[2], b - c[3]
    local d = 2 * dr * dr + 4 * dg * dg + 3 * db * db
    if d < distance then distance, meilleur = d, i end
  end
  return PAL[meilleur]
end

local BAYER = {
  {  0,  8,  2, 10 },
  { 12,  4, 14,  6 },
  {  3, 11,  1,  9 },
  { 15,  7, 13,  5 },
}

----------------------------------------------------------------------------

local function etalonner(nom, profil)
  local sprite = Sprite{ fromFile = SRC .. '/' .. nom .. '.png' }
  if not sprite then error("source introuvable : " .. nom) end
  app.command.ChangePixelFormat{ format = 'rgb' }

  local img = sprite.cels[1].image
  local w, h = img.width, img.height

  local teinte = tonumber(profil.teinte)
  local tr = ((teinte >> 16) & 0xff) / 255
  local tg = ((teinte >> 8) & 0xff) / 255
  local tb = (teinte & 0xff) / 255

  local neon = profil.neon
  local halo = profil.halo
  local trame = (profil.tramage or 0) / 255

  -- Quatre passes, et elles ne se fusionnent pas : le tri des neons a besoin du
  -- voisinage d'origine, le halo a besoin de l'image deja etalonnee.
  local H0, S0, V0, A = {}, {}, {}, {}
  for y = 0, h - 1 do
    local base = y * w
    for x = 0, w - 1 do
      local px = img:getPixel(x, y)
      local i = base + x
      A[i] = app.pixelColor.rgbaA(px)
      if A[i] == 0 then
        H0[i], S0[i], V0[i] = 0, 0, 0
      else
        H0[i], S0[i], V0[i] = versHSV(
          app.pixelColor.rgbaR(px) / 255,
          app.pixelColor.rgbaG(px) / 255,
          app.pixelColor.rgbaB(px) / 255)
      end
    end
  end

  --- Une enseigne est entouree de nuit ; une brume de coucher de soleil ne
  --- l'est pas. C'est toute la difference, et elle ne se lit pas sur un pixel
  --- seul : sans ce test de contraste local, les 256x272 de brume orange du
  --- plan median passaient pour du neon et le ciel restait un coucher de
  --- soleil en plein jeu — exactement ce qu'on venait enlever.
  local function entoureDeNuit(x, y, v)
    local seuil = v - neon.contraste
    for dy = -2, 2 do
      local yy = y + dy
      if yy >= 0 and yy < h then
        local base = yy * w
        for dx = -2, 2 do
          local xx = x + dx
          if xx >= 0 and xx < w then
            local i = base + xx
            if A[i] == 0 or V0[i] < seuil then return true end
          end
        end
      end
    end
    return false
  end

  local R, G, B = {}, {}, {}
  local neons = {}

  for y = 0, h - 1 do
    local base = y * w
    for x = 0, w - 1 do
      local i = base + x
      if A[i] == 0 then
        R[i], G[i], B[i] = 0, 0, 0
      else
        local hh, ss, vv = H0[i], S0[i], V0[i]
        if ss >= neon.saturation and vv >= neon.valeur and entoureDeNuit(x, y, vv) then
          -- Un neon reste un neon : meme teinte, meme saturation, valeur a
          -- peine touchee. C'est la seule lumiere qui subsiste la nuit, et la
          -- pousser davantage la transforme en tache blanche.
          local nr, ng, nb = versRGB(hh, ss, borne(vv * neon.gain, 0, 1))
          R[i], G[i], B[i] = nr, ng, nb
          neons[#neons + 1] = { x, y, nr, ng, nb }
        else
          -- La courbe de tonalite s'applique a la VALEUR, pas au RGB deja
          -- melange : gamma puis remise a l'echelle entre un plancher et un
          -- plafond. Le plancher n'est pas du confort — sans lui tout ce qui
          -- est sous la moitie tombe a zero et la rue devient un trou noir
          -- avec des enseignes dedans. C'etait la premiere version.
          local v = profil.plancher + (profil.plafond - profil.plancher) * (vv ^ profil.gamma)
          local nr, ng, nb = versRGB(hh, ss * profil.desaturation, v)
          -- Le melange suit l'obscurite d'origine : une facade dans l'ombre
          -- vire franchement au bleu nuit, une surface eclairee garde sa
          -- matiere.
          local m = profil.melange * (1 - vv * 0.7)
          R[i] = nr * (1 - m) + tr * m
          G[i] = ng * (1 - m) + tg * m
          B[i] = nb * (1 - m) + tb * m
        end
      end
    end
  end

  -- Halo : ce sont les neons qui diffusent, pas chaque pixel qui cherche un
  -- neon. Balayer le voisinage de toute l'image coutait cinquante fois plus
  -- pour le meme resultat.
  if halo and halo.rayon > 0 then
    local rayon = halo.rayon
    for n = 1, #neons do
      local nx, ny, nr, ng, nb = neons[n][1], neons[n][2], neons[n][3], neons[n][4], neons[n][5]
      for dy = -rayon, rayon do
        local y = ny + dy
        if y >= 0 and y < h then
          for dx = -rayon, rayon do
            local x = nx + dx
            local d2 = dx * dx + dy * dy
            if x >= 0 and x < w and d2 > 0 and d2 <= rayon * rayon then
              local i = y * w + x
              -- On n'allume que ce qui est deja opaque : un halo sur le vide
              -- ferait une frange autour du plan une fois pose sur le suivant.
              if A[i] > 0 then
                local f = halo.force * (1 - math.sqrt(d2) / (rayon + 1))
                R[i] = borne(R[i] + nr * f, 0, 1)
                G[i] = borne(G[i] + ng * f, 0, 1)
                B[i] = borne(B[i] + nb * f, 0, 1)
              end
            end
          end
        end
      end
    end
  end

  -- Quantification. Le Bayer se pose AVANT la recherche du plus proche voisin :
  -- il ne fabrique pas de couleur, il decide seulement de quel cote de la
  -- frontiere tombe un pixel — c'est ce qui rend un degrade de ciel sur cinq
  -- bleus au lieu de trois bandes franches.
  for y = 0, h - 1 do
    local base = y * w
    local rangee = BAYER[(y % 4) + 1]
    for x = 0, w - 1 do
      local i = base + x
      if A[i] == 0 then
        img:drawPixel(x, y, app.pixelColor.rgba(0, 0, 0, 0))
      else
        local e = (rangee[(x % 4) + 1] / 16 - 0.46875) * trame
        local c = plusProche(borne(R[i] + e, 0, 1), borne(G[i] + e, 0, 1), borne(B[i] + e, 0, 1))
        img:drawPixel(x, y, app.pixelColor.rgba(
          math.floor(c[1] * 255 + 0.5),
          math.floor(c[2] * 255 + 0.5),
          math.floor(c[3] * 255 + 0.5),
          A[i]))
      end
    end
  end

  P.appliquer(sprite)
  app.command.SaveFileCopyAs{ filename = DST .. '/' .. nom .. '.png' }
  print(string.format("  %-14s %4dx%-4d %6d neon(s)", nom, w, h, #neons))
  sprite:close()
end

----------------------------------------------------------------------------

print('Etalonnage nuit des plans de parallaxe')
for _, entree in ipairs(reglages.images) do
  local profil = reglages.profils[entree.profil]
  if not profil then error("profil inconnu : " .. tostring(entree.profil)) end
  etalonner(entree.nom, profil)
end
print('Fait.')
