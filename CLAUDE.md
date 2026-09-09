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

**In scope:** the home page only — screens 1 through 4 below.

**Out of scope:** all four detail pages. Links resolve to placeholder routes.

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

**Current solution:** the letterforms are painted as a **black overlay above the tile layer** (`wordmark.png`, transparent except the letters). On a black background a black letterform is indistinguishable from a hole, so it reads as negative space carved into the brain — "it was always written there, you just couldn't see it."

Two consequences, both desirable:

- The overlay is invisible until white tiles arrive behind it, so during the intro the letters emerge on their own as the brain assembles. No extra choreography needed.
- Letters cut across tiles at arbitrary points rather than aligning to tile edges. Under the carved-in reading this is correct.

**Do not use CSS `mask-image` on the brain container.** A mask creates a stacking context and will flatten `transform-style: preserve-3d` on the tiles beneath it, breaking the flip. The overlay approach avoids this entirely.

**Removal on flip:** the wordmark is hidden at the **midpoint of the flip**, when every tile is edge-on at 90 degrees and effectively invisible. It is never seen to fade — there is nothing on screen when it goes.

**Future:** the wordmark will eventually be redrawn on the grid. When that happens, delete the overlay and mark those tiles empty in the map. No other part of the architecture changes.

## 4. Region map

| Region | Colour | Position | Destination |
|---|---|---|---|
| Experiences | Purple | Top-left | `/experiences` |
| Coaching | Blue | Top-right | `/coaching` |
| Backstory | Red | Bottom-left | `/backstory` |
| Playground | Yellow | Bottom-right | `/playground` |

Placeholder hex values sampled from the reference artwork — **confirm against Canva before build:**

```
--purple:  #7B2382
--blue:    #0B63C5
--red:     #D42A18
--yellow:  #F5D046
--white:   #FFFFFF
--black:   #000000
```

Note: "Backstory" replaces "Our Story" everywhere — nav label, route, page title, and the existing drafted page copy.

---

## 5. Screen 1 — Intro

Runs on **every visit**. No first-visit-only cookie.

1. Full black screen.
2. One white tile throbs at dead centre.
3. Tiles flip to white in sequence outward from that tile — *thak, thak, thak* — until the full brain has assembled.
4. `OPEN SOCH` is never drawn. It emerges as the tiles that never flip.

**Timing:** total sequence 1.5–2.5s. Individual tile flip ~120–180ms, staggered.

**Skip:** any click, tap, or key press snaps immediately to the completed white brain. This matters — the team will load this site many times a day and the animation must never become a toll.

**Lock:** the brain is inert during assembly. Hover does nothing until the sequence completes or is skipped.

---

## 6. Screen 2 — Rest

The entire home page. Brain floating centre, nothing else but the footer.

- Idle motion: a slow breathing/drift, enough to read as alive and invite the cursor. Subtle — this is an invitation, not a performance.
- No scroll. No nav. No headline.
- **Footer:** one quiet line at the bottom of the viewport — contact, privacy policy, copyright. Small, low-contrast, permanent across all states.

---

## 7. Screen 3 — Hover

**Trigger:** cursor enters the brain's **bounding box** (not the tile silhouette). Forgiving by design.

On entry, simultaneously:

1. Every tile flips from white to its region colour.
2. The wordmark disappears — it does not persist or relocate. The colour state is regions and labels only.
3. The four region clusters slide outward from centre along their own diagonals: purple up-left, blue up-right, red down-left, yellow down-right. **Distance: 0.5 to 1.0 tile width. No more.** Enough to open the seams; not enough to stop it reading as one brain.
4. Detached floating pixels flip and travel with their assigned region.

**Flip duration:** ~250–350ms, eased.

**Exit:** cursor leaves the bounding box → clusters close, tiles flip back to white, wordmark returns.

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

## 10. Open items

1. **Touch.** There is no hover on mobile. The entire interaction model depends on it. Needs a decision before this ships — not before it's built, but before it's public.
2. **Label placement.** Floating near the live region, or fixed toward its corner outside the brain.
3. **Confirmed hex values** from Canva.
4. ~~Region cut lines~~ — **resolved.** Straight centre split: between columns 11 and 12, between rows 9 and 10. No tile falls on a line. Loose pixels are assigned automatically by coordinate. Tile counts: purple 73, blue 64, red 46, yellow 59.
