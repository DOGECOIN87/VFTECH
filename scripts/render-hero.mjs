// Renders a design's hero image from its three.js scene source, in headless Chromium (SwiftShader WebGL).
//   node scripts/render-hero.mjs <design-N/src/hero-image.js> <out.png> [width=2400] [height=1350] [variant=dark|light]
// The scene reads ?v=<variant>, draws once into <canvas id="c">, then sets window.__done. Finish the PNG with
// scripts/hero-post.py (bloom, vignette, grain; writes .avif and .webp).
import { writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import esbuild from 'esbuild';
import { chromium } from 'playwright';

const [entry, out, W = '2400', H = '1350', variant = 'dark'] = process.argv.slice(2);
if (!entry || !out) { console.error('usage: node scripts/render-hero.mjs <scene.js> <out.png> [w] [h] [dark|light]'); process.exit(1); }
const built = await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, nodePaths: [path.resolve('node_modules')], logLevel: 'error' });
const html = `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="${W}" height="${H}" style="width:${W}px;height:${H}px;display:block"></canvas>
<script type="module">${built.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>')}</script></body></html>`;
const server = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(html); });
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('scene error:', e.message));
await page.goto(`http://localhost:${server.address().port}/?v=${variant}`);
await page.waitForFunction(() => window.__done === true, null, { timeout: 300000 });
const data = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log('wrote', out);
await browser.close(); server.close();
