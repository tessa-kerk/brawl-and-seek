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

    # C) repaint escalation 1.0 -> 1.5 (3 found) -> 2.0 (hidersAlive<=2, which
    # INCLUDES the still-live player per round.js: alive dummies + 1). Roster
    # is now 7 dummies (was 5, 20-07-2026 widescreen crop), so the "2 remain"
    # boundary shifted: alive dummies must drop to 1 (1 dummy + 1 player = 2)
    # -> found>=6, not found>=4 as it was against the old 5-dummy roster.
    # Independent oracle, recomputed from the spec, not copied from round.js.
    def esc(found):
        return pg.evaluate(f"(()=>{{Round.reset(); Hiders.list.forEach((d,i)=>d.found=i<{found}); Round.foundCount={found}; return Round.repaintTime();}})()")
    for k, want in [(0, 1.0), (2, 1.0), (3, 1.5), (6, 2.0), (7, 2.0)]:
        rp = esc(k)
        t.check(f"repaint @{k} found = {rp}s (spec {want}s)", abs(rp - want) < 1e-9)

    # D) 15s hide + compressed seek < 90s; canon 180s cap kept
    tot = pg.evaluate("Round.totalSeconds()"); hide = pg.evaluate("TUNING.round.hidePhase"); cap = pg.evaluate("TUNING.round.canonCapSeconds")
    t.check(f"round {hide}s hide + seek = {tot}s (<90) · canon cap {cap}s kept", hide == 15 and tot < 90 and cap == 180)

    # E) SCORING STARTS AT SEEKER RELEASE (Concept Brief v3.3). Oracle: nothing
    #    accrues/decays/banks during the hide phase; it all begins at release.
    #    Drive Round.update by hand with the player pinned hidden.
    def hidden_tick(phase, secs, reposition=False):
        repos = 'true' if reposition else 'false'
        # keep Round.elapsed pinned inside `phase` so update() doesn't auto-advance
        elapsed = "TUNING.round.hidePhase+1" if phase == 'seek' else "1"
        return pg.evaluate(f"""(()=>{{
          Round.reset(); Round.phase='{phase}'; Round.elapsed={elapsed};
          const T=Arena.T; Player.found=false; Player.hidden=true; Round._wasHidden=false;
          Player.x=4*T; Player.y=4*T;
          Round.update(0.001);                       // paint-in transition sets lastHideSpot
          if({repos}){{ Player.hidden=false; Round._wasHidden=true; Round.update(0.001);
                        Player.x=4*T + 4*T; Player.hidden=true; Round._wasHidden=false; }}
          const step=0.05, n=Math.round({secs}/step);
          for(let i=0;i<n;i++){{ Round.elapsed={elapsed}; Round.update(step); }}
          Round.elapsed={elapsed};
          return {{score:Round.score, camp:Round.camp, rate:Round.rate}};
        }})()""")

    hide5 = hidden_tick('hide', 5)
    t.check(f"HIDE phase: no score after 5s hidden (score {hide5['score']:.1f})", hide5['score'] < 0.001)
    t.check(f"HIDE phase: camp stays 0 (coin full) — camp {hide5['camp']:.2f}, rate {hide5['rate']:.1f}", hide5['camp'] < 0.001 and abs(hide5['rate'] - 10) < 1e-6)
    seek1 = hidden_tick('seek', 1.0)
    t.check(f"SEEK phase: score accrues (~10 after 1s → {seek1['score']:.1f})", 8 < seek1['score'] < 12)
    hideRepos = hidden_tick('hide', 0.2, reposition=True)
    t.check(f"HIDE phase: a >=3-tile repaint banks NOTHING (score {hideRepos['score']:.1f})", hideRepos['score'] < 0.5)
    seekRepos = hidden_tick('seek', 0.1, reposition=True)
    t.check(f"SEEK phase: a >=3-tile repaint banks +100 (score {seekRepos['score']:.0f})", seekRepos['score'] >= 100)

    t.finish("round-canon", errs)
