#!/usr/bin/env bash
# Builds the published site in _site/, exactly as GitHub Pages serves it:
#   design 3 at the root; designs 1, 2, 4 and 5 in design-N/ (design 1's source is site/).
# Usage: scripts/assemble.sh [stamp]
#   The stamp (the Pages run number in CI) is appended as ?v=<stamp> to every local stylesheet and
#   script URL, so browsers never mix a new page with the previous deploy's CSS or JS.
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP="${1:-dev}"

rm -rf _site
mkdir -p _site
cp -r design-3/. _site/
rm -rf _site/src _site/README.md
for n in 1 2 4 5 6 7 8 9 10; do
  src=design-$n; [ "$n" = 1 ] && src=site
  mkdir -p "_site/design-$n"
  cp -r "$src/." "_site/design-$n/"
  rm -rf "_site/design-$n/src" "_site/design-$n/README.md" _site/design-$n/preview-*.png \
         _site/design-$n/social/*.mp4 _site/design-$n/social/*.gif
done

find _site -name '*.html' -exec sed -i -E \
  's#(href|src)="((\.\./)?(styles\.css|site\.js|hero-intro\.js|hero-depth\.js|schematic\.js|compare\.css|remix\.css|fonts\.css|typography\.css|layout\.css|hero-ref\.css|chrome-loader\.js|extras\.js|extras\.css|saas\.css|ledger\.css|console\.css|pulse\.css|switcher\.css|switcher\.js|signature\.css|signature\.js|showcase\.js|ledger\.js|console\.js|pulse\.js|logo-motion\.js|assets/chrome-hero\.js))"#\1="\2?v='"$STAMP"'"#g' {} +

echo "assembled _site/ (stamp $STAMP)"
