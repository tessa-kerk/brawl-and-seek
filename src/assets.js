/* Brawl & Seek — art-asset preloader (art pass, Session 2b).
 * Swap-friendly and NON-breaking: every draw site that uses an image asks
 * Assets.get(k) and falls back to the original procedural art when it returns
 * null, so a missing/blocked/loading asset degrades to the signed-off look
 * rather than white-screening. Images load by URL (no <script> needed); we
 * kick the loads on parse so they're ready by first paint. */
(function () {
  const specs = {
    skirt:        'assets/world/skirt-1.png',    // NOT used in the play view (art pass 18-07) — kept for a future marketing/landing use
    // v30 (21-07, Concept Brief rule 3l THE COMPOSITION LAW, Tessa's layered-build spec):
    floor:        'assets/world/floor.png',        // Layer 0 — full-bleed, generated: subtle mottled patchwork (her correction: v28's flat colour "lacks any texture whatsoever"). Archived: floor_v4_flat-color-only-superseded.png
    // water: DELIBERATELY NOT an asset any more — Layer 1 (pools) is pure code-drawn per her spec (drawWater in arena.js), zero generation.
    fence_slab:   'assets/world/fence_slab.png',   // Layer 2 — the fence's low connecting base, a flat stone-slab MATERIAL (drawn gapless/merged, same technique as the old wall fill)
    fence_spike:  'assets/world/fence_spike.png',  // Layer 2 — the fence's dark iron post/spike, a discrete PROP composited on top of the slab at intervals, never per-tile
    bush_tuft:    'assets/world/bush_tuft.png',    // Layer 2 — ONE small foliage tuft, stamped with jitter/overlap into a cluster (replaces the old single stretched-texture bush)
    stump:        'assets/world/stump.png',        // Layer 2 — ONE tree-stump prop, placed at multiple rotations per instance
    barrel_plain: 'assets/world/barrel_plain.png', // Layer 2 — barrel variant 1 of 2
    barrel_cobweb:'assets/world/barrel_cobweb.png',// Layer 2 — barrel variant 2 of 2 (cobwebbed)
    bones_skull:  'assets/world/bones_skull.png',  // Layer 2 — bone/fossil ground decal 1 of 3
    bones_pair:   'assets/world/bones_pair.png',   // Layer 2 — bone/fossil ground decal 2 of 3
    bones_ribs:   'assets/world/bones_ribs.png',   // Layer 2 — bone/fossil ground decal 3 of 3
    // powercube: REMOVED (Tessa's design ruling, 21-07) — Solo Showdown power-up
    // furniture, not map furniture; would falsely promise power cubes in our
    // camo mode. Old asset file kept on disk, unregistered, never deleted.
    tag_icon:     'assets/ui/tag_icon.png',      // Acid Lakes batch (18-07): the Tag, styled on Belle's Super "Spotter" (Art Inventory.md)
    camo_icon:    'assets/ui/camo_icon.png',     // Acid Lakes batch (18-07): the camo-badge's paint-brush glyph
  };
  const imgs = {};
  for (const k in specs) { const im = new Image(); im.decoding = 'async'; im.src = specs[k]; imgs[k] = im; }

  window.Assets = {
    // Ready = fully decoded and non-empty. Anything else → null → procedural fallback.
    get(k) { const i = imgs[k]; return (i && i.complete && i.naturalWidth > 0) ? i : null; },
    raw: imgs,
  };
})();
