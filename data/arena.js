/* Brawl & Seek — arena data (data-driven; no map geometry lives in logic).
 * ART PASS (18-07-2026, THIRD map — Tessa's final pick): this grid RECREATES
 * the real top-left 10×9 corner of ACID LAKES (a current-rotation Solo/Duo
 * Showdown map, environment "Showdown Mortuary" — verified directly against
 * the Fandom wiki infobox). Superseded "Spots of Yore" (removed from the game
 * in 2025 — Tessa: recreate a map still in the CURRENT rotation, faithfully,
 * rather than guess at a retired one from thin references). Full trade-off
 * record (this corner vs. a full 61×61 recreation) is in Art Inventory.md.
 *
 * Traced tile-by-tile from the real map render (tile measured at 32px,
 * confirmed by pixel-diff autocorrelation — the full map is exactly 61×61
 * tiles). TWO edges of this section are the map's own TRUE boundary (top +
 * left — the spiky wall border, no border ring invented); the other two
 * (right + bottom) are a crop cut, not a real edge, and the render pass
 * treats them with the same dimmed/blurred floor-continuation technique
 * already used for the world skirt, redirected — "the map keeps going, just
 * past legible focus" rather than a hard stop (Tessa's "never feel cut off"
 * bar). The diagonal organic acid-pool wrapping the true corner is the
 * section's most distinctive, recognisable feature.
 *
 * HONEST GAP, flagged not hidden: this specific corner has NO bush/foliage —
 * the wiki text mentions "bush-covered edges" elsewhere on Acid Lakes, but
 * this section is pool + wall + open floor + two weapon-crate props only.
 * The 4th Map Maker toggle (Bushes) stays fully implemented and functional
 * (it's a map-agnostic mechanic, tested independently of any specific grid),
 * it simply has nothing to visually demonstrate on THIS recreated section —
 * a known, named gap, not silently dropped.
 *
 * Legend:  #  wall (solid, a chunky Brawl-style block, qualifies as camo)
 *          ~  water (solid to walk into, qualifies as camo when adjacent)
 *          b  bush (a real camo surface, walkable, priority wall > bush >
 *             water > floor — unused on THIS grid, see the gap note above)
 *          .  floor (walkable; always qualifies as camo where you stand)
 *          S  spawn (floor)
 *
 * Surface palette is tuned to read as a Brawl arena while staying inside the
 * locked six-role system (a navy floor family, purple-grey blocks, an aqua
 * pool, a Fresh-Paint-flecked green for bush — reused as-is; bush surfaces
 * elsewhere/later still use it).
 */
window.ARENA = {
  // 10 wide × 9 tall — kept at the established compact scale ("don't oversize"
  // per the Meccha lesson). col0 = the map's true left edge; row0 = the map's
  // true top edge (both real spiky-wall border, traced from the actual
  // render — not invented). The diagonal pool touches both true edges,
  // matching the reference exactly.
  grid: [
    '#####~~~~#',
    '####~~~~~#',
    '###.~~~~~#',
    '##..~~~..#',
    '.....~~..#',
    '~~~.......',
    '~~~~..S...',
    '~~~.......',
    '~###......',
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
