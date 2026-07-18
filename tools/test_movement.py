"""M1 movement: keyboard drive, wall collision, the paint timer, the camo break,
and the repaint time (via the real Map Maker path — Round/MAKER own it)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game(width=1000, height=700) as (pg, errs):
    T = pg.evaluate("Arena.T"); h = pg.evaluate("Player.h")
    t = Tally()

    # Art pass (18-07-2026, THIRD map — Acid Lakes top-left corner): row5 is a
    # clean floor run from col3 to col9 (the pool's second lobe sits at cols0-2
    # of this row only), so col3,row5 has plenty of clear runway rightward.
    pg.evaluate("Game.pose({col:3,row:5,progress:0}); Game.resume()")
    x0 = pg.evaluate("Player.x")
    pg.keyboard.down("d"); pg.wait_for_timeout(350); pg.keyboard.up("d")
    t.check(f"keyboard moves ({pg.evaluate('Player.x') - x0:.0f}px)", pg.evaluate("Player.x") - x0 > 30)

    # The recreated map has NO border wall ring (real-map law 1) on its two CUT
    # edges, but col0-1,row4 sit inside the map's own TRUE top-left corner and
    # are genuine open floor (traced from the reference) — walking left off
    # col1,row4 tests the true MAP EDGE stopping the player, not a wall. Beyond
    # col0 is out-of-bounds, which Arena.isSolid treats as solid.
    pg.evaluate("Game.pose({col:1,row:4,progress:0}); Game.resume()")
    pg.keyboard.down("a"); pg.wait_for_timeout(500); pg.keyboard.up("a")
    minx = pg.evaluate("Player.h")
    t.check("the map's true edge stops the player (no border wall needed)", pg.evaluate("Player.x") >= minx - 0.6)

    # Explicit WALL-collision check against a real interior cluster — the
    # bottom-left wall block at row8, cols1-3 (a genuine `#` cluster, distinct
    # from the true top/left border and from the map-edge case above). Start on
    # clear floor at col6,row8 and walk LEFT into it.
    pg.evaluate("Game.pose({col:6,row:8,progress:0}); Game.resume()")
    pg.keyboard.down("a"); pg.wait_for_timeout(500); pg.keyboard.up("a")
    minx2 = pg.evaluate("Arena.T * 4 + Player.h")
    t.check("a real wall cluster stops the player", pg.evaluate("Player.x") >= minx2 - 0.6)

    pg.evaluate("Game.pose({col:8,row:5,progress:0}); Game.resume()")   # clear open floor
    pg.wait_for_timeout(1200)
    t.check("paint timer -> hidden after ~1s still", pg.evaluate("Player.hidden"))

    pg.keyboard.down("s"); pg.wait_for_timeout(60); pg.keyboard.up("s"); pg.wait_for_timeout(20)
    t.check("camo breaks on input", pg.evaluate("Player.progress") < 0.5 and not pg.evaluate("Player.hidden"))

    # repaint via the real path (Map Maker owns it; Game.setRepaint was removed)
    pg.evaluate("Maker.enter(); MAKER.repaint=0.5; Maker.apply();")
    pg.evaluate("Player.x=Arena.centre(8,4).x; Player.y=Arena.centre(8,4).y; Player.still=0; Player.progress=0; Player.hidden=false;")
    pg.wait_for_timeout(650)
    t.check("repaint=0.5s hides by 0.65s", pg.evaluate("Player.hidden"))
    pg.evaluate("Maker.exit()")

    t.finish("movement", errs)
