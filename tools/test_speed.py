"""M4 global speed pass. The scale changes absolute pace but must PRESERVE the
validated ratios (player > seeker so a runner breaks away; tag = 2x base), and a
uniformly-slower game must still resolve inside 90s with camping still punished.

Oracle = the ratios and round budget written by hand, independent of the code.
"""
import sys, pathlib, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game() as (pg, errs):
    t = Tally()
    # Re-derived by measurement (Concept Brief rule 3j, 20-07-2026), not the
    # earlier blind A/B/C pick — Tessa's real bot-match footage measured
    # ~2.4 tiles/s (phase-correlation world-scroll, independent of our own
    # movement code), landing the scale at 0.57. Oracle updated deliberately;
    # see data/tuning.js for the full measurement writeup.
    pdef = pg.evaluate("STATE.speedScale")
    t.check(f"default speedScale is the footage-measured pick ({pdef}, want 0.57)", abs(pdef - 0.57) < 1e-9)

    # ratios are scale-invariant: measure the raw component speeds at 1.0 and 0.6
    def speeds(scale):
        pg.evaluate(f"Game.setSpeed({scale})")
        return pg.evaluate("""({
            player: CFG.playerSpeed * STATE.speedScale,
            base:   TUNING.seeker.baseSpeed * STATE.speedScale,
            tag:    TUNING.seeker.baseSpeed * TUNING.tag.speedMult * STATE.speedScale
        })""")
    a = speeds(1.0); b = speeds(0.6)
    t.check("player faster than seeker base (a runner can break away) — both scales",
            a["player"] > a["base"] and b["player"] > b["base"])
    t.check(f"tag = 2x base move speed at both scales ({a['tag']/a['base']:.2f}x, {b['tag']/b['base']:.2f}x)",
            abs(a["tag"] / a["base"] - 2) < 1e-9 and abs(b["tag"] / b["base"] - 2) < 1e-9)
    r1 = a["player"] / a["base"]; r2 = b["player"] / b["base"]
    t.check(f"player/base ratio identical across scales ({r1:.4f} vs {r2:.4f})", abs(r1 - r2) < 1e-9)

    # ?speed= override applies live and is clamped
    pg.evaluate("Game.setSpeed(0.5)")
    t.check("Game.setSpeed(0.5) applies", abs(pg.evaluate("STATE.speedScale") - 0.5) < 1e-9)
    pg.evaluate("Game.setSpeed(9)")
    t.check("out-of-range speed rejected (kept previous)", abs(pg.evaluate("STATE.speedScale") - 0.5) < 1e-9)

    # a full round at the provisional scale still resolves inside 90s
    pg.evaluate(f"Game.setSpeed({pdef}); Game.newRound();")
    t0 = time.time()
    while time.time() - t0 < 95:
        if pg.evaluate("Round.phase==='over'"):
            break
        pg.wait_for_timeout(1200)
    elapsed = pg.evaluate("Round.elapsed")
    reason = pg.evaluate("Round.result ? Round.result.reason : '-'")
    t.check(f"round resolves inside 90s at scale {pdef} ({elapsed:.1f}s, {reason})", elapsed < 90 and reason != '-')

    t.finish("speed", errs)
