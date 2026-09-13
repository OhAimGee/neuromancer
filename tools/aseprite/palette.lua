-- Palette Neuromancer — 32 couleurs, source unique de verite.
-- Doit rester identique aux variables --n0..--w1 de src/styles.css.
--
-- Chaque couleur a une cle d'un caractere, utilisee par les tuiles en art ASCII.
-- '.' signifie transparent.

local P = {}

P.cles = {
  -- Noirs et bleus nuit
  ['0'] = 0x05060a, ['1'] = 0x0d1018, ['2'] = 0x161b28, ['3'] = 0x232a3d, ['4'] = 0x333c56,
  -- Gris beton
  ['a'] = 0x4a5570, ['b'] = 0x66718c, ['c'] = 0x8c95ab, ['d'] = 0xb9c0d0,
  -- Magenta neon
  ['e'] = 0x3d0a2e, ['f'] = 0x7a1052, ['g'] = 0xc41e7f, ['h'] = 0xff4fb8,
  -- Cyan neon
  ['i'] = 0x04333d, ['j'] = 0x0a6e7a, ['k'] = 0x12b5c4, ['l'] = 0x5bf0ff,
  -- Orange sodium
  ['m'] = 0x3d1f05, ['n'] = 0x8a4a0d, ['o'] = 0xd4820f, ['p'] = 0xffc247,
  -- Vert malade
  ['q'] = 0x14301a, ['r'] = 0x2e7a35, ['s'] = 0x6ed46b,
  -- Rouge sang
  ['t'] = 0x2e0708, ['u'] = 0x8a1219, ['v'] = 0xe02b32,
  -- Chair
  ['w'] = 0x5c3a2e, ['x'] = 0x9c6b52, ['y'] = 0xd4a284,
  -- Blancs
  ['z'] = 0xe8eef5, ['Z'] = 0xffffff,
}

-- Ordre stable, pour que l'index de palette soit reproductible d'un asset a l'autre.
P.ordre = {
  '0','1','2','3','4',
  'a','b','c','d',
  'e','f','g','h',
  'i','j','k','l',
  'm','n','o','p',
  'q','r','s',
  't','u','v',
  'w','x','y',
  'z','Z',
}

function P.rgba(cle)
  local hex = P.cles[cle]
  if hex == nil then
    error("couleur inconnue dans la palette : '" .. tostring(cle) .. "'")
  end
  local r = (hex >> 16) & 0xff
  local g = (hex >> 8) & 0xff
  local b = hex & 0xff
  return app.pixelColor.rgba(r, g, b, 255)
end

P.TRANSPARENT = app.pixelColor.rgba(0, 0, 0, 0)

--- Applique la palette 32 couleurs au sprite.
function P.appliquer(sprite)
  local pal = Palette(#P.ordre)
  for i, cle in ipairs(P.ordre) do
    local hex = P.cles[cle]
    pal:setColor(i - 1, Color{
      r = (hex >> 16) & 0xff,
      g = (hex >> 8) & 0xff,
      b = hex & 0xff,
    })
  end
  sprite:setPalette(pal)
end

return P
