#!/usr/bin/env bash
# Lance un script Lua Aseprite depuis la racine du projet.
#
#   tools/aseprite.sh tools/aseprite/ts_interior.lua
#
# Pourquoi l'Aseprite Linux et pas celui de Windows : l'executable Windows
# ignore silencieusement les chemins POSIX (il ne cree aucun fichier et sort
# avec le code 0). Il faut donc un binaire natif Linux. L'AppImage n'ayant pas
# FUSE sous WSL, elle est extraite dans le repertoire personnel — voir la
# section Outillage de CLAUDE.md pour la mise en place.

set -euo pipefail

ASEPRITE="${ASEPRITE_BIN:-$HOME/.local/aseprite/squashfs-root/usr/bin/aseprite}"
RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOSSIER_SCRIPTS="$RACINE/tools/aseprite"

if [ ! -x "$ASEPRITE" ]; then
  echo "Aseprite introuvable : $ASEPRITE" >&2
  echo "Mise en place : voir la section Outillage de CLAUDE.md." >&2
  exit 1
fi

if [ $# -lt 1 ]; then
  echo "usage: tools/aseprite.sh <script.lua>" >&2
  exit 1
fi

SCRIPT="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

# Les globales sont injectees par un prelude, faute de moyen de passer des
# variables Lua en ligne de commande.
PRELUDE="$(mktemp /tmp/aseprite-prelude-XXXXXX.lua)"
trap 'rm -f "$PRELUDE"' EXIT
cat > "$PRELUDE" <<EOF
DOSSIER_SCRIPTS = "$DOSSIER_SCRIPTS"
RACINE_PROJET = "$RACINE"
dofile("$SCRIPT")
EOF

"$ASEPRITE" --batch --script "$PRELUDE"
