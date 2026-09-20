#!/bin/sh
# Headless QA for a single self-contained HTML file. No installs, no network.
#   assist/qa.sh out/a.html              load, wait 4 s, screenshot + error report
#   assist/qa.sh out/a.html --interact   also: every range to min/max, every <select> option,
#                                        every <button>, a click grid on each canvas, keys Space/S/A/R
#   assist/qa.sh out/a.html --all        both modes, one after the other
# Output: assist/shots/<name>.png|.txt  (interact: <name>-interact.png, -interact-after.png, -interact.txt)
# Exit: 0 clean, 1 problems found, 2 harness failure.
DIR="$(cd "$(dirname "$0")" && pwd)"
[ -z "$1" ] && { sed -n '2,8p' "$0"; exit 2; }
FILE="$1"; shift
if [ "$1" = "--all" ]; then
  node "$DIR/qa.mjs" "$FILE"; A=$?
  node "$DIR/qa.mjs" "$FILE" --interact; B=$?
  [ $A -gt $B ] && exit $A || exit $B
fi
exec node "$DIR/qa.mjs" "$FILE" "$@"
