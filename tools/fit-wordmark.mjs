/*
 * fit-wordmark.mjs — find where the OPEN SOCH block can sit on the tile map.
 *
 * The wordmark is a black overlay on a black page, so it only reads where
 * white tiles are behind it. Any letterform pixel that strays off a filled
 * tile is simply invisible, and the letter breaks. This rasterises the
 * wordmark exactly as index.html draws it, then reports every block width
 * and origin with ZERO ink off the silhouette.
 *
 * Run it after any change to the tile map, and put the chosen numbers into
 * --wm-cols / --wm-left / --wm-top in index.html.
 *
 *   python3 -m http.server &
 *   node tools/fit-wordmark.mjs [url]
 *
 * Needs playwright (npm i -D playwright).
 */
const URL_ = process.argv[2] || 'http://localhost:8000/index.html';

let chromium;
for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
  try { ({ chromium } = await import(spec)); break; } catch { /* try the next */ }
}
if (!chromium) {
  console.error('playwright not found. npm i -D playwright');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 820 } });
try {
  await page.goto(URL_);
} catch {
  console.error(`could not load ${URL_} — is the server running?`);
  await browser.close();
  process.exit(1);
}

const result = await page.evaluate(async () => {
  // rasterise the page's own wordmark, tight to the glyph block
  const svg = document.querySelector('#wordmark svg').cloneNode(true);
  svg.setAttribute('width', '640');
  svg.setAttribute('height', '312');
  svg.querySelectorAll('[stroke]').forEach(g => g.setAttribute('stroke', '#000'));
  const img = new Image();
  img.src = 'data:image/svg+xml;base64,' +
    btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
  await img.decode();

  const RW = 640, RH = 312;
  const canvas = document.createElement('canvas');
  canvas.width = RW; canvas.height = RH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, RW, RH);
  const px = ctx.getImageData(0, 0, RW, RH).data;

  // ink samples, in block-normalised coordinates
  const U = [], V = [];
  for (let y = 0; y < RH; y += 2)
    for (let x = 0; x < RW; x += 2)
      if (px[(y * RW + x) * 4 + 3] > 128) { U.push((x + 0.5) / RW); V.push((y + 0.5) / RH); }

  const COLS = 23, ROWS = 19;
  const grid = new Uint8Array(COLS * ROWS);
  for (const [c, r] of TILES) grid[r * COLS + c] = 1;

  const N = U.length;
  const ASPECT = 312 / 640;                       // the glyph block's own ratio
  const strayCount = (W, left, top, all) => {
    const H = W * ASPECT; let miss = 0;
    for (let i = 0; i < N; i++) {
      const c = (left + U[i] * W) | 0, r = (top + V[i] * H) | 0;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS || !grid[r * COLS + c]) {
        miss++; if (!all) return miss;            // early out when only "is it clean"
      }
    }
    return miss;
  };

  const cx = TILES.reduce((a, t) => a + t[0] + 0.5, 0) / TILES.length;
  const cy = TILES.reduce((a, t) => a + t[1] + 0.5, 0) / TILES.length;

  const clean = [];
  for (let W = 8; W <= 18.01; W += 0.25) {
    const H = W * ASPECT;
    for (let left = -1; left <= COLS - W + 1.01; left += 0.25)
      for (let top = -1; top <= ROWS - H + 1.01; top += 0.25)
        if (strayCount(W, left, top, false) === 0)
          clean.push({
            W: +W.toFixed(2), left: +left.toFixed(2), top: +top.toFixed(2),
            off: +Math.hypot(left + W / 2 - cx, top + H / 2 - cy).toFixed(2)
          });
  }
  clean.sort((a, b) => b.W - a.W || a.off - b.off);
  const seen = new Set(), widest = [];
  for (const o of clean) { if (!seen.has(o.W)) { seen.add(o.W); widest.push(o); } }

  // what the page is set to right now
  const cs = getComputedStyle(document.documentElement);
  const cur = {
    W: parseFloat(cs.getPropertyValue('--wm-cols')),
    left: parseFloat(cs.getPropertyValue('--wm-left')),
    top: parseFloat(cs.getPropertyValue('--wm-top'))
  };
  cur.strayPct = (strayCount(cur.W, cur.left, cur.top, true) / N * 100).toFixed(2);

  return { samples: N, current: cur, widest: widest.slice(0, 12) };
});

await browser.close();

console.log(`\nsampled ${result.samples} letterform pixels\n`);
const c = result.current;
console.log(`currently set to  ${c.W} / ${c.left} / ${c.top}  ->  ${c.strayPct}% of ink off the silhouette`);
console.log(`${c.strayPct === '0.00' ? 'clean.' : 'NOT clean — letters are breaking.'}\n`);
console.log('placements with zero ink off the silhouette, widest first:');
console.log('  --wm-cols   --wm-left   --wm-top    off-centre');
for (const o of result.widest) {
  console.log(`  ${String(o.W).padEnd(11)} ${String(o.left).padEnd(11)} ${String(o.top).padEnd(11)} ${o.off} tiles`);
}
console.log('\npick one, and set it in :root in index.html.\n');
