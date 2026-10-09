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
on card borders. On touch screens, homepage cards light up briefly when they enter
the viewport or are tapped. Border Beam supplies one bounded sweep in the
technical designs. The original typography, content and palette remain.

## Design tuning

Each design is applied, checked and committed separately with
`node scripts/apply-motion-design.mjs NUMBER`.

The actual homepage heading animates on entry. Each homepage explicitly names
its own section and card components; feature-page selectors are not reused as a
substitute for the homepage. The entrance values below apply to homepages.

| Design | Heading entrance | Duration | Homepage cards |
| --- | ---: | ---: | --- |
| Drafting | 20px | 0.65s | Service cells and situation cards |
| Kiln | 32px | 0.80s | Service cells and situation cards |
| Signal | 32px | 0.72s | Service cells and situation cards |
| Phosphor | 18px | 0.60s | Cells, situations and the process figure; single border sweep |
| Orbit | 32px | 0.80s | Service and support panels |
| Lumen | 28px | 0.75s | Product window, features, stats and plans |
| Ledger | 24px | 0.65s | Metrics and project panels |
| Console | 22px | 0.65s | Metrics and control panels; single border sweep |
| Pulse | 24px | 0.65s | Task columns |
| Mono | 22px | 0.70s | Callouts and route links |

Ledger, Console and Pulse panels fade without moving, so interactive workspace
controls keep their positions. Phone entrance travel is capped at 20px. Secondary
pages retain their compact entrance profiles. Once GSAP owns an entrance, the
old CSS entrance is suppressed only on those elements, avoiding animation-fill
rules that otherwise mask replay.

On a design homepage, open the bottom-left design menu and choose **Replay page
animation**. Replay returns to the heading and restarts the entrance and card
sequence. If the visitor paused motion, the action reads **Resume page
animation**. Reduced motion and Save-Data show a disabled explanation instead of
silently overriding the visitor's preference.

## Runtime and verification

One local bundle is shared through the published root. No animation CDN,
component service or API is contacted at runtime. The site guide still answers
locally with its existing offline boundary. Motion does not add customer data
collection, enable email delivery or activate real accounts.

Lenis smooths desktop wheel input only. Touch, keyboard navigation, native
anchors and nested scrolling remain available. Its GSAP ticker is attached
only during scrolling and removed when settled. Entrances run once unless
explicitly replayed. Touch card lighting ends after 1.6 seconds; technical border
sweeps end after 2.5 seconds. No new permanent animation loop is added.

Reduced-motion, the existing pause control, hidden tabs and Save-Data suppress
enhancements. Reduced-motion and Save-Data avoid loading the optional bundle.
Import failure or disabled JavaScript leaves page content visible. Focus reveals
any pending content immediately. Existing 3D hero animation is not duplicated.

Build: `npm run build:motion`, then `node scripts/sync-shared.mjs`.
Check: `node scripts/build-motion.mjs --check`.
Browser checks: assemble the site, then run
`ONLY=3 node tests/motion-home-browser.mjs` and
`ONLY=3 node tests/motion-browser.mjs`; repeat with each individual design number.
The new homepage suite checks 40 actual homepage views across desktop, a narrow
touch phone, a touch tablet and reduced motion. It measures rendered heading
opacity, card border visibility, replay, pause/resume, native touch scrolling,
overflow, and workspace controls. Earlier feature-page checks missed the absent
homepage selectors and desktop-only card coverage. CI now runs both suites, plus
the existing original-page and feature/account checks.

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
