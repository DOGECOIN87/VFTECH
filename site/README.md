# VFTech website

A seven-page static site: plain HTML and CSS plus one small script (`site.js`), with no build step and no platform. It runs on any static host (GitHub Pages, Netlify, Cloudflare Pages, S3) by uploading this folder.

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
