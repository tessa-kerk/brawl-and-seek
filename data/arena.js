/* Brawl & Seek — arena data (data-driven; no map geometry lives in logic).
 * WIDESCREEN CROP (20-07-2026, Concept Brief rule 3j/3i, PM-cleared 16×9):
 * "a square arena can be played portrait — it breaks the fiction" (Tessa).
 * The original 10×9 top-left corner (cols0-9) is UNCHANGED — its layout was
 * already fact-checked against the real map render and is provisionally
 * still trustworthy for TILE POSITIONS even though that render's RENDERING
 * STYLE was demoted (rule 3i — a wiki map render is layout-only, never a
 * palette/art reference). Six columns (10-15) are appended along the same
 * true top edge to reach 16:9.
 *
 * HONEST SCOPING NOTE on cols10-15: Tessa's own footage
 * (`Art/2026-07-20 - Tessa's own recording - Acid Lakes bot match.mp4`,
 * ledger H7) does not include a clean top-down establishing shot of this
 * exact map edge extending further right — her recording is mid-match
 * gameplay, not a map-select fly-through. These six columns are therefore a
 * FOOTAGE-INFORMED, PATTERN-MATCHED extension (a bush cluster, a second
 * small organic pool, a wall-block cluster — all features her recording
 * confirms genuinely exist on this map and repeat across it), not a literal
 * pixel trace of an unseen region. Flagged for the PM's clear, same as
 * everything else this pass — not presented as more precise than it is.
 *
 * Real edges vs. cut edges, unchanged in kind: row0/col0 are the map's own
 * TRUE boundary (top + left, the spiky wall border — now continued across
 * the full 16-wide top edge, since a border doesn't stop mid-map). Col15
 * (right, was col9) and row8 (bottom) are crop cuts, not real edges, and
 * get the same dimmed/blurred "map keeps going, past legible focus"
 * continuation treatment (Arena.drawCutEdgeFade) as before.
 *
 * BUSH GAP RESOLVED (was HONEST GAP in the 10-col version): the original
 * corner genuinely had zero bush tiles, flagged not hidden. Her own footage
 * confirms bushes ARE a real feature of this map (teal foliage clusters),
 * so the widescreen extension gives the 4th Map Maker toggle its first real
 * tiles on this grid — see the bush cluster at cols10-12, row2.
 *
 * Legend:  #  wall (solid, a chunky Brawl-style block, qualifies as camo)
 *          ~  water (solid to walk into, qualifies as camo when adjacent)
 *          b  bush (a real camo surface, walkable, priority wall > bush >
 *             water > floor)
 *          .  floor (walkable; always qualifies as camo where you stand)
 *          S  spawn (floor)
 *
 * Surface palette moved toward her footage's actual current theme (dark
 * violet-purple ground, teal foliage, glowing acid-green water) — the
 * procedural FALLBACK colours only; the real generated textures redo
 * against her frames in the next batch (held for PM clear + Tessa's budget
 * yes, Concept Brief rule 3j).
 */
window.ARENA = {
  // 16 wide × 9 tall (was 10×9) — 16:9, PM-cleared widescreen crop. Height
  // unchanged (still the compact scale that fit the mode's tuned pacing;
  // "don't oversize" per the Meccha lesson still applies to depth, just not
  // width). col0/row0 = the map's true left/top edge, continued in kind
  // across the new width, not reinvented.
  grid: [
    '#####~~~~#######',
    '####~~~~~#######',
    '###.~~~~~#bbb...',
    '##..~~~..#..###.',
    '.....~~..#......',
    '~~~.........~~..',
    '~~~~..S.....~~..',
    '~~~.........~~..',
    '~###............',
  ].map((row) => row.slice(0, 16)),

  // Decorative floor-level props (unchanged positions from the 10-col
  // version — both still inside the true corner, cols10-15 is new content
  // beyond them). Flat ground decals, drawn on the floor layer — never
  // solid, never consulted by collide()/isSolid().
  props: [
    { c: 3, r: 2, key: 'powercube' },
    { c: 2, r: 3, key: 'powercube' },
  ],

  surfaces: {
    floorA: '#2A2140',
    floorB: '#332B52',
    wallTop:  '#6B6FB8',
    wallSide: '#3A3868',
    water:    '#3ED45A',
    waterHi:  '#7CF08A',
    bush:     '#2E9CA0',
    bushHi:   '#4FCBC8',
  },
};
