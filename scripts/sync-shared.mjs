// Shared files: one source of truth in site/ (design 1), copied into every other design.
//   node scripts/sync-shared.mjs          copy site/<file> over each design's copy
//   node scripts/sync-shared.mjs --check  fail (exit 1) if any copy has drifted
// Files that are meant to differ per design (site.js, styles, hero-intro/hero-depth colours) are not listed.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SHARED = ['hero-ref.css', 'schematic.js', 'extras.js', 'extras.css', 'chrome-loader.js', 'switcher.js', 'switcher.css'];
const DESIGNS = ['design-2', 'design-3', 'design-4', 'design-5', 'design-6', 'design-7', 'design-8', 'design-9', 'design-10'];
const check = process.argv.includes('--check');
let drift = 0;

for (const file of SHARED) {
  const src = `site/${file}`;
  if (!existsSync(src)) continue;
  const want = readFileSync(src);
  for (const d of DESIGNS) {
    const dest = `${d}/${file}`;
    const same = existsSync(dest) && readFileSync(dest).equals(want);
    if (same) continue;
    if (check) { console.error(`drift: ${dest} differs from ${src}`); drift++; }
    else { writeFileSync(dest, want); console.log(`synced ${dest}`); }
  }
}
if (check) {
  if (drift) { console.error(`${drift} shared file(s) out of sync. Run: node scripts/sync-shared.mjs`); process.exit(1); }
  console.log('shared files in sync');
}
