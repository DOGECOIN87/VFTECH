# VFTech website

A seven-page static site: plain HTML and CSS plus shared behaviour (`site.js`) and a self-hosted Three.js chrome hero. The compiled hero asset is committed, so deployment needs no build step or platform. It runs on any static host (GitHub Pages, Netlify, Cloudflare Pages, S3) by uploading this folder.

| Page | File |
|---|---|
| Home | `index.html` |
| Website rebuilds (tiers, monthly plans) | `websites.html` |
| AI integration | `ai.html` |
| Advisory | `advisory.html` |
| How we work | `process.html` |
| About | `about.html` |
| Contact | `contact.html` |

## Design system

All in `styles.css`:

- **Concept**: the site reads as an engineering drawing set. Each page is a "sheet", and the footer is the title block ("Owner of record: You").
- **The 60° equilateral triangle** from the monogram sets the angles and motifs: parallelogram buttons and tabs, 60° chamfers, the lattice figure and dimension lines.
- **The golden ratio** sets proportion and rhythm:
  - type scale in steps of √φ (17 → 72 px);
  - Fibonacci spacing (5–144 px);
  - 61.8 / 38.2 column splits;
  - body line-height 1.618.
- **Type**: Archivo for headings, Source Serif 4 for body text, IBM Plex Mono for annotation, all from Google Fonts.
- **Logo**: inline outlined SVG. No font file is embedded.
- **Themes**: light and dark. The visitor's choice is remembered.

## Before launch

- **Contact details**: replace the placeholders `hello@vftech.example` and `(000) 000-0000`. They appear on every page (in the footer) and three times in `contact.html`.
- **Booking form**: connect it to delivery. Today it composes the request and offers to copy it, and says plainly that nothing has been sent. The form handler is in `site.js` (`#book-form`).
- **Wordmark**: the lockup uses the TT Norms Pro version of the wordmark, built from an evaluation-only trial font. Buy a TypeType license before publishing, or switch to the Montserrat lockup in `/logo`.
- **Copy to confirm**:
  - the firm name (the source doc says "VF Associates"; the site says "VFTech");
  - the line "faster turnaround than a traditional agency at a comparable price" on `websites.html`.

## Chrome hero and schematic motion

The home hero uses the exact two contours from `logo/vftech-icon.svg`, extruded
0.24 world units with small bevels. Its local studio environment supplies the
mirror-polished chrome reflections; there are no remote HDR or model requests.
The sequence draws the SVG construction, grows the extrusion over 3.2 seconds,
then rotates clockwise around the vertical axis once every eight seconds (viewed
from above). The construction lattice tilts and breathes independently. The AI
workflow diagram also reveals its steps in order when scrolled into view.

- Both pause buttons control the hero, diagrams and footer. The preference is remembered.
- Reduced-motion visitors see a still chrome logo; no WebGL or JavaScript leaves the original SVG construction visible.
- The render loop stops offscreen or in a hidden tab. Rendering is capped at 30 FPS and device pixel ratio at 1.75.
- Context loss returns to the SVG fallback. Light/dark themes use the same scene with adjusted exposure.
- Source: `site/src/chrome-hero.js`. Built output: `site/assets/chrome-hero.js`.
- To edit/rebuild, from the repo root: `npm ci`, `npm run check`, `npm run build`.
- The production output and `THREE-LICENSE.txt` must ship with the site.
