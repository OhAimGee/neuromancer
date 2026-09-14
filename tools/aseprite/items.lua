-- Objets : les cinq scripts d'intrusion et les six plans d'implants.
--
--   tools/aseprite.sh tools/aseprite/items.lua
--
-- Deux planches de 16x16, une case par objet, dans l'ORDRE de data/hacking.json.
-- L'interface decale la planche par index : reordonner la donnee sans
-- reordonner la planche donnerait le mauvais dessin sans la moindre erreur.
--
-- 16 et non 32 : ces icones se lisent dans une liste, a cote d'un libelle de
-- 7 pixels. A 32 elles seraient des illustrations et ecraseraient le texte.

local L = dofile(DOSSIER_SCRIPTS .. "/lib.lua")
local T = 16

local function planche(nom, cases)
  local sprite = Sprite(#cases * T, T)
  L.palette.appliquer(sprite)
  sprite.layers[1].name = nom
  local img = sprite.cels[1].image
  for i, lignes in ipairs(cases) do
    L.tuileAscii(img, (i - 1) * T, 0, lignes)
  end
  return L.enregistrer(sprite, nom, 'ui')
end

-- --------------------------------------------------------------- SCRIPTS --
-- Chacun a une silhouette differente : dans une liste, c'est la forme qu'on
-- reconnait, pas la couleur.

planche('items_scripts', {
  -- perce_glace : une pointe qui traverse une plaque.
  {
    '................',
    '.......ll.......',
    '.......ll.......',
    '......llll......',
    '......lkkl......',
    '.....lkkkkl.....',
    'cccccckkkkcccccc',
    'cccccckkkkcccccc',
    '.....lkkkkl.....',
    '......lkkl......',
    '.......ll.......',
    '.......ll.......',
    '................',
    '................',
    '................',
    '................',
  },
  -- mimic : deux silhouettes, une seule vraie.
  {
    '................',
    '...bbb....444...',
    '..bbbbb..44444..',
    '..bbbbb..44444..',
    '...bbb....444...',
    '..bbbbb..44444..',
    '.bbbbbbb4444444.',
    '.bbbbbbb4444444.',
    '.bb.b.bb44.4.44.',
    '.bb...bb44...44.',
    '.bb...bb44...44.',
    '.bb...bb44...44.',
    '................',
    '................',
    '................',
    '................',
  },
  -- boucle : un ruban ferme. Le temps qui ne passe plus.
  {
    '................',
    '....jjjjjjjj....',
    '...jkkkkkkkkj...',
    '..jkk......kkj..',
    '..jk........kj..',
    '..jk...jj...kj..',
    '..jk..jkkj..kj..',
    '...jkjkkkkjkj...',
    '....jkkkkkkj....',
    '...jkjkkkkjkj...',
    '..jk..jkkj..kj..',
    '..jk...jj...kj..',
    '..jkk......kkj..',
    '...jkkkkkkkkj...',
    '....jjjjjjjj....',
    '................',
  },
  -- virus_lent : quelque chose qui ronge par le bord.
  {
    '................',
    '...qqqqqqqqqq...',
    '..qrrrrrrrrrrq..',
    '.qrr.rrrr.rrrrq.',
    '.qrrrr.rrrrr.rq.',
    '.qr.rrrrr.rrrrq.',
    '.qrrrrr.rrrr.rq.',
    '.qrrr.rrrrrrrrq.',
    '.qr.rrrrrr.rrrq.',
    '.qrrrrr.rrrrr.q.',
    '.qrr.rrrrrr.rrq.',
    '..qrrrrr.rrrrq..',
    '...qqq.qq.qqq...',
    '.....q..q...q...',
    '................',
    '................',
  },
  -- kuang_mk11 : un virus chinois de rang neuf. Il n'a pas besoin d'elegance.
  {
    '................',
    '....vvvvvvvv....',
    '...vuuuuuuuuv...',
    '..vuu.uuuu.uuv..',
    '.vuuuuuuuuuuuuv.',
    'vuuuvvvvvvvvuuuv',
    'vuuvzzzzzzzzvuuv',
    'vuuvzvvvvvvzvuuv',
    'vuuvzvvvvvvzvuuv',
    'vuuvzzzzzzzzvuuv',
    'vuuuvvvvvvvvuuuv',
    '.vuuuuuuuuuuuuv.',
    '..vuu.uuuu.uuv..',
    '...vuuuuuuuuv...',
    '....vvvvvvvv....',
    '................',
  },
})

-- ----------------------------------------------------------------- PLANS --
-- Ce sont des PLANS voles, pas des implants poses : chacun se dessine sur le
-- meme fond de calque cyan, comme une fiche technique.

local function fiche(corps)
  local lignes = {
    'kkkkkkkkkkkkkkk.',
    'k.............k.',
  }
  for _, l in ipairs(corps) do lignes[#lignes + 1] = 'k.' .. l .. '.k.' end
  lignes[#lignes + 1] = 'k.............k.'
  lignes[#lignes + 1] = 'kkkkkkkkkkkkkkk.'
  lignes[#lignes + 1] = '................'
  return lignes
end

planche('items_plans', {
  -- bande_passante : un tuyau qui s'elargit.
  fiche({ '...........', '..lll......', '.lllllll...', 'lllllllllll', '.lllllll...', '..lll......', '...........', '...........', '.iiiiiiiii.', '...........' }),
  -- reflexes_neuraux : un arc nerveux.
  fiche({ '.....l.....', '....lll....', '...l.l.l...', '..l..l..l..', '.l...l...l.', '.....l.....', '...lllll...', '..l.....l..', '...........', '.iiiiiiiii.' }),
  -- coprocesseur : une puce a pattes.
  fiche({ '...........', '..l.l.l.l..', '.lllllllll.', '.l.......l.', '.l.lllll.l.', '.l.l...l.l.', '.l.lllll.l.', '.lllllllll.', '..l.l.l.l..', '...........' }),
  -- filtre_noir : une grille devant une source.
  fiche({ '...........', '...vvvvv...', '..v.....v..', '.l.l.l.l.l.', '.l.l.l.l.l.', '.l.l.l.l.l.', '.l.l.l.l.l.', '..v.....v..', '...vvvvv...', '...........' }),
  -- lentilles_molly : la bande miroir, en coupe.
  fiche({ '...........', '...........', '.lllllllll.', 'lzzzzzzzzzl', 'lzcccccccbl', 'lzbbbbbbbbl', '.lllllllll.', '...........', '.i.......i.', '...........' }),
  -- glandes_toxiques : deux sacs et un conduit. C'est ce qu'on t'a pose.
  fiche({ '...........', '...uu.uu...', '..uvvuvvu..', '..uvvuvvu..', '...uu.uu...', '.....u.....', '.....u.....', '....uuu....', '...u...u...', '...........' }),
})
