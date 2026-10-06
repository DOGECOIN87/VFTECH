// Fails if any stylesheet has a syntax error. A stray "}" or unclosed "{" silently discards the next rule
// in a browser, which is how a hero button once went invisible with no error anywhere.
import { readdirSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';

const dirs = ['site', 'design-2', 'design-3', 'design-4', 'design-5', 'design-6', 'design-7', 'design-8', 'design-9', 'design-10'];
let bad = 0;
for (const d of dirs) for (const f of readdirSync(d).filter(n => n.endsWith('.css'))) {
  const path = `${d}/${f}`;
  const r = transformSync(readFileSync(path, 'utf8'), { loader: 'css', logLevel: 'silent', sourcefile: path });
  for (const w of r.warnings) {
    bad++;
    console.error(`${path}:${w.location?.line ?? '?'}  ${w.text}`);
  }
}
if (bad) { console.error(`${bad} CSS problem(s)`); process.exit(1); }
console.log('css ok');
