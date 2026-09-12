# Opensoch — Website Build Reference

This document supersedes the previous `CLAUDE.md`. The earlier version described a yellow tile-grid background and a radial flip wave revealing the brain. That direction is retired. The site is now black, and the interaction model has changed.

---

## 1. What Opensoch does

Three service areas. These are the resolved definitions and should be treated as fixed copy.

- **Coaching** — We serve as coaching partners for startup incubators offering structured guidance through our Opensoch Approach and network of experts.
- **Experiences** — We design play based community experiences and workshops.
- **Playground** — We invest in original ideas and collaborative experiments.

Plus **Backstory**, the company's own history.

---

## 2. Scope

**In scope:** the home page — screens 1 through 4 below — plus the seam that joins it to the rest of the site: the dive out of a region, the arrival on a section page, and the way back to the brain (section 11).

**Also in scope now:** the four section pages, built from the Claude Design artboards and served at `/experiences`, `/coaching`, `/backstory` and `/playground`.

**Out of scope:** their content and design, which is the artboards' business and is marked final. Do not rewrite the copy on Experiences, Coaching or Backstory.

**Explicit non-goals:** SEO, meta tags, structured data, analytics, marketing conventions. The home page is deliberately unconventional and content-light. Do not add hero copy, a nav bar, scroll sections, or a cookie banner. Do not propose changes on these grounds.

---

## 3. The tile map

**Everything runs off one tile map.** There is no second artwork. The colour state is the same grid with different fills.

**Measured from the supplied logo:**

- Grid: **23 columns x 19 rows**
- Filled tiles: **242** (includes the detached floating pixels)
- Source tile size: ~19.2px in the original artwork
- Canonical data: `tilemap.json` — `{cols, rows, cutCol, cutRow, tiles:[[col,row,region],...]}` where region is `tl|tr|bl|br`

Tiles are square. Tile size on screen is derived: `--t: calc(var(--brain-w) / 23)`.

### The wordmark is an overlay, not tiles

`OPEN SOCH` is drawn in HK Modular at roughly a 13px stroke weight on a ~19px tile grid. It is **finer than the tiles and cannot be expressed in them** — quantising it to the grid produces illegible shapes. This was tested; it does not work.

**Current solution:** the letterforms are painted as a **black overlay above the tile layer**, drawn as **inline SVG** in `index.html`. On a black background a black letterform is indistinguishable from a hole, so it reads as negative space carved into the brain — "it was always written there, you just couldn't see it."

The overlay used to be `wordmark.png`. That export was faulty — it contained only five of the eight glyphs (`PE` / `OCH`; the `O` and `N` of OPEN and the `S` of SOCH were missing), so the assembled brain never showed the full wordmark. The PNG is kept in the repo as the metric reference only; nothing loads it.

**Letterform geometry**, measured off that artwork and now expressed as vector: glyphs sit on a **5x5 module grid**, stroke **26 units**, glyph box **130**, advance **170**, line pitch **182**, outer corner radius **one stroke unit**. Each glyph is one centreline path stroked at 26 with round joins and butt caps. The five glyphs the PNG did contain match it to within antialiasing; **the `O`, `N` and `S` are reconstructions to the same measured system and should be checked against the real HK Modular file.**

**Placement** is set on the tile grid by `--wm-cols` / `--wm-left` / `--wm-top` (block width and origin, in tiles), not by stretching an image to the brain's bounding box. The values are fitted so every letterform pixel lands on a filled tile: a black letter over a gap in the silhouette is invisible. Currently **12 / 6.75 / 6.75**, measured at zero ink off the silhouette. Re-fit if the tile map changes.

**Measured — the tile map is 17 tiles short.** The official artwork arrived with the design handoff as `assets/img/opensoch-pixel-logo.png` (2293x1912, which is the 23x19 grid at ~100px a tile; the surround is transparent, so the silhouette is simply the opaque pixels). Sampling it against `tilemap.json`:

- the logo has **259** tiles, our map has **242** — 93.4% agreement
- **0** tiles in our map are absent from the logo, so nothing here is wrong
- **17** tiles in the logo are missing from our map, all on the two flanks of the `OPEN` band:

```
left   3,5  3,6  3,7  3,10  4,5  4,11  4,12  5,5  5,11  5,12  6,12
right  17,5 17,6 18,6 19,5  19,6 19,7
```

That is exactly the gap that stopped the wordmark sitting at its real ~16.5-tile proportion: the silhouette was too narrow on both sides of `OPEN`, so the `N` and the `S` ran off it. Adding those 17 tiles (regions assigned by coordinate as usual) and re-running `tools/fit-wordmark.mjs` should let the wordmark go to full size. **Not yet applied** — it changes the artwork and wants reviewing on its own.

Two consequences, both desirable:

- The overlay is invisible until white tiles arrive behind it, so during the intro the letters emerge on their own as the brain assembles. No extra choreography needed.
- Letters cut across tiles at arbitrary points rather than aligning to tile edges. Under the carved-in reading this is correct.

**Do not use CSS `mask-image` on the brain container.** A mask creates a stacking context and will flatten `transform-style: preserve-3d` on the tiles beneath it, breaking the flip. The overlay approach avoids this entirely.

**Removal:** the wordmark dissolves together with the white logo it is carved from, at the end of the load sequence (section 5). It is not present in the colour state at all, so nothing has to remove it on hover.

**Future:** the wordmark will eventually be redrawn on the grid. When that happens, delete the overlay and mark those tiles empty in the map. No other part of the architecture changes.

### The white logo is one shape, not 242 tiles

The logo beat in the middle of the load sequence is `#solid`: a single SVG `<path>` whose subpaths are the 242 tiles. Adjacent tiles are subpaths of one fill, so the edges they share are interior to that fill and no seam is drawn between them — at any zoom, and under the breathing scale, which is what made the tile grid show through the white logo when it was 242 separate elements.

`#solid` belongs to the load sequence only, and the handover runs one way:

- the wave lands → `#solid` fades up over `--heal` (300ms) on top of the finished tiles, then the tiles drop out. The seams heal into the logo.
- the logo holds → then `#solid` dissolves over `--reveal`, and the tiles — now their region colours — take back over.

After that `#solid` never returns. The colour state and the hover state are both tiles, and the tile grid is visible in both, as it is in the reference artwork.

Opacity on `.region` is only ever 0 or 1, never in between: a fractional opacity there makes a stacking context and flattens `preserve-3d` on the tiles beneath it, which breaks the flip exactly the way `mask-image` does.

`#solid` and `#wordmark` both live **inside** `#brain` so they ride the breathing transform. The wordmark used to be a sibling of `#brain` and did not, so the letters drifted against the silhouette over the 6s cycle.

### The midpoint colour swap is retired

Colour now arrives in the load sequence rather than on hover, so by the time anything flips the tiles are already their region colour. There is no colour change left to hide inside the flip, and `--mid` is gone. Should a white-to-colour flip ever come back, the technique it replaced was: run the transform for the full duration but swap `background-color` with `0ms var(--mid)`, so the colour changes instantly at 90 degrees when the tile is edge-on and cannot be seen changing.

## 4. Region map

| Region | Colour | Position | Destination |
|---|---|---|---|
| Experiences | Purple | Top-left | `/experiences` |
| Coaching | Blue | Top-right | `/coaching` |
| Backstory | Red | Bottom-left | `/backstory` |
| Playground | Yellow | Bottom-right | `/playground` |

**Confirmed** from the Claude Design handoff, whose brand constraints are locked. These replaced the earlier eyedropper guesses and live in `assets/palette.css`, which the brain and every section page link. Nothing else should declare a colour.

```
--purple:  #81007b
--blue:    #0055bf
--red:     #c91a09
--yellow:  #f2cd37
--white:   #ffffff
--black:   #000000
```

Note the section pages use `#c91a09` as their shared UI accent regardless of which region you arrived from. The four colours are the brain's language; inside the site they are decorative. That is the design's call, not a mismatch.

Note: "Backstory" replaces "Our Story" everywhere — nav label, route, page title, and the existing drafted page copy.

---

## 5. Screen 1 — Load sequence

Runs on **every visit**. No first-visit-only cookie. Three beats.

**Beat 1 — the preloader.** Full black screen. One white tile throbs at dead centre, then tiles flip to white in sequence outward from it — *thak, thak, thak* — until the full brain has assembled. `OPEN SOCH` is never drawn; it emerges as the tiles that never flip.

This is a real preloader, not a fixed-length animation. The sequence advances only when the wave has landed **and** the page's assets have decoded. With no external artwork that is just the wave, but adding the official logo as an `<img>` makes it genuinely awaited rather than raced.

**Beat 2 — the logo.** The assembled tiles hand over to the solid white logo (section 3) and it holds, briefly. This is the only point in the site where the logo proper — white brain, `OPEN SOCH` carved out of it — is on screen.

**Beat 3 — the reveal.** The white logo and the wordmark dissolve together over `--reveal`, uncovering the four region colours underneath. That colour state is the home page.

**Timing:** roughly 3.5s end to end; the constants are `HOLD`, `SPREAD`, `LOGO_HOLD` in the script and `--reveal` in `:root`.

**Returning from a section** is not a fresh visit: the navigation logo carries `?from=<region>`, and home then opens directly on the closed colour state with that region's colour receding, rather than replaying the load sequence. A direct visit to `/` still gets all three beats.

**Skip:** any click, tap, or key press snaps immediately to the colour state — past the logo, not to it. This matters — the team will load this site many times a day and the sequence must never become a toll.

**Lock:** the brain is inert throughout. Hover does nothing until the reveal has finished or the sequence is skipped.

---

## 6. Screen 2 — Rest

The entire home page. Brain floating centre, nothing else but the footer.

- The brain at rest is the **four region colours**, whole and joined — purple, blue, red, yellow, tile grid visible, exactly as the reference artwork. Not the white logo: that is a beat in the load sequence and does not come back.
- No wordmark. It leaves with the white logo and the colour state is regions and labels only.
- No labels, no glow, no pulses. All four regions sit at full colour; nothing is picked out until the cursor arrives.
- Idle motion: a slow breathing/drift, enough to read as alive and invite the cursor. Subtle — this is an invitation, not a performance.
- No scroll. No nav. No headline.
- **Footer:** one quiet line at the bottom of the viewport — contact, privacy policy, copyright. Small, low-contrast, permanent across all states.

---

## 7. Screen 3 — Hover

**Trigger:** cursor enters the brain's **bounding box** (not the tile silhouette). Forgiving by design.

The brain is already coloured when the cursor arrives, so the hover breaks it open rather than changing what it is.

On entry, simultaneously:

1. Every tile flips 180 degrees. The colour does not change — the flip is the break, a beat where the whole brain turns edge-on and comes back.
2. The four region clusters slide outward from centre along their own diagonals: purple up-left, blue up-right, red down-left, yellow down-right. **Distance: 0.5 to 1.0 tile width. No more.** Enough to open the seams; not enough to stop it reading as one brain.
3. Detached floating pixels flip and travel with their assigned region.
4. The live region's label appears (section 8).

**Flip duration:** ~250–350ms, eased.

**Exit:** cursor leaves the bounding box → clusters close, tiles flip home, labels go. It returns to the joined colour state, never to the white logo.

**Click:** a click on any tile dives into that region (section 11). Detection is the same per-tile test the hover uses, so the clickable area is the region's real shape — clicking a notch between regions does nothing, exactly as it lights nothing. The four labels trigger the same dive.

---

## 8. Screen 4 — Region states

Region detection is **per-tile**, not per-quadrant-box.

### Live region (cursor over a tile)

- Region glows.
- **Neuron firing** — pulses travel tile-to-tile along the region's own cells, lighting each briefly as they pass. **Constrained to the grid: orthogonal runs, 45° only if needed.** Freeform diagonals fight the pixel geometry and read as scribble laid over the artwork rather than the brain conducting.
- Other three regions dim and desaturate.
- Label appears. Labels are hover-only — never shown in the neutral or white states.

Reference for the glow feel: Maintainit.digital's card treatment. Note that reference works because its boxes have generous dead space between them. These regions share every internal edge, so a soft outer bloom will bleed into its neighbours and read as smudge. The dimming of the other three and the break-apart gutters are what make the glow legible — both are load-bearing, not decoration.

### Neutral region state (cursor inside bounding box, not on any tile)

A pixel brain has real notches inside its box. The cursor will land in them.

- All four regions at equal mid-brightness.
- No glow, no neuron pulses, no label.
- Brain stays flipped and expanded.

This is a defined state, not a fallback. Without it, dragging across the brain produces flicker.

### Labels

Placement is unresolved — see open items. Whatever is chosen must survive four irregular shapes of differing heights.

---

## 9. Technical notes

- Only the brain's tiles are real DOM elements. Background is flat black — no grid, no gradient.
- Flip is a CSS 3D rotation on each tile. Batch by region for the cluster translate.
- Neuron pulses should be driven off the tile map, not hand-authored paths, so they survive artwork changes.
- Respect `prefers-reduced-motion`: skip the intro to the assembled state, keep the flip but drop the idle drift and the pulses.
- Keyboard: the four regions must be reachable and activatable without a mouse, with visible focus.

---

## 11. The site beyond the brain

The brain is the front door. Everything behind it is an ordinary site with its own navigation, and the two are joined by one transition made of the same material as the preloader.

### Structure

| URL | | |
|---|---|---|
| `/` | the brain | load sequence, colour rest state, hover, dive |
| `/experiences` | Experiences | purple, top-left |
| `/coaching` | Coaching | blue, top-right |
| `/backstory` | Backstory | red, bottom-left |
| `/playground` | Playground | yellow, bottom-right — a blog, so it grows post URLs beneath it |

Each section is a single page with its own URL and the site's own navigation. Once someone is inside, they navigate by that nav, not by the brain. The nav's logo is the only way back to the brain, and it returns to the closed colour state.

### Diving in

A click falls into the chosen quadrant rather than cutting to the next page:

1. The live region is frozen — the hit test is invalidated by what follows, and `pointer-events:none` would otherwise drop `:hover` and tear the state down mid-transition.
2. The stage scales up hard (18x, accelerating) with its transform origin on the **tile that was clicked**, so the grid grows out of that exact point.
3. The other three regions go to black using the veil they already dim with — not `opacity` on `.region`, which would flatten `preserve-3d`.
4. A full-screen field of the region's colour closes over the top just as the zoom tops out, so the document swap happens inside flat colour and is never seen.

The click point travels with the navigation as `?from=<region>&x=&y=` (x and y normalised to the viewport).

### Arriving

`assets/transition.js` picks the thread up. The section opens out of the same flat colour, which breaks into a coarse grid of large tiles that clear outward from the exact point the user clicked. Same material as the preloader, so the two halves read as one thing.

### The drop-in contract

Any page — including the real artboards when they land — joins the site by declaring three things and nothing else:

```html
<body data-region="tl">                                   <!-- tl|tr|bl|br -->
<link rel="stylesheet" href="/assets/transition.css">
<script src="/assets/transition.js" defer></script>
<a href="/" data-home>…</a>            <!-- any link back to the brain -->
```

`data-region` sets the colour the page arrives out of. `data-home` is handled by delegation as well as by rewriting the href — the section pages are rendered at runtime, so the nav does not exist when the script first runs. `assets/palette.css` holds the colours and should be the only place the four hexes appear; it is tokens only, with no reset, so it cannot collide with the artboards' own design system.

### Where things live

```
/                      index.html          the brain, self-contained, no dependencies
/experiences  …        <slug>/index.html   the artboards, paths rewritten to absolute
/assets/palette.css                        the four colours, shared
/assets/transition.*                       arrival transition and the way home
/assets/img/                               artwork from the design handoff
/vendor/                                   support.js, image-slot.js, _ds/ - do not edit
```

The artboards were transformed, not rewritten: runtime and design-system paths made absolute, `OpenSoch-*.dc.html` links turned into clean routes, the header mark pointed at `/` with `data-home`, and `data-region`, `<title>`, palette and transition added. Their markup, copy and styling are untouched.

The transition layer styles nothing about the page itself. It paints over whatever is there and gets out of the way, so it cannot collide with the artboards' own design.

---

## 10. Open items

1. **Touch.** There is no hover on mobile. The entire interaction model depends on it. Needs a decision before this ships — not before it's built, but before it's public.
2. **Label placement.** Floating near the live region, or fixed toward its corner outside the brain.
3. **The 17 missing tiles.** Measured, listed in section 3, not applied. Applying them and re-fitting should finally put the wordmark at its official proportion.
4. **The section pages depend on a third-party CDN at runtime.** `vendor/support.js` fetches React 18, ReactDOM 18 and Babel standalone from `unpkg.com` on every page view, then transpiles each page's script in the browser. That is roughly 3MB of third-party JavaScript before anything renders, and the four pages are blank if unpkg is unreachable — which is how they behave in this sandbox, where egress to unpkg and cdnjs is blocked. The brain, by contrast, is one file with no dependencies. Before this is public the runtime should be vendored locally or the pages precompiled.
5. ~~Confirmed hex values~~ — **resolved.** Locked palette supplied with the design handoff; see section 4.
6. ~~The official logo as a file~~ — **resolved.** Arrived as `assets/img/opensoch-pixel-logo.png` with the design handoff.
7. ~~The section designs~~ — **resolved.** Exported from Claude Design and built into the four routes.
8. ~~Region cut lines~~ — **resolved.** Straight centre split: between columns 11 and 12, between rows 9 and 10. No tile falls on a line. Loose pixels are assigned automatically by coordinate. Tile counts: purple 73, blue 64, red 46, yellow 59.
