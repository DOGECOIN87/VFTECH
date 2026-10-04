# VFTECH design knowledge base

Reviewed 4 October 2026. This is the working reference for typography, page composition, and future design options.

## Inspiration source

[Christine Austin, IMPACT: 14 Award-Winning Website Designs (& What They Did Right)](https://www.impactplus.com/blog/18-award-winning-website-designs). The URL retains “18”; the reviewed article presents 14 examples and is marked updated July 2026.

Useful lessons, paraphrased from the article:

- Audemars Piguet: motion can explain craftsmanship and detail.
- National Council on Aging and Ocean Health Index: legible type and simple navigation belong at the center of the design.
- ClickUp: group concise explanations with relevant visual examples.
- Wozber: make the process and the eventual result tangible before asking for commitment.
- Wealthsimple: generous space makes different sections easier to recognize.
- SeaStreak: organize navigation around the visitor's task.

These are principles to adapt to VFTECH's audience. The article's examples are references, rather than specifications for reproducing another site's design.

## Primary pages reviewed

- [Audemars Piguet](https://www.audemarspiguet.com/): craftsmanship and brand stories in distinct narrative sections.
- [ClickUp](https://clickup.com/): benefits and an action at the top, followed by a product workspace demonstration with feature controls.
- [Wozber](https://www.wozber.com/en-us): product explanations and resume examples.
- [Wealthsimple](https://www.wealthsimple.com/en-ca): separate product categories and campaign sections.

Live pages change. The observations above describe the pages retrieved on the review date, while IMPACT describes examples chosen for its own article.

## Original VFTECH directions

The pairings and compositions below are our interpretation for VFTECH, not typefaces or layouts claimed to be used by the reference sites.

| Option | Typography | Layout | Intended impression |
| --- | --- | --- | --- |
| 1 · Drafting | IBM Plex Sans headings, IBM Plex Serif reading text, IBM Plex Mono annotations | Measured split hero, sticky section introductions, full-width service ledger | Precise, experienced engineering |
| 2 · Kiln | Instrument Serif display with an italic accent, Manrope text, Plex Mono labels | Magazine cover: broad title, story and chrome object beneath, spacious two-column cards | Warm, thoughtful craftsmanship |
| 3 · Signal | Archivo Black uppercase display, Inter reading text, Plex Mono labels | Poster headline, compact caption and object, numbered sections and bold service grid | Direct, confident, memorable |
| 4 · Phosphor | Martian Mono display, IBM Plex Mono reading text | Console workspace with a persistent desktop contents rail, framed modules, stacked mobile content | Technical clarity and control |
| 5 · Orbit | Space Grotesk display, Inter reading text, Plex Mono labels | Broad headline, asymmetric object/action panels, large feature card beside smaller service cards | Contemporary product studio |

Typography comes first: each direction has its own weight, line height, tracking, measure, and hierarchy. Its layout then reinforces that character. Supporting pages carry the same type system and page composition as the homepage.

## Rules for future passes

- Keep the VF logo geometry intact; build typography around it.
- Give each new option a different reading rhythm and page composition.
- Make website rebuilds, AI integration, advisory, the seven-step process, and the conversation easy to find.
- Keep prices, founder credentials, ownership terms, and service claims consistent between designs.
- Host licensed fonts locally and retain their OFL files in `assets/fonts/`.
- Check fonts actually load, rather than assuming the CSS declaration is enough.
- Review the hero, a content section, and a supporting page at desktop and phone sizes in both themes.
- Check the design toggle preserves the current page, the menu works, and the request composer remains usable.
- Keep motion controls available and honor the visitor's reduced-motion preference.

## Implementation map

`site/` publishes as design 1. `design-3/` publishes at the site root. The other options publish at `design-2/`, `design-4/`, and `design-5/`.

Within each option, `fonts.css` registers local fonts, `typography.css` defines the hierarchy, and `layout.css` defines composition. This keeps later typography and layout decisions easy to review independently.
