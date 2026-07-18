/* Brawl & Seek — art-asset preloader (art pass, Session 2b).
 * Swap-friendly and NON-breaking: every draw site that uses an image asks
 * Assets.get(k) and falls back to the original procedural art when it returns
 * null, so a missing/blocked/loading asset degrades to the signed-off look
 * rather than white-screening. Images load by URL (no <script> needed); we
 * kick the loads on parse so they're ready by first paint. */
(function () {
  const specs = {
    skirt:      'assets/world/skirt-1.png',   // NOT used in the play view (art pass 18-07) — kept for a future marketing/landing use
    floor:      'assets/world/floor.png',
    water:      'assets/world/water.png',
    wall_drum:  'assets/world/wall_drum.png',
    wall_crate: 'assets/world/wall_crate.png',
    bush:       'assets/world/bush.png',
  };
  const imgs = {};
  for (const k in specs) { const im = new Image(); im.decoding = 'async'; im.src = specs[k]; imgs[k] = im; }

  window.Assets = {
    // Ready = fully decoded and non-empty. Anything else → null → procedural fallback.
    get(k) { const i = imgs[k]; return (i && i.complete && i.naturalWidth > 0) ? i : null; },
    raw: imgs,
  };
})();
