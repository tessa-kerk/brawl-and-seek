"""No-rotate-prompt: held portrait, #stage renders rotated via CSS and touch
coordinates must be remapped into that rotated space (Concept Brief rule 3l,
20-07-2026 -- "it loads landscape and you turn," no stop-and-ask screen).
PM's own words: "test the input mapping properly in the rotated state --
that's the risky bit." Expected touch->game coordinates are HAND-DERIVED
from the CSS transform's geometry (rotate(90deg) translateY(-100%) on a box
sized 100vh x 100vw), independent of src/input.js's own remap() -- this test
would catch a wrong sign or a swapped axis that a same-code check couldn't."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally, touch  # noqa: E402

PW, PH = 390, 844  # physical portrait viewport

with game(width=PW, height=PH, mobile=True) as (pg, errs):
    t = Tally()

    # #stage's OWN layout box (unaffected by the CSS transform) must read as
    # a LANDSCAPE box (100vh wide x 100vw tall) -- this is what game.js's
    # resize() reads via stage.clientWidth/Height, so the whole fit formula
    # keeps working unmodified only if this holds.
    box = pg.evaluate("({w: document.getElementById('stage').clientWidth, h: document.getElementById('stage').clientHeight})")
    t.check(f"#stage lays out as a landscape box in portrait ({box['w']}x{box['h']}, want ~{PH}x{PW})",
             abs(box["w"] - PH) < 3 and abs(box["h"] - PW) < 3)

    # Independent hand-derivation (NOT calling input.js's remap()): the CSS
    # transform is rotate(90deg) translateY(-100%), transform-origin top
    # left, on a box of height PW (=innerWidth, the translateY(-100%)
    # distance). Inverting that transform: local(lx,ly) <- physical(sx,sy)
    # via lx=sy, ly=PW-sx. The fixed-joystick's base sits at local
    # (~126.6,270) for this viewport (input.js base(), independent of this
    # formula) -> physical (390-270, 126.6) = (120,127). Start the touch
    # there (near-zero initial deflection) then drag, so the resulting
    # movement direction is cleanly attributable to the drag delta, not
    # clamped/dominated by a large touchstart-to-anchor jump.
    # Player is posed on col8,row6 -- real open floor, not water/wall, so
    # collision resolution can't inject its own displacement into the read.
    assert pg.evaluate("Arena.grid[6][8]") == '.', "test fixture drifted off open floor"
    pg.evaluate("Game.resume(); Player.x=Arena.centre(8,6).x; Player.y=Arena.centre(8,6).y; Player.vx=0;Player.vy=0;")
    x0, y0 = pg.evaluate("Player.x"), pg.evaluate("Player.y")
    touch(pg, "touchstart", 120, 127, idn=3)
    touch(pg, "touchmove", 120, 167, idn=3)   # physical Y +40, X fixed -> local X +40
    pg.wait_for_timeout(220)
    touch(pg, "touchend", 120, 167, idn=3)
    dx, dy = pg.evaluate("Player.x") - x0, pg.evaluate("Player.y") - y0
    t.check(f"physical Y+40 drag moves the player EAST in game space (dx={dx:.0f}, dy={dy:.0f})", dx > 8)
    t.check(f"...and not appreciably north/south (dy={dy:.0f} should stay small)", abs(dy) < 8)

    # Same drag again but on the OTHER physical axis: physical X+40 (Y fixed)
    # should read as local ly=PW-sx decreasing -> local Y decreases -> the
    # player moves NORTH (game space "up").
    pg.evaluate("Game.resume(); Player.x=Arena.centre(8,6).x; Player.y=Arena.centre(8,6).y; Player.vx=0;Player.vy=0;")
    x0, y0 = pg.evaluate("Player.x"), pg.evaluate("Player.y")
    touch(pg, "touchstart", 120, 127, idn=4)
    touch(pg, "touchmove", 160, 127, idn=4)   # physical X +40, Y fixed -> local Y -40
    pg.wait_for_timeout(220)
    touch(pg, "touchend", 160, 127, idn=4)
    dx2, dy2 = pg.evaluate("Player.x") - x0, pg.evaluate("Player.y") - y0
    t.check(f"physical X+40 drag moves the player NORTH in game space (dx={dx2:.0f}, dy={dy2:.0f})", dy2 < -8)
    t.check(f"...and not appreciably east/west (dx={dx2:.0f} should stay small)", abs(dx2) < 8)

    t.finish("rotate", errs)
