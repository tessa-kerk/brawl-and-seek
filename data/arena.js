/* Brawl & Seek — arena data (data-driven; no map geometry lives in logic).
 * A small top-down tile arena. "Don't oversize the map" is a Concept-Brief
 * lesson from Meccha — this is deliberately compact and legible at phone width.
 *
 * Legend:  #  wall (solid, a chunky Brawl-style block, qualifies as camo)
 *          ~  water (solid to walk into, qualifies as camo when adjacent)
 *          .  floor (walkable; always qualifies as camo where you stand)
 *          S  spawn (floor)
 *
 * Surface palette is tuned to read as a Brawl arena while staying inside the
 * locked six-role system (a navy floor family, purple-grey blocks, an aqua pool).
 */
window.ARENA = {
  // 10 wide × 9 tall. Kept small (fewer columns = a bigger, more legible player
  // at 360px phone width) and loose enough to hug walls, sit by the pond, or
  // blend into open floor. May grow in M2 when the seeker + dummies populate it.
  grid: [
    '##########',
    '#........#',
    '#.##..##.#',
    '#.##..##.#',
    '#....S...#',
    '#.~~...#.#',
    '#.~~..##.#',
    '#.....#..#',
    '##########',
  ],

  surfaces: {
    floorA: '#2A3162',
    floorB: '#313A73',
    wallTop:  '#5A63A8',
    wallSide: '#333A72',
    water:    '#1C93C4',
    waterHi:  '#48BCE6',
  },
};
