#!/usr/bin/env bash
# Scaffold design-N from design-5's markup and scripts:   bash scripts/new-design.sh 6 Lumen
set -euo pipefail
n=$1; name=$2; d=design-$n
[ -e "$d" ] && { echo "$d exists"; exit 1; }
cp -r design-5 "$d"
rm -f "$d/README.md" "$d/social/"*
sed -i "s#design-5#design-$n#g; s#layout-design-5#layout-design-$n#g; s#design 5#design $n#g; s#Orbit#$name#g" "$d"/*.html "$d"/*.js "$d"/*.css "$d"/src/*.js 2>/dev/null || true
echo "scaffolded $d ($name)"
