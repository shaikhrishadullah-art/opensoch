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
| `index.html` | The whole site. One file. |
| `CLAUDE.md` | The spec. Authoritative. |
| `tilemap.json` | Canonical tile data: 23×19 grid, 242 filled tiles, each tagged `tl`/`tr`/`bl`/`br`. |
| `wordmark.png` | **Reference only — nothing loads it.** Kept because the letterform metrics were measured off it. It is a faulty export containing five of the eight glyphs. |
| `tools/fit-wordmark.mjs` | Re-fits the wordmark onto the tile map. See "If you change the tile map". |

`tilemap.json` is duplicated as the inlined `TILES` array in `index.html`. That is deliberate — the page must work with no fetch. If you edit the map, edit both.

## What is built

Screens 1–4 of the spec, all on the home page:

1. **Intro** — a seed tile throbs at centre, tiles flip white outward in a radial wave. Any click or keypress skips to the assembled state.
2. **Rest** — the assembled logo, breathing slowly. Footer.
3. **Hover** — every tile flips 180° to its region colour, the four clusters slide apart on their diagonals, the wordmark goes.
4. **Region states** — per-tile region detection, live region glows with neuron pulses, other three dim, labels appear. Neutral state when the cursor is inside the box but not on a tile.

Keyboard works: the four labels are tabbable and light their own region.

## What is not built

- **The four detail pages and any routing.** The labels are `<button>`s that do nothing.
- **Touch.** There is no hover on mobile and the whole interaction model depends on it. This is open item 1 in the spec and it needs a decision before launch.
- **The glitch transition.** The grid currently appears and disappears on a clean cut. The brief allows it to fade in glitchily between hovers; that was left until the logo itself is settled.

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

**2. The colour swap happens at the flip midpoint, on purpose.**

Tiles change colour instantly at `--mid` (210ms), when they are edge-on at 90° and cannot be seen changing. That is why the tile's transition reads `background-color 0ms var(--mid)`. The colour is never seen to fade because there is nothing on screen when it changes. Don't "fix" it into a smooth transition.

Screen 4's dimming rides on a `::before` veil and the pulses on a `::after` flash, precisely so neither competes with that `background-color` rule.

**3. The rest state is one shape; the tiles are only for the intro and the hover.**

The white brain is a single SVG `<path>` (`#solid`) whose subpaths are the 242 tiles. Adjacent tiles are subpaths of one fill, so the edges they share are interior to that fill and no seam is drawn between them. This matters: as 242 separate elements the grid showed through the white logo, and snapping to whole pixels only fixed it at scale 1 — the brain breathes at up to 1.015, which puts every edge back on a fraction.

The handover, all in CSS:

- intro ends → `#solid` fades up over the finished tiles across `--heal`, then the tiles drop out;
- hover starts → `#solid` goes instantly and the tiles are back, so the grid is there the moment the flip starts;
- hover ends → tiles flip home across `--flip`, then `#solid` fades back and the tiles drop out.

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
| `--flip` / `--mid` | Flip duration and its midpoint. **Keep `--mid` at half of `--flip`.** |
| `--heal` | How long the seams take to dissolve into the solid logo. |
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
