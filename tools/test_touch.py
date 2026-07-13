"""Touch UI: buttons fire on a phone (the preventDefault bug that killed every
button, incl. M2's Play again), the joystick still drives on the arena, and the
uiIds set self-heals if iOS drops a UI touchend and reuses the identifier."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally, touch  # noqa: E402

with game(width=390, height=844, mobile=True) as (pg, errs):
    t = Tally()

    pg.tap("#mk-open"); pg.wait_for_timeout(350)
    t.check("tap Map Maker button enters editor", pg.evaluate("STATE.view") == "maker")

    pg.tap('#mk-repaint button[data-repaint="0.5"]'); pg.wait_for_timeout(80)
    pg.tap('.mk-surf[data-surface="water"]'); pg.wait_for_timeout(80)
    pg.tap('#mk-ripple'); pg.wait_for_timeout(80)
    s = pg.evaluate("({rp:STATE.repaintTime, water:STATE.camoSurfaces.water, tell:STATE.rippleTell})")
    t.check("panel controls fire on touch", s["rp"] == 0.5 and s["water"] is False and s["tell"] is False)

    # joystick still drives on the arena (not stolen by the UI exclusion)
    pg.evaluate("Game.resume(); Player.x=Arena.centre(5,4).x; Player.y=Arena.centre(5,4).y; Player.vx=0;Player.vy=0;")
    x0 = pg.evaluate("Player.x")
    touch(pg, "touchstart", 120, 300, idn=9)
    touch(pg, "touchmove", 170, 300, idn=9)
    pg.wait_for_timeout(200)
    touch(pg, "touchend", 170, 300, idn=9)
    t.check(f"joystick still drives on the arena ({pg.evaluate('Player.x') - x0:.0f}px)", pg.evaluate("Player.x") - x0 > 8)

    pg.tap("#mk-back"); pg.wait_for_timeout(300)
    t.check("tap ◂ Event restores canon", pg.evaluate("STATE.view") == "event" and pg.evaluate("Object.values(STATE.camoSurfaces).every(Boolean)"))

    # Pace picker (M4 gate control): tappable, changes pace live, survives Play again
    pg.tap('#pace-seg button[data-speed="0.70"]'); pg.wait_for_timeout(80)
    t.check("pace picker A sets speed live on touch", abs(pg.evaluate("STATE.speedScale") - 0.70) < 1e-9)
    pg.tap('#pace-seg button[data-speed="1.00"]'); pg.wait_for_timeout(80)
    t.check("pace picker C sets speed live on touch", abs(pg.evaluate("STATE.speedScale") - 1.00) < 1e-9)

    # Play again (was dead on touch) fires, and the pace choice survives it
    pg.evaluate("Round.end('timeout'); Round.overT=2.5;"); pg.wait_for_timeout(300)
    pg.tap("#replay"); pg.wait_for_timeout(300)
    t.check("Play again fires on touch", pg.evaluate("Round.phase") == "hide")
    t.check("pace choice survives Play again", abs(pg.evaluate("STATE.speedScale") - 1.00) < 1e-9)

    # GHOST-TOUCHEND HARDENING: a UI touch id 7 whose touchend never arrives,
    # then id 7 reused for a GAME touch — must NOT be excluded from the stick.
    pg.evaluate("Game.resume(); Player.x=Arena.centre(5,4).x; Player.y=Arena.centre(5,4).y; Player.vx=0;Player.vy=0;")
    touch(pg, "touchstart", 195, 750, idn=7, ui_sel="#mk-open")   # id7 begins on UI chrome
    # (no touchend for id7 — the iOS ghost)
    gx0 = pg.evaluate("Player.x")
    touch(pg, "touchstart", 120, 300, idn=7)                       # id7 REUSED as a game touch
    touch(pg, "touchmove", 175, 300, idn=7)
    pg.wait_for_timeout(220)
    touch(pg, "touchend", 175, 300, idn=7)
    t.check(f"reused id after a dropped UI touchend still drives ({pg.evaluate('Player.x') - gx0:.0f}px)",
            pg.evaluate("Player.x") - gx0 > 8)

    t.finish("touch", errs)
