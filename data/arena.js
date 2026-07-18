/* Brawl & Seek — arena data (data-driven; no map geometry lives in logic).
 * ART PASS (18-07-2026): this grid RECREATES the real top-left 10x10 corner of
 * the official Paint Brawl map "Spots of Yore" (api.brawlapi.com id 15000757,
 * tile measured at 30px) — Tessa's pick after v14's INVENTED layout (a wall
 * ring lining the whole border, a square water pool) failed her "reads as
 * Brawl Stars" test. Real-map layout laws this grid honours (Art Inventory.md
 * has the full study): (1) NO wall/crate lines the border — the true map edge
 * is open floor/bush, same as every real Brawl map; (2) cover sits in
 * scattered interior clusters, never a perimeter ring; (3) water reads
 * organic/rounded, never a hard square (the render pass traces a rounded
 * outer silhouette around the tile-mask, not raw per-tile rects — see
 * arena.js drawWater); (4) a two-tone floor checker throughout.
 *
 * Legend:  #  wall (solid, a chunky Brawl-style block, qualifies as camo)
 *          ~  water (solid to walk into, qualifies as camo when adjacent)
 *          b  bush (NEW, 18-07-2026 — Tessa's ruling: a REAL camo surface,
 *             not decoration. Walkable, unlike walls. Priority wall > bush >
 *             water > floor. Pre-paint concealment is NOT implemented — see
 *             the open question in Art Inventory.md, awaiting Tessa's call.)
 *          .  floor (walkable; always qualifies as camo where you stand)
 *          S  spawn (floor)
 *
 * Surface palette is tuned to read as a Brawl arena while staying inside the
 * locked six-role system (a navy floor family, purple-grey blocks, an aqua
 * pool, a Fresh-Paint-flecked green for bush).
 */
window.ARENA = {
  // 10 wide × 9 tall — unchanged from the pre-art-pass size (a real map corner
  // recreates at the same compact scale; "don't oversize" per the Meccha
  // lesson still holds). Bush cluster touches the true left edge exactly as
  // the reference does; the water pool sits beside a wall pair, matching the
  // reference's own placement.
  grid: [
    '..........',
    '..........',
    '....##....',
    '..b.##.##.',
    '.bb~~..##.',
    'bbb~~.....',
    '.bb..S....',
    '..........',
    '..........',
  ].map((row) => row.slice(0, 10)),

  surfaces: {
    floorA: '#2A3162',
    floorB: '#313A73',
    wallTop:  '#5A63A8',
    wallSide: '#333A72',
    water:    '#1C93C4',
    waterHi:  '#48BCE6',
    bush:     '#2E9C52',
    bushHi:   '#3BD16B',
  },
};
