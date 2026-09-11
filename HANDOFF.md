# Handoff

Everything needed to keep building the Opensoch home page.

## Run it

No build step, no dependencies, no framework.

```
python3 -m http.server
```

then `http://localhost:8000`. It will open from `file://` too, but serve it if you can — the wordmark measuring tool assumes a served page.

## Read `CLAUDE.md` first

`CLAUDE.md` is the spec and it is current. It carries the decisions and, more usefully, the things that were tried and rejected — so it saves you rediscovering them. The two sections that matter most are **3** (tile map and wordmark) and **8** (region states).

## What is in here

| File | |
|---|---|
| `index.html` | The brain: load sequence, colour rest state, hover, dive. One file. |
| `experiences/` `coaching/` `backstory/` `playground/` | Section pages. **Shells** — nav and transition wiring only; `<main>` awaits the Claude Design artboard. |
| `assets/brand.css` | The palette. The only place the four hexes should appear. |
| `assets/transition.css` `assets/transition.js` | The arrival transition and the way back to the brain. Design-agnostic; styles nothing about the page. |
| `CLAUDE.md` | The spec. Authoritative. |
| `tilemap.json` | Canonical tile data: 23×19 grid, 242 filled tiles, each tagged `tl`/`tr`/`bl`/`br`. |
| `wordmark.png` | **Reference only — nothing loads it.** Kept because the letterform metrics were measured off it. It is a faulty export containing five of the eight glyphs. |
| `tools/fit-wordmark.mjs` | Re-fits the wordmark onto the tile map. See "If you change the tile map". |

`tilemap.json` is duplicated as the inlined `TILES` array in `index.html`. That is deliberate — the page must work with no fetch. If you edit the map, edit both.

## What is built

Screens 1–4 of the spec, all on the home page:

1. **Load sequence** — three beats. The tile preloader assembles; the solid white logo holds; it dissolves to reveal the four region colours. Any click or keypress skips straight to the colour state. About 3.5s end to end.
2. **Rest** — the four colours, whole and joined, tile grid visible, breathing slowly. Footer. No wordmark, no labels.
3. **Hover** — every tile flips 180°, the four clusters slide apart on their diagonals, the label appears. Colour does not change; it is already there.
4. **Region states** — per-tile region detection, live region glows with neuron pulses, other three dim. Neutral state when the cursor is inside the box but not on a tile.

Clicking any tile dives into that region — the stage scales up out of the clicked tile, the other three go black, and the section opens back out of the same colour, breaking into big tiles that clear from the point that was clicked. The nav logo returns to the closed colour brain without replaying the load sequence.

Keyboard works: the four labels are tabbable links that light their own region.

## What is not built

- **The section content.** The four routes resolve to shells. Their `<main>` is a placeholder; the real content is in the Claude Design artboards, which have to be exported and committed — that surface is not reachable from a Claude Code session.
- **Playground as a blog.** It is a single shell like the rest; post URLs beneath it do not exist yet.
- **Touch.** There is no hover on mobile and the whole interaction model depends on it. This is open item 1 in the spec and it needs a decision before launch.
- **The glitch transition.** The grid currently appears and disappears on a clean cut. The brief allows it to fade in glitchily between hovers; that was left until the logo itself is settled.

## Adding a real page

Drop the artboard's markup into the shell's `<main>` and keep three things on the page:

```html
<body data-region="tl">                                   <!-- tl|tr|bl|br -->
<link rel="stylesheet" href="/assets/transition.css">
<script src="/assets/transition.js" defer></script>
<a href="/" data-home>…</a>            <!-- the nav logo, or any link home -->
```

`data-region` sets the colour the page arrives out of. `data-home` rewrites that link to `/?from=<region>` so the brain skips its load sequence coming back. Everything else — nav, type, layout — is the artboard's business; the transition layer paints over the page and gets out of the way, so it will not collide with it.

`ROUTES` in `index.html` maps each region to its path. Clicking a tile dives; clicking a notch between regions does nothing, because detection is the same per-tile test the hover uses.

## The open blocker: the official logo

**The wordmark is not at its real proportion, and it cannot be until someone supplies the official logo as a file.**

Measured off the official logo, the `OPEN SOCH` block is about **16.5 tiles wide at left ~3.15, top ~4.85**, with every letter fully carved out of the brain. On this tile map that placement does not exist. Past about 13 tiles the `N` and the `H` run off the silhouette into black, where a black letterform is invisible. At 16.5 tiles, every position on the grid was searched: the best any of them manages is ~93% of the letterform ink landing on a filled tile.

So the tile map and the official artwork disagree — the silhouette in `tilemap.json` is narrower through the `OPEN` band than the brain it was traced from. This is a shape mismatch, not a placement problem, and no amount of tuning fixes it.

The current setting (12 / 6.75 / 6.75) is measured at zero ink off the silhouette, so every letter is intact. It is a holding value, deliberately smaller and lower than the real logo.

**To resolve:** get the official logo as a file — SVG ideally, PNG acceptable — then re-derive `tilemap.json` *from it* by sampling the 23×19 grid, and read the wordmark placement off the same artwork. Then the intro assembles the correct tiles, the hover splits the correct tiles, and the rest state is the real logo rather than a reconstruction.

## Three things that will bite you

**1. Do not create a stacking context above the tiles.**

`filter`, `mask-image`, `mix-blend-mode`, and any `opacity` between 0 and 1 on an ancestor of the tiles will flatten `transform-style: preserve-3d` and break the flip. This is why:

- the glow layer (`#glow`) sits outside the 3D subtrees rather than filtering `.region` directly;
- `.region` opacity is only ever exactly `0` or `1`, never transitioning through a fraction;
- the wordmark is a sibling overlay rather than a mask on the brain.

If the flip suddenly looks flat, this is what happened. Check `getComputedStyle(tile).transform` — it should be a `matrix3d`, not a `matrix`.

**2. Screen 4 paints through pseudo-elements, not the tile's own background.**

The dimming rides on a `::before` veil and the pulses on an `::after` flash. Keep them there. The tile's own `background-color` carries the region colour and nothing else should compete for it.

(Historical note, because the code used to be full of it: colour used to arrive on hover, and the swap was hidden at the flip's midpoint via `background-color 0ms var(--mid)` — instant, at 90°, when the tile is edge-on and cannot be seen changing. Colour now arrives in the load sequence instead, so there is nothing left to hide and `--mid` is gone.)

**3. The white logo is one shape, and it only exists during the load.**

The white brain is a single SVG `<path>` (`#solid`) whose subpaths are the 242 tiles. Adjacent tiles are subpaths of one fill, so the edges they share are interior to that fill and no seam is drawn between them. This matters: as 242 separate elements the grid showed through the white logo, and snapping to whole pixels only fixed it at scale 1 — the brain breathes at up to 1.015, which puts every edge back on a fraction.

The handover is one way, all in CSS:

- the wave lands → `#solid` fades up over the finished tiles across `--heal`, then the tiles drop out;
- the logo holds → `#solid` dissolves across `--reveal` and the tiles, now coloured, take back over.

After that `#solid` never returns. The colour state and the hover state are both tiles, grid and all.

`#solid` and `#wordmark` both live **inside** `#brain` so they ride the breathing transform. Keep them there.

## How region detection works

Per-tile, not per-quadrant-box. Each cluster is translated outward on its own diagonal, so one screen point maps to a *different* grid cell for each region. All four candidates are tested against the tile map; the offsets always push a candidate to the wrong side of the centre cut, so at most one region can ever claim a point. The test re-runs every animation frame because the brain breathes under the cursor.

Neuron pulses walk each region's own orthogonal adjacency, taken from the tile map — strongly preferring to continue straight, turning only on running out of region. No hand-authored paths, so they survive artwork changes. Components smaller than four cells are skipped as pulse origins, which keeps the detached floating pixels out of the walk.

## Tuning knobs

All in `:root` in `index.html`.

| Variable | |
|---|---|
| `--purple` `--blue` `--red` `--yellow` | Region colours. **Eyedropper guesses — still need confirming against Canva.** Everything else derives from these; no colour is hardcoded elsewhere. |
| `--brain-w` | Overall size. JS snaps `--t` to a whole pixel from this on load and resize. |
| `--spread` | How far the clusters slide apart. Spec says 0.5–1.0 tile; currently 0.75. |
| `--flip` | Flip duration. |
| `--heal` | How long the seams take to dissolve into the white logo. |
| `--reveal` | How long the white logo takes to dissolve into the colour state. |
| `--wm-cols` / `--wm-left` / `--wm-top` | Wordmark block width and origin, in tiles. See below. |
| `--veil-neutral` / `--veil-dim` | How far back the regions sit in the neutral state and when dimmed. |

## If you change the tile map

Re-fit the wordmark. A black letterform over a gap in the silhouette is invisible, so any letter that strays off a filled tile simply breaks.

```
npm i -D playwright        # if you don't have it
python3 -m http.server &
node tools/fit-wordmark.mjs
```

It reports every block width and position with **zero** letterform ink off the silhouette, widest first, along with how far off the brain's centroid each sits. Pick one and put it into `--wm-cols` / `--wm-left` / `--wm-top`.

## The wordmark letterforms

Drawn as inline SVG in `index.html`, not loaded from an image. The geometry was measured off the original artwork: a 5×5 module grid, stroke 26 units, glyph box 130, advance 170, line pitch 182, outer corner radius one stroke unit. Each glyph is one centreline path stroked with round joins and butt caps.

The five glyphs the original export did contain (`P`, `E`, `O`, `C`, `H`) match it to within antialiasing. **The `O`, `N` and `S` are reconstructions to the same measured system** — they were missing from the export entirely — and should be checked against the real HK Modular file.

## Not to be added

The spec is explicit and it is worth repeating: no SEO, meta tags, structured data or analytics; no hero copy, nav bar, scroll sections or cookie banner. The home page is deliberately unconventional and content-light. Don't propose changes on those grounds.
