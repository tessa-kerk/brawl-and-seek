"""Round canon rules (Concept Brief "Design tuning").
Oracle = Tessa's spec numbers written by hand here, independent of the code.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game() as (pg, errs):
    pg.evaluate("Game.pause()")
    T = pg.evaluate("Arena.T")
    t = Tally()

    # A) hider score rate: +10/s, halves every 10s in a spot, floor 2/s
    for camp in [0, 10, 20, 30, 40]:
        got = pg.evaluate(f"Math.max(TUNING.hider.rateFloor, TUNING.hider.scoreRate*Math.pow(0.5,{camp}/TUNING.hider.rateHalfLife))")
        want = max(2, 10 * 0.5 ** (camp / 10))
        t.check(f"score rate @camp {camp}s = {got:.2f} (spec {want:.2f})", abs(got - want) < 1e-6)

    # B) reposition: >=3 tiles banks +100 and resets rate; <3 does not
    def repos(dist):
        return pg.evaluate(f"""(()=>{{Round.reset(); Round.phase='seek';
          const T={T}, x0=3*T, y0=4*T;
          Player.x=x0; Player.y=y0; Player.hidden=true; Round._wasHidden=false; Round.camp=7;
          Round.update(0.001);
          Player.hidden=false; Round._wasHidden=true; Round.update(0.001);
          Player.x=x0+{dist}*T; Player.hidden=true; Round._wasHidden=false;
          const before=Round.score; Round.update(0.001);
          return {{delta:Round.score-before, camp:Round.camp}};}})()""")
    r3 = repos(4); r1 = repos(1.5)
    t.check(f"reposition 4 tiles banks +{r3['delta']:.0f} & resets rate", abs(r3['delta'] - 100) < 1 and r3['camp'] < 0.1)
    t.check(f"reposition 1.5 tiles banks nothing (+{r1['delta']:.0f}), keeps camp", r1['delta'] < 1 and r1['camp'] > 1)

    # C) repaint escalation 1.0 -> 1.5 (3 found) -> 2.0 (2 remain)
    def esc(found):
        return pg.evaluate(f"(()=>{{Round.reset(); Hiders.list.forEach((d,i)=>d.found=i<{found}); Round.foundCount={found}; return Round.repaintTime();}})()")
    for k, want in [(0, 1.0), (2, 1.0), (3, 1.5), (4, 2.0), (5, 2.0)]:
        rp = esc(k)
        t.check(f"repaint @{k} found = {rp}s (spec {want}s)", abs(rp - want) < 1e-9)

    # D) 15s hide + compressed seek < 90s; canon 180s cap kept
    tot = pg.evaluate("Round.totalSeconds()"); hide = pg.evaluate("TUNING.round.hidePhase"); cap = pg.evaluate("TUNING.round.canonCapSeconds")
    t.check(f"round {hide}s hide + seek = {tot}s (<90) · canon cap {cap}s kept", hide == 15 and tot < 90 and cap == 180)

    t.finish("round-canon", errs)
