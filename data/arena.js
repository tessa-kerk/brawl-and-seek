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
 * (right, was col9) and row8 (bottom) are crop cuts, not real edges.
 * REVISED 20-07-2026 (Concept Brief rule 3l): these no longer get a dimmed
 * fade — the full-bleed ground (Arena.drawGround) just keeps going past
 * them at full brightness, which reads as "the map continues" more honestly
 * than a fade ever did (a fade that stops is itself a visible rectangle).
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
 *
 * ESTABLISHING PAN REVIEWED (21-07-2026, Concept Brief rule 3l): the PM's
 * "no establishing shot exists" claim was wrong — her Acid Lakes recording
 * DOES have a match-intro pan (~14–16s) with a clean overhead of the map
 * centre. Extracted at native res (`Art/Acid Lakes Real Footage Reference/`
 * scratch — pan_14.0s through pan_17.0s) and used to cross-check this grid's
 * cluster SHAPES: the fence run, bush mass, pool silhouette and general
 * cover density all match what the pan shows for this map. Honest limit,
 * stated plainly: the pan has no gridline overlay (unlike the original
 * top-left corner trace, which did), so this is a confirmed-shape review,
 * not a pixel-precise re-trace — cols10-15 stay footage-INFORMED rather
 * than footage-TRACED. The layered rendering rebuild (below/`src/arena.js`)
 * was the pan's main payoff this round: it's what let a genuine fence
 * structure, real prop types (stump/barrels/bones) and correct floor
 * texture replace guesses.
 */
window.ARENA = {
  // 16 wide × 9 tall (was 10×9) — 16:9, PM-cleared widescreen crop. Height
  // unchanged (still the compact scale that fit the mode's tuned pacing;
  // "don't oversize" per the Meccha lesson still applies to depth, just not
  // width). col0/row0 = the map's true left/top edge, continued in kind
  // across the new width, not reinvented.
  // Directive 001 (23-07-2026): 32×18 = two footage-measured 16×9 camera
  // views, deliberately not a full 61×61 map. The top row remains a genuine
  // edge; the right/bottom are rendered, playable buffer content.
  // 001A legend: source-visible pan region = rows 0-8 / cols 0-15; all
  // remaining cells are FOOTAGE-INFORMED CONTINUATION using only recorded
  // structure/prop types. 50x27 is ~two audited 25.23x13.40 views, not 61x61.
  grid: [
    '##################################################',
    'b#####bbbbbbbb#bbb#######bbbb#####bbbb####bbbbbbbb',
    '#########b######bb#bbbbbbb##b#####bbbbbb##..######',
    '#########b######bbbbbbbbbbbbbbbbbbbbbbbbbb########',
    '#bbb#####bb####bbbbbbbbbbbbbb...bbbbbbbbb#########',
    '#bb..~.....#####.............####.....b##..~~~...#',
    '#b.~~~~.....###.........bb#...###.....###.~~~~~..#',
    '#b.~~~~~bb...bb###b.....b##........#..###.~~~~~~.#',
    '#...~~##bbb..b####b......b#.#......#..###..~~~~.##',
    '#..bb####....b####...#.####........#..###..####..#',
    '#..bb####....b###...bbb####...........bb#.........',
    '#..bb###.....b###.bbbbb~~~S....####...bbb.........',
    '#.................bbbb~~~~~.....bbb....bbb....####',
    'bbbbb.............bbb~~~~~~~.....b....bbbb....####',
    'bbbbb.............bbb~~~~~~#....#....bbbbb....###.',
    'bbbbb...#~~........bbbb~~~##........bbbbbb....###.',
    'bbbbb..~~~~......#..bbbbbbbbb..#####.bbbbb.....##.',
    'b.......~~~..####.....bbbbbb..######..bbbb.....##.',
    'b.............###.............#####....bbb........',
    '..............~~~...............#####.............',
    '............~~~~~~~.............######....~~~.....',
    'b.bb........~~~~~~~~............#####....~~~~~...b',
    'bbbb#........~~~~~~.......bb.........##.~~~~~~...b',
    'bbbb##........~~~~.......bbbb..........#.~~~~~....',
    'bbbb##...#....###......bbbbbb..........##..~~.....',
    'bbb#######............bbbbbbb....#....#.#........#',
    'bbbbb....#............bbbbbbb....######.........##',
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

  /* Hand-traced collision bases for every barrel and hollow tree stump baked
   * into the approved source-atlas plate. Coordinates are in
   * world pixels (43 px source cells), radii describe the visible ground base
   * rather than the tall painted silhouette. Fossils/bones are intentionally
   * absent: they remain decorative and walkable. */
  props: [
    { id: 'stump-01', kind: 'stump', x: 139,  y: 218,  radius: 13 },
    { id: 'stump-02', kind: 'stump', x: 820,  y: 171,  radius: 13 },
    { id: 'stump-03', kind: 'stump', x: 937,  y: 279,  radius: 13 },
    { id: 'stump-04', kind: 'stump', x: 1925, y: 220,  radius: 13 },
    { id: 'stump-05', kind: 'stump', x: 155,  y: 347,  radius: 13 },
    { id: 'stump-06', kind: 'stump', x: 977,  y: 452,  radius: 13 },
    { id: 'stump-07', kind: 'stump', x: 1416, y: 487,  radius: 13 },
    { id: 'stump-08', kind: 'stump', x: 1545, y: 600,  radius: 13 },
    { id: 'stump-09', kind: 'stump', x: 326,  y: 618,  radius: 13 },
    { id: 'stump-10', kind: 'stump', x: 470,  y: 620,  radius: 13 },
    { id: 'stump-11', kind: 'stump', x: 605,  y: 638,  radius: 13 },
    { id: 'stump-12', kind: 'stump', x: 321,  y: 707,  radius: 13 },
    { id: 'stump-13', kind: 'stump', x: 730,  y: 715,  radius: 13 },
    { id: 'stump-14', kind: 'stump', x: 567,  y: 765,  radius: 13 },
    { id: 'stump-15', kind: 'stump', x: 865,  y: 785,  radius: 13 },
    { id: 'stump-16', kind: 'stump', x: 1874, y: 839,  radius: 13 },
    { id: 'stump-17', kind: 'stump', x: 505,  y: 910,  radius: 13 },
    { id: 'stump-18', kind: 'stump', x: 1027, y: 1015, radius: 13 },
    { id: 'stump-19', kind: 'stump', x: 1900, y: 951,  radius: 13 },
    { id: 'barrel-01', kind: 'barrel', x: 365,  y: 376, radius: 14 },
    { id: 'barrel-02', kind: 'barrel', x: 412,  y: 376, radius: 14 },
    { id: 'barrel-03', kind: 'barrel', x: 1205, y: 284, radius: 14 },
    { id: 'barrel-04', kind: 'barrel', x: 1415, y: 371, radius: 14 },
    { id: 'barrel-05', kind: 'barrel', x: 1884, y: 581, radius: 14 },
    { id: 'barrel-06', kind: 'barrel', x: 1925, y: 610, radius: 14 },
    { id: 'barrel-07', kind: 'barrel', x: 125,  y: 830, radius: 14 },
    { id: 'barrel-08', kind: 'barrel', x: 1292, y: 832, radius: 14 },
    { id: 'barrel-09', kind: 'barrel', x: 1488, y: 788, radius: 14 },
  ],
};
