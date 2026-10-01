---
name: SaveMD
description: Save any web page as clean Markdown, with every image. The site is a hardware-store seed rack where every saved page is a packet.
colors:
  tomato: "#d33a2c"
  tomato-deep: "#a3281e"
  tomato-press: "#c3301f"
  pea-deep: "#2f6b2c"
  marigold: "#f2c24d"
  brand-green: "#1f883d"
  ink: "#1a2a44"
  ink-soft: "#3a4962"
  buff: "#f3e8c6"
  buff-deep: "#e9daa9"
  stock: "#f8f2df"
  ground: "#efe3bd"
  card-white: "#fffaf0"
typography:
  display:
    fontFamily: "'Roboto Serif', Georgia, serif"
    fontSize: "clamp(3.4rem, 5.8vw, 5.5rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.004em"
    fontVariation: "'wdth' 62"
  script:
    fontFamily: "'Yellowtail', 'Brush Script MT', cursive"
    fontSize: "clamp(2.4rem, 4.2vw, 4rem)"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "'Roboto Serif', Georgia, serif"
    fontSize: "clamp(1.9rem, 3vw, 2.6rem)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 66"
  title:
    fontFamily: "'Roboto Serif', Georgia, serif"
    fontSize: "clamp(19px, 1.9vw, 22px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.03em"
    fontVariation: "'wdth' 72"
  button:
    fontFamily: "'Roboto Serif', Georgia, serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 72"
  label:
    fontFamily: "'Roboto Serif', Georgia, serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.14em"
    fontVariation: "'wdth' 72"
  body:
    fontFamily: "'Old Standard TT', Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  window: "2px"
  packet: "3px"
  panel: "4px"
  button: "6px"
  round: "50%"
spacing:
  gutter: "clamp(14px, 3.4vw, 44px)"
  panel-gap: "clamp(18px, 2.4vw, 30px)"
  panel-pad: "clamp(26px, 3.4vw, 46px)"
  hero-pad: "clamp(28px, 3.6vw, 52px)"
  row: "14px"
  block: "26px"
components:
  button-primary:
    backgroundColor: "{colors.tomato}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "17px 26px"
  button-primary-hover:
    backgroundColor: "{colors.tomato-press}"
  button-ghost:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "17px 26px"
  button-ghost-hover:
    backgroundColor: "{colors.card-white}"
  button-small:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.buff}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
  panel:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  packet-face:
    backgroundColor: "{colors.buff}"
    textColor: "{colors.ink}"
    rounded: "{rounded.packet}"
    padding: "10px 15px 70px"
  packet-back:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.packet}"
    padding: "16px 16px 70px"
  rack-lip:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.pea-deep}"
    rounded: "{rounded.packet}"
    height: "78px"
  badge:
    backgroundColor: "{colors.tomato}"
    textColor: "#ffffff"
    rounded: "{rounded.packet}"
    padding: "8px 12px 7px"
  step-numeral:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "46px"
  inset-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "18px"
---

# Design System: SaveMD

## Overview

**Creative North Star: "The Seed Packet Rack"**

A saved page is a seed packet: the page as you saw it on the front, the plain Markdown it became on the back. The site is a hardware-store rack of them, printed on fibered buff stock in a small set of flat seed-catalogue inks (tomato red, pea green, marigold, ink navy), held in an ink-drawn wire rack behind a printed front lip. Everything below the rack is the seed company's own printed matter: double-ruled green panels, ruled almanac tables, numbered planting steps, a guarantee seal.

The voice is a seedsman's: condensed bracketed-serif capitals set heavy and slightly ink-worn, a sign-painter script for names, an old almanac serif for reading, and typewriter Markdown on the packet backs. Density is that of printed ephemera: generous panel padding, tight display leading, hairline rules doing the structural work that boxes and shadows do elsewhere. Every image is real: packet windows are actual pages captured at a 320px viewport, the backs hold the actual saved Markdown, the notice is the real notice.

The world refuses the extension-landing default of headline, browser mockup and feature cards, and it refuses the generic SaaS page named in PRODUCT.md's voice. Depth is print depth: paper sheets stacked behind one another and a soft cast shadow under objects that physically stand off the rack, never glass, glow or gradient chrome.

**Key Characteristics:**
- Paper first: every surface is a flat colour multiplied with a greyscale fibre texture.
- Double rules: frames are an outer stroke plus an inset hairline, drawn with inset box-shadows.
- Condensed capitals via `font-stretch` on one variable serif, not a second condensed family.
- Real artifacts only: captured pages, saved Markdown, the real notice.
- One physical gesture: a packet turns over to show its back.

## Colors

A flat seed-catalogue palette: three printed inks and a navy key line over warm buff paper, with the inks committed at full strength on small areas.

### Primary
- **Packet Tomato** (#d33a2c): the one call to action (Install button), the hero script line, the "Coming soon" badge, the first packet's frame and variety name, and the focus outline. **Tomato Deep** (#a3281e) is its border and the colour of privacy pledge terms; **Tomato Press** (#c3301f) is the primary button's hover.

### Secondary
- **Pea Deep** (#2f6b2c): the structural green. Panel double-rule frames, the rack lip's inner rule and lettering, the footer's double top rule, sprig ornaments beside headlines, the seal's sprig, the second packet's frame, and text links inside panels.

### Tertiary
- **Marigold** (#f2c24d): spot colour only. The guarantee seal disc and the numbered install-step discs, both outlined in ink.

### Neutral
- **Ink Navy** (#1a2a44): all text, key lines, the wire rack, table rules, the third packet's frame, and the small Install button's fill. Hairline rules use it at 35% (`rgba(26, 42, 68, .35)`); packet shadows use it at 35-60%.
- **Ink Soft** (#3a4962): secondary text (store note, captions, credits, "updated" line).
- **Packet Buff** (#f3e8c6): packet front stock. **Buff Deep** (#e9daa9) is the sheets stacked behind a packet.
- **Card Stock** (#f8f2df): panels, packet backs, rack lip, ghost button.
- **Ground** (#efe3bd): the page itself, under the fine paper-ground texture.
- **Card White** (#fffaf0): inset cards inside panels (the notice figure, the almanac table wrap) and the ghost-button hover. The whitest thing on the page, reserved for things being shown.
- **Brand Green** (#1f883d): the SaveMD mark only, as fixed by PRODUCT.md's icon commitment. It is not a UI colour.

### Named Rules
**The Three Inks Rule.** Colour comes from tomato, pea-deep and marigold printed over buff, keyed in ink navy. No other hues, no tints between them, no gradients.

**The Multiply Rule.** Paper surfaces are never flat fills: the colour sits under a greyscale texture with `background-blend-mode: multiply` (`paper-ground.webp` on the page, `paper-stock.webp` on panels, packets and the lip; both from `scripts/make-paper.mjs`). Change the colour, never the texture, to make a new stock.

**The One Tomato Button Rule.** Tomato fills exactly one kind of control: the primary install action. Other buttons are stock (ghost) or ink (small).

## Typography

**Display Font:** Roboto Serif, variable, condensed with `font-stretch` (with Georgia, serif)
**Script Font:** Yellowtail (with Brush Script MT, cursive)
**Body Font:** Old Standard TT, 400/700 and italic (with Georgia, serif)
**Mono Font:** Courier Prime, 400/700 (with Courier New, monospace)

All four are self-hosted woff2 in `site/fonts/` (Latin subset, `font-display: swap`); Roboto Serif carries its full weight (100-900) and width (50-150%) axes.

**Character:** Heavy condensed seedsman capitals shout the name of the thing; a sign-painter script names the variety; a Victorian almanac serif does the reading; a typewriter types the Markdown. Each face has one job and they never trade.

### Hierarchy
- **Display** (900, clamp(3.4rem, 5.8vw, 5.5rem), 0.9, width 62%, uppercase): the hero headline, masked with `ink-wear.webp` for print wear. The privacy page title uses the same voice at clamp(2.6rem, 6vw, 4.6rem).
- **Script** (Yellowtail 400, clamp(2.4rem, 4.2vw, 4rem), 1): the hero's second line, in tomato, rotated -4deg from its left edge. Packet variety names use it at clamp(1.45rem, 2vw, 2.1rem) in the packet's accent.
- **Headline** (900, clamp(1.9rem, 3vw, 2.6rem), 0.98, width 66%, uppercase): panel heads, followed by a sprig. 1.8rem under 640px.
- **Title** (800, 19-22px, 1.15, width 72%, uppercase): FAQ questions, table row heads, privacy pledge terms.
- **Button** (800, 20px, 1, 0.06em, width 72%, uppercase): buttons; 17px on the small button, 18px on full-width mobile buttons.
- **Label** (700-800, 10.5-16px, 0.07-0.2em, width 72%, uppercase): nav, facts strip, table column heads, packet kind line and almanac stats, ledger keys, badge, footer nav. Smaller labels carry wider tracking.
- **Body** (Old Standard TT 400, 18px, 1.55; 17px under 640px): all reading text, max 62-64ch in panels, 34ch for the hero lede at clamp(1.1rem, 1.45vw, 1.28rem). Italic for notes and captions.
- **Mono** (Courier Prime 400, 11px, 1.45): saved Markdown on packet backs, fading out with a mask. Inline `code` and `kbd` are Courier Prime 700 at 0.82em; `kbd` gets a 1px outline with a 2px bottom edge.

### Named Rules
**The One Seedsman Rule.** Every capital-letter voice is Roboto Serif with `font-stretch` between 62% and 72% and `text-transform: uppercase`. Narrower for bigger: 62% display, 66% headlines and the packet arch, 70-72% everything smaller. Do not add a separate condensed family.

**The Script Names Things Rule.** Yellowtail is only for a name or a single short line (the hero's "Keep every image.", packet variety names), never a sentence of body, never a label.

## Layout

Edge gutters are one fluid value, clamp(14px, 3.4vw, 44px), used by the masthead, hero, panels and footer alike. There is no max-width container: the hero and panel grid run gutter to gutter, and reading measure is held by `ch` limits inside panels instead.

- **Hero:** one double-ruled frame holding a two-column grid (4.6fr copy, 7.4fr rack), gap clamp(20px, 3vw, 48px), vertically centred. The facts strip spans both columns at the frame's foot.
- **Panels:** a 12-column grid, gap clamp(18px, 2.4vw, 30px). Rows pair 7 + 5 (notice + privacy), then a full-width guide, then 5 + 7 (install + FAQ), so the heavy side alternates.
- **Rack:** three packets at 32.5% each, fanned with individual rotations (-2.5deg, 0, 2deg) and staggered heights, the middle one raised and on top. The lip overlaps the packets' lower 66px.
- **Rhythm:** 14px for list rows and small gaps, 18px for summary padding and notice padding, 26px between hero blocks; rules (1px at 35% ink, 1.5px full ink) separate items rather than space alone.

### Breakpoints
- **1180px:** the hero stacks; copy max 640px, rack max 820px centred. Facts become 2 x 2.
- **920px:** top nav hides (the small Install button stays, pushed right); every panel goes full width; footer stacks.
- **640px:** body 17px; hero padding 26px 18px 28px; action buttons go full width and drop their sprigs; facts become one column. The rack becomes a shelf: the wire is hidden, packets sit straight at 76% width in a horizontal scroll-snap row, the lip shrinks to 64px. The almanac table unstacks into blocks, its "You get" column set in italic ink-soft.

## Elevation & Depth

Depth is print depth. Surfaces are flat paper; what stands off the page does so the way physical paper does: sheets stacked behind sheets, and a soft, downward, ink-tinted cast shadow under objects that sit forward of the rack. Frames read as printed rules, achieved with inset box-shadows, not as raised cards.

### Shadow Vocabulary
- **Double rule** (`box-shadow: inset 0 0 0 5px rgba(248, 242, 223, .6), inset 0 0 0 6.5px #2f6b2c` inside a 2px pea-deep border): panels, hero, privacy page. Packets, buttons, badge and inset cards use the same construction at 3-4px with their own colours.
- **Packet cast** (`0 16px 26px -14px rgba(26, 42, 68, .6)`): under each packet face.
- **Lip cast** (`0 14px 20px -12px rgba(26, 42, 68, .55)`): under the rack lip.
- **Button cast** (`0 8px 16px -8px rgba(110, 24, 16, .6)`): under the primary button only, tinted toward tomato.
- **Seal drop** (`filter: drop-shadow(0 3px 4px rgba(26, 42, 68, .35))`): the guarantee seal.
- **Stacked sheets:** two pseudo-element sheets behind each packet, offset 6px/-7px and 12px/-14px, in buff-deep and a darker buff, each with a 1px 30% ink edge.

### Named Rules
**The Paper Stands Off Rule.** Only objects that physically sit in front (packets, lip, seal, the primary button) cast a shadow, and every cast falls downward with a negative spread and an ink or tomato tint. Panels and inset cards are printed on the sheet; they get rules, not shadows.

## Shapes

Small, slightly softened corners, as on die-cut card: 2px on the packet window, 3px on packets, lip and badge, 4px on panels, notice card and `kbd`, 6px on buttons and the table wrap. Full circles only for the marigold step numerals and the seal. Borders are always solid ink-family colour, 1-2.5px. The silhouettes that carry the world are drawn in SVG: the wire rack (3px non-scaling ink stroke with rounded corners), the arched "SAVEMD" on each packet, the round seal with text on a circle, and the sprig.

## Components

### Buttons
Printed like a packet's own badge: a double rule inside the colour.
- **Shape:** 6px corners, 2px border, plus an inner ring drawn as `inset 0 0 0 3px <fill>, inset 0 0 0 4px <rule>`.
- **Primary:** tomato fill, tomato-deep border, white text and a 60% white inner rule, flanked by two sprigs (the right one mirrored); 17px 26px padding.
- **Ghost:** card-stock fill, ink border and inner rule, ink text; hover to card white.
- **Small:** ink fill, buff text, a 55% buff inner rule, 12px 20px, 17px type. The masthead Install.
- **Hover / Focus:** lift 2px (`translateY(-2px)`) over 0.25s on the house ease, back to 0 on press; focus is the global 3px tomato outline at 3px offset.

### Panels
- **Corner Style:** 4px.
- **Background:** card stock multiplied with the stock texture.
- **Border:** 2px pea-deep with the double-rule inset (see Elevation).
- **Internal Padding:** clamp(26px, 3.4vw, 46px).
- **Anatomy:** headline + sprig, a dotted rule (a 1.5px ink line with a 3.5px ink dot centred on it, max 260px in panels and 420px in the hero), then content.

### Seed packet (signature)
A button (`aria-pressed`) that turns over in 3D to show the Markdown a page became.
- **Front:** buff stock, 2px accent border with a 1px accent inner rule at 4px; an arched "SAVEMD" in 900 condensed capitals; a window (8:7, 2px ink border, white) holding a real page capture, top-aligned; the variety name in accent script; the kind line in 13px labels at 0.2em; an almanac row of three ruled stats (900 numerals over 10.5px labels).
- **Back:** card stock; a "Saved as Markdown" title over a 1.5px rule; the saved Markdown in Courier Prime 11px fading out at 76%; a ledger of folder and files (ink labels against Old Standard TT values).
- **Accents:** each packet takes one ink via `--accent`: tomato, pea-deep, ink.
- **Motion:** turns with `rotateY(180deg)` over 0.85s on `cubic-bezier(.16, 1, .3, 1)`; only the front sheet turns, the stacked sheets stay. Hover lifts it in its slot over 0.35s (the raised middle packet lifts further). If the visitor has not turned one within 2.4s, the first turns itself once; this is skipped under reduced motion.
- **Reduced motion:** no transforms or translations; front and back cross-fade over 0.3s linear.

### Rack lip
The printed front edge of the wire rack: card stock, 2.5px ink border with a pea-deep inner rule, a cast shadow, and "Save now / Read later" in pea-deep 900 capitals at clamp(22px, 2.5vw, 32px) and 0.14em, either side of a sprig. Decorative (`aria-hidden`).

### Guarantee seal
A 78px marigold disc with an ink outline and inner ring, "FREE · OPEN SOURCE · FREE" set on a circular path in condensed 800 capitals, a pea-deep sprig at the centre, rotated 12deg and overhanging the first packet's top-right corner. One per rack.

### Facts strip
A four-cell row ruled top and bottom in 1.5px ink and divided by 35% ink hairlines, each cell a 26px line drawing (1.6px ink stroke, round caps) beside a 15px label. Two by two under 1180px, one column under 640px.

### Almanac table
Inside a card-white wrap with a 2px ink double rule and 6px corners. Column heads 15px labels over a 2px ink rule; row heads 19px condensed capitals; cells divided by 35% ink hairlines both ways. Unstacks into blocks under 640px.

### Lists and disclosures
- **Pledges:** a definition list, terms in tomato-deep 19px condensed capitals, entries separated by 30% ink hairlines.
- **Install steps:** numbered by CSS counter into 46px marigold discs with a 2px ink outline and a 900 condensed numeral, each step ruled above.
- **FAQ:** `details` ruled top and bottom in 1.5px ink; the question in title type; a drawn plus that rotates 45deg to a cross over 0.35s when open.
- **Badge:** tomato, white 15px labels at 0.12em, 3px corners, a 65% white inner rule.

### Navigation
Masthead: the mark (38px) and "SaveMD" in 900 condensed capitals at 30px, then the nav right-aligned in 16px labels at 0.1em with no underline; hover draws a 2px ink bottom border. The small Install button closes the row. Under 920px only the brand and Install remain. The footer sits under a pea-deep double rule (2px border with a 1.5px inset line), brand left, 16px label nav right.

### Sprig
A 28 x 14 line-and-leaf ornament drawn as an SVG symbol, filled and stroked in `currentColor` (1.3px, round caps), mirrored with `scaleX(-1)`. It follows panel headlines in pea-deep, flanks the primary button and the guide heading, divides the lip, and sits in the seal.

## Do's and Don'ts

### Do:
- **Do** put every paper surface on a texture with `background-blend-mode: multiply`, ground on the page and stock on panels, packets and the lip.
- **Do** frame panels with the green double rule (2px pea-deep border, inset hairline at 6.5px over a 5px stock gap) and inset cards with the same construction in ink.
- **Do** set every capital-letter voice in Roboto Serif with `font-stretch` 62-72% and uppercase, tightening width as size grows.
- **Do** show real artifacts: captures of real pages, the actual saved Markdown, the real notice. Packet windows come from `scripts/site-assets.mjs` at a 320px viewport and DPR 2.
- **Do** use the house ease `cubic-bezier(.16, 1, .3, 1)` for every transition, and give every motion a reduced-motion path that removes transforms.
- **Do** separate items with rules (1px at 35% ink, 1.5px full ink) before reaching for space or boxes.
- **Do** keep the brand mark's green (#1f883d) to the mark itself.

### Don't:
- **Don't** build the extension-landing default: a headline over a browser mockup and a grid of feature cards.
- **Don't** add hues outside tomato, pea-deep, marigold and ink, or gradients between them.
- **Don't** use tomato for any control but the primary install action.
- **Don't** add a second condensed or display family; condense Roboto Serif instead.
- **Don't** set sentences, labels or buttons in Yellowtail.
- **Don't** give panels or inset cards cast shadows; shadows belong to objects standing off the rack, and they fall downward with an ink or tomato tint.
- **Don't** invent screenshots, usage numbers, reviews or testimonials for a packet, a stat or a panel.
