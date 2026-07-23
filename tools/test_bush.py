"""Bush — the 4th camo surface (art pass 18-07-2026, Tessa's ruling: a real
surface, not decoration). Oracle = a hand-copied grid string and hand-reasoned
adjacency, written independently here — NOT derived by calling any function
under test (the standing rule: probe and actual must never share logic).

PIVOT (18-07-2026, THIRD map — Acid Lakes top-left corner): the live played
map is now a real recreated section that honestly has ZERO bush tiles (see
the "HONEST GAP" note in data/arena.js — this specific corner is pool + wall
+ open floor + two crate props only; bush stays a map-agnostic mechanic with
nothing to demonstrate on THIS map). Coupling this test to the live grid would
either force fake bush tiles into a faithful recreation (wrong) or make the
test vacuous (0 real cells, false confidence). Neither is acceptable, so this
test now feeds the REAL, unmodified src/arena.js a dedicated synthetic bush
fixture via network interception (Playwright route) instead of trusting
whatever the currently art-directed map happens to contain — the code under
test is still the genuine implementation, only the input data is swapped.
This is MORE correct than map-coupling: it proves the mechanic itself,
independent of any one map's content, exactly as the toggle is meant to be.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

# Independent synthetic fixture (NOT the live played map) — hand-written here,
# never derived from any function under test.
GRID = [
    '..........',
    '..........',
    '....##....',
    '..b.##.##.',
    '.bb~~..##.',
    'bbb~~.....',
    '.bb..S....',
    '..........',
    '..........',
]
BUSH_CELLS = [(c, r) for r, row in enumerate(GRID) for c, ch in enumerate(row) if ch == 'b']

FIXTURE_JS = """window.ARENA = {
  grid: %s,
  surfaces: {
    floorA: '#2A3162', floorB: '#313A73',
    wallTop: '#5A63A8', wallSide: '#333A72',
    water: '#1C93C4', waterHi: '#48BCE6',
    bush: '#2E9C52', bushHi: '#3BD16B',
  },
};""" % (GRID,)

with game() as (pg, errs):
    # Swap data/arena.js for the synthetic bush fixture, then reload so
    # src/arena.js (untouched) parses the fixture instead of the live map.
    pg.route("**/data/arena.js*", lambda route: route.fulfill(
        content_type="application/javascript", body=FIXTURE_JS))
    pg.goto(pg.url)
    pg.wait_for_function("window.Game && window.Round && window.Arena", timeout=9000)
    pg.wait_for_timeout(300)
    pg.evaluate("Game.pause()")
    T = pg.evaluate("Arena.T"); h = pg.evaluate("Player.h")
    t = Tally()

    # A) grid drift guard: the live grid must match this file's independent copy
    live = pg.evaluate("Arena.grid.map(r=>r.join(''))")
    t.check("live Arena.grid matches this test's independent copy (drift guard)", live == GRID)

    # B) bush is walkable — every hand-identified bush cell is NOT solid
    solid_bush = [pg.evaluate(f"Arena.isSolid({c},{r})") for c, r in BUSH_CELLS]
    t.check(f"all {len(BUSH_CELLS)} bush cells are walkable (isSolid=false)", not any(solid_bush))

    # C) every bush cell qualifies as camo when bush is enabled (isolated)
    pg.evaluate("STATE.camoSurfaces={wall:false,bush:true,water:false,floor:false}")
    types = [pg.evaluate(f"(()=>{{const c=Arena.centre({c},{r});return Arena.camoSurface(c.x,c.y,{h}).type;}})()")
              for c, r in BUSH_CELLS]
    t.check("every bush tile's own centre camos as 'bush' (bush-only enabled)", all(ty == 'bush' for ty in types))

    # D) PRIORITY CHAIN — col3,row3 (open floor) has all four surface types in
    # independently-verified reach: bush west (2,3), wall east (4,3), water
    # south (3,4), and it's floor itself. h+pad ≈ 48.6px > T/2=32px, so reach
    # from a tile centre spans into every 4-neighbour — proven by the ORIGINAL
    # (pre-art-pass) grid's wall/water-adjacency hiding tests, same formula.
    pg.evaluate("(()=>{const c=Arena.centre(3,3); Player.x=c.x; Player.y=c.y;})()")
    QUERY = "Arena.camoSurface(Player.x,Player.y,Player.h)"
    combos = [
        ({"wall": True,  "bush": True,  "water": True,  "floor": True},  "wall"),
        ({"wall": False, "bush": True,  "water": True,  "floor": True},  "bush"),
        ({"wall": False, "bush": False, "water": True,  "floor": True},  "water"),
        ({"wall": False, "bush": False, "water": False, "floor": True},  "floor"),
    ]
    for surfaces, want in combos:
        pg.evaluate(f"STATE.camoSurfaces={surfaces}".replace("True", "true").replace("False", "false"))
        got = pg.evaluate(f"{QUERY}.type")
        t.check(f"priority @ col3,row3 with {surfaces} -> '{want}' (got '{got}')", got == want)
    pg.evaluate("STATE.camoSurfaces={wall:false,bush:false,water:false,floor:false}")
    t.check("all four surfaces off -> camoSurface null",
            pg.evaluate(QUERY) is None)

    # E) hide-tile derivation includes bush tiles (dummies must be able to pick them)
    hide = pg.evaluate("Arena.hideTiles.map(x=>[x.c,x.r])")
    hide_set = {tuple(x) for x in hide}
    missing = [cell for cell in BUSH_CELLS if cell not in hide_set]
    t.check(f"every bush cell is in Arena.hideTiles ({len(BUSH_CELLS)} cells)", not missing)

    # F) Map Maker: bush toggle drives the panel + overlay exactly like the other three
    pg.evaluate("Maker.enter()")
    pg.evaluate("MAKER.surfaces={wall:false,floor:false,water:false,bush:false}; Maker.apply();")
    t.check("Map Maker: all-four-off warning fires with bush included",
            pg.evaluate("!document.getElementById('mk-warn').hidden"))
    pg.evaluate("MAKER.surfaces={wall:false,floor:false,water:false,bush:true}; Maker.apply();")
    t.check("Map Maker: bush-only clears the warning", pg.evaluate("document.getElementById('mk-warn').hidden"))
    pg.evaluate("Maker.exit()")

    t.finish("bush", errs)
