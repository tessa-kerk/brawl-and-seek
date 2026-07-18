"""M1 movement: keyboard drive, wall collision, the paint timer, the camo break,
and the repaint time (via the real Map Maker path — Round/MAKER own it)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game(width=1000, height=700) as (pg, errs):
    T = pg.evaluate("Arena.T"); h = pg.evaluate("Player.h")
    t = Tally()

    pg.evaluate("Game.pose({col:5,row:4,progress:0}); Game.resume()")
    x0 = pg.evaluate("Player.x")
    pg.keyboard.down("d"); pg.wait_for_timeout(350); pg.keyboard.up("d")
    t.check(f"keyboard moves ({pg.evaluate('Player.x') - x0:.0f}px)", pg.evaluate("Player.x") - x0 > 30)

    # Art pass (18-07-2026): the recreated map has NO border wall ring (real-map
    # law 1) — col1,row4 is bush (walkable), so walking left now tests the true
    # MAP EDGE stopping the player, not a wall. col0,row4 is open floor; beyond
    # it is out-of-bounds, which Arena.isSolid treats as solid.
    pg.evaluate("Game.pose({col:1,row:4,progress:0}); Game.resume()")
    pg.keyboard.down("a"); pg.wait_for_timeout(500); pg.keyboard.up("a")
    minx = pg.evaluate("Player.h")
    t.check("the map's true edge stops the player (no border wall needed)", pg.evaluate("Player.x") >= minx - 0.6)

    # Explicit WALL-collision check against a real interior cluster (row2, cols
    # 4-5) — separate from the edge check above now that they're different cases.
    pg.evaluate("Game.pose({col:3,row:2,progress:0}); Game.resume()")
    pg.keyboard.down("d"); pg.wait_for_timeout(500); pg.keyboard.up("d")
    maxx = pg.evaluate("Arena.T * 4 - Player.h")
    t.check("a real wall cluster stops the player", pg.evaluate("Player.x") <= maxx + 0.6)

    pg.evaluate("Game.pose({col:2,row:7,progress:0}); Game.resume()")   # clear open floor
    pg.wait_for_timeout(1200)
    t.check("paint timer -> hidden after ~1s still", pg.evaluate("Player.hidden"))

    pg.keyboard.down("s"); pg.wait_for_timeout(60); pg.keyboard.up("s"); pg.wait_for_timeout(20)
    t.check("camo breaks on input", pg.evaluate("Player.progress") < 0.5 and not pg.evaluate("Player.hidden"))

    # repaint via the real path (Map Maker owns it; Game.setRepaint was removed)
    pg.evaluate("Maker.enter(); MAKER.repaint=0.5; Maker.apply();")
    pg.evaluate("Player.x=Arena.centre(4,1).x; Player.y=Arena.centre(4,1).y; Player.still=0; Player.progress=0; Player.hidden=false;")
    pg.wait_for_timeout(650)
    t.check("repaint=0.5s hides by 0.65s", pg.evaluate("Player.hidden"))
    pg.evaluate("Maker.exit()")

    t.finish("movement", errs)
