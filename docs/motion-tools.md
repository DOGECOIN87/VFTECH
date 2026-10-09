# Motion tools from the reference video

Reference: https://www.tiktok.com/@jackroberts____/video/7694308193089948960

The 41-second clip recommends GSAP for animation, Lenis for smooth scrolling,
React Bits for interactive elements, and also mentions 21st.dev as a component
catalog. The video and its captions were reviewed before choosing effects.

## Acquired sources

- **GSAP 3.15.0** and its ScrollTrigger plugin: pinned npm dependency, compiled locally.
  https://github.com/greensock/GSAP
- **Lenis 1.3.26**: pinned npm dependency, compiled locally.
  https://github.com/darkroomengineering/lenis
- **React Bits**, David Haz, snapshot `d86fccbd477786f94ca7eb891fbe0ec039d3cd3b`:
  AnimatedContent, Magnet and SpotlightCard.
  https://github.com/DavidHDev/react-bits/tree/d86fccbd477786f94ca7eb891fbe0ec039d3cd3b/src/content
- **21st.dev / Magic UI Border Beam**, snapshot `cdb348cb4c72a9b54b554d8617801e479fbc8714`:
  https://21st.dev/@dillionverma/components/border-beam
  https://github.com/magicuidesign/magicui/blob/cdb348cb4c72a9b54b554d8617801e479fbc8714/apps/www/registry/magicui/border-beam.tsx

These are HTML websites, so the selected component effects are adapted directly
to existing elements rather than adding a React renderer or changing layouts.
AnimatedContent supplies the GSAP entrance pattern; Magnet moves only a CTA's
arrow so its hit area stays fixed; SpotlightCard supplies pointer/focus lighting
on card borders. Border Beam is adapted to a single CSS sweep on hover or focus
in the technical designs. The original typography, content and palette remain.

## Design tuning

Each design is applied, checked and committed separately with
`node scripts/apply-motion-design.mjs NUMBER`.

| Design | Entrance | Duration | Card treatment |
| --- | ---: | ---: | --- |
| Drafting | 12px | 0.48s | Precise border light |
| Kiln | 22px | 0.70s | Soft border light |
| Signal | 24px | 0.60s | Firm rise and border light |
| Phosphor | 8px | 0.36s | Single border sweep |
| Orbit | 30px | 0.70s | Longer rise and border light |
| Lumen | 18px | 0.56s | Gentle rise and border light |
| Ledger | 12px | 0.40s | Short, clear entrances |
| Console | 8px | 0.36s | Single border sweep |
| Pulse | 14px | 0.48s | Short entrances; board controls keep their positions |
| Mono | 10px | 0.50s | Quiet article entrances |

## Runtime and verification

One local bundle is shared through the published root. No animation CDN,
component service or API is contacted at runtime. The site guide still answers
locally with its existing offline boundary. Motion does not add customer data
collection, enable email delivery or activate real accounts.

Lenis smooths desktop wheel input only. Touch, keyboard navigation, native
anchors and nested scrolling remain available. Its GSAP ticker is attached
only during scrolling and removed when settled. Entrances run once; card
effects run only during interaction. Mobile entrances use smaller distances.

Reduced-motion, the existing pause control, hidden tabs and Save-Data suppress
enhancements. Reduced-motion and Save-Data avoid loading the optional bundle.
Import failure or disabled JavaScript leaves page content visible. Focus reveals
any pending content immediately. Existing 3D hero animation is not duplicated.

Build: `npm run build:motion`, then `node scripts/sync-shared.mjs`.
Check: `node scripts/build-motion.mjs --check`.
Browser checks: assemble the site, then `ONLY=3 node tests/motion-browser.mjs`;
repeat with each individual design number. The existing full site checks cover
every original page and the feature/account interactions.

The motion checks also exercise chart controls while card effects are active,
native chat-history scrolling, runtime changes to the reduced-motion preference,
and the guide's offline boundary. They caught and corrected sticky-header
overlap in Kiln and mobile footer-control overlap in Lumen and Console.

## Notices

React Bits application adaptations retain David Haz's MIT + Commons Clause
notice in `licenses/react-bits.txt`. Components are used as part of VFTech, not
distributed as a standalone component library. Magic UI's MIT notice is in
`licenses/magic-ui.txt`. The public bundle links to copies of these notices and
Lenis's MIT license under `assets/licenses/`; GSAP notices are preserved in the
generated legal-comment file.
