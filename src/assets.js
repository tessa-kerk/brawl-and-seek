/* Brawl & Seek — art-asset preloader (art pass, Session 2b).
 * Swap-friendly and NON-breaking: every draw site that uses an image asks
 * Assets.get(k) and falls back to the original procedural art when it returns
 * null, so a missing/blocked/loading asset degrades to the signed-off look
 * rather than white-screening. Images load by URL (no <script> needed); we
 * kick the loads on parse so they're ready by first paint. */
(function () {
  const specs = {
    skirt:      'assets/world/skirt-1.png',    // NOT used in the play view (art pass 18-07) — kept for a future marketing/landing use
    floor:      'assets/world/floor.png',      // v27 (20-07): deep plum-purple ground, ref'd DIRECTLY from Tessa's own footage crops (rule 3i/3j) — replaces the wiki-referenced v2 (now REJECTED, archived as floor_v2_wiki-referenced-superseded.png)
    water:      'assets/world/water.png',      // v27 (20-07): glowing acid-green slime pool, footage-referenced — replaces the rejected wiki-referenced v2
    wall_block: 'assets/world/wall_block.png', // v27 (20-07): capped lavender-purple pillar block w/ spike trim, footage-referenced — replaces the rejected wiki-referenced v2
    bush:       'assets/world/bush.png',       // v27 (20-07): dense teal-cyan spiky foliage, footage-referenced — now genuinely used (16x9 grid has 3 real bush tiles, v26) — replaces the rejected wiki-referenced v2
    powercube:  'assets/world/powercube.png',  // Acid Lakes batch (18-07): the traced Power-Cube spawn marker prop
    tag_icon:   'assets/ui/tag_icon.png',      // Acid Lakes batch (18-07): the Tag, styled on Belle's Super "Spotter" (Art Inventory.md)
    camo_icon:  'assets/ui/camo_icon.png',     // Acid Lakes batch (18-07): the camo-badge's paint-brush glyph
  };
  const imgs = {};
  for (const k in specs) { const im = new Image(); im.decoding = 'async'; im.src = specs[k]; imgs[k] = im; }

  window.Assets = {
    // Ready = fully decoded and non-empty. Anything else → null → procedural fallback.
    get(k) { const i = imgs[k]; return (i && i.complete && i.naturalWidth > 0) ? i : null; },
    raw: imgs,
  };
})();
