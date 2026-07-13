"""Round end states (Concept Brief v3.4) — four ways to end, and the edge cases
around TAGGED OUT! (all seekers benched). Oracle = the spec, hand-written here.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game() as (pg, errs):
    pg.evaluate("Game.pause()")   # drive the sim by hand
    T = pg.evaluate("Arena.T")
    t = Tally()

    def bench_all():
        pg.evaluate("Seekers.list.forEach(s=>{s.state='spectator'; s.health=-10;});")

    # 1) TAGGED OUT!: all seekers spectating + no tag in flight -> hiders win
    pg.evaluate("Round.reset(); Round.phase='seek'; Round.elapsed=20; Tags.reset(); Player.found=false;")
    bench_all()
    pg.evaluate("Round.update(0.016)")
    r = pg.evaluate("({phase:Round.phase, reason:Round.result?Round.result.reason:'-', survived:Round.result?Round.result.survived:null})")
    t.check(f"all seekers benched -> ends 'tagged-out', hiders win ({r})", r['phase'] == 'over' and r['reason'] == 'tagged-out' and r['survived'] is True)

    # 2a) an airborne tag DELAYS the end (resolves first)
    #     clear ALL targets so the tag genuinely hits nothing (else it may strike a
    #     randomly-spawned dummy and revive a seeker — that's tested in 2b).
    pg.evaluate("Round.reset(); Round.phase='seek'; Round.elapsed=20; Tags.reset(); Hiders.list.forEach(h=>h.found=true); Player.found=true;")
    bench_all()
    pg.evaluate("Tags.fire(Seekers.list[0], 0)")   # a tag into empty air, mid-flight
    pg.evaluate("Round.update(0.016)")
    t.check("round does NOT end while a tag is still in flight", pg.evaluate("Round.phase") == 'seek')
    for _ in range(60):
        if pg.evaluate("Tags.list.length") == 0: break
        pg.evaluate("Tags.update(0.016)")
    pg.evaluate("Round.update(0.016)")
    t.check("…then the tag misses -> TAGGED OUT!", pg.evaluate("Round.result && Round.result.reason") == 'tagged-out')

    # 2b) an airborne tag that HITS converts a hider -> a fresh seeker -> round CONTINUES
    revive = pg.evaluate("""(()=>{
      Round.reset(); Round.phase='seek'; Round.elapsed=20; Tags.reset(); Player.found=false;
      const d=Hiders.list[0]; const c=Arena.centre(5,1);    // tile CENTRE (clear row, not a wall row)
      Hiders.list.forEach((h,i)=>h.found=i>0);              // one live dummy
      d.found=false; d.x=c.x; d.y=c.y; d.hidden=true;
      Seekers.list.forEach(s=>{s.state='spectator'; s.health=-10;});
      const s=Seekers.list[0]; const sc=Arena.centre(3,1); s.x=sc.x; s.y=sc.y;   // fire right, straight at it
      Tags.fire(s, 0);
      for(let i=0;i<60 && Tags.list.length;i++) Tags.update(0.016);
      Round.update(0.016);
      return {phase:Round.phase, active:Seekers.active().length, found:d.found};})()""")
    t.check(f"in-flight tag hits -> hider converts to a fresh seeker -> round continues ({revive})",
            revive['phase'] == 'seek' and revive['active'] == 1 and revive['found'] is True)

    # 3) no tag can fire during the HIDE phase (seekers held)
    fired = pg.evaluate("""(()=>{
      Round.reset(); Round.phase='hide'; Round.elapsed=1; Tags.reset();
      const T=Arena.T; Player.x=5*T; Player.y=4*T; Player.hidden=false;
      const s=Seekers.list[0]; s.x=Player.x+T; s.y=Player.y; s.hold=0; s.speedEMA=0;
      for(let i=0;i<120;i++) Seekers.update(0.016);
      return Tags.list.length;})()""")
    t.check(f"no tag fires during the hide phase (fired {fired})", fired == 0)

    # 4) a converted seeker arrives fresh: 100 health, 0 mistakes
    fresh = pg.evaluate("(()=>{Seekers.reset(); const n=Seekers.list.length; Seekers.spawnAt(3*Arena.T,3*Arena.T); const s=Seekers.list[n]; return {hp:s.health, m:s.mistakes};})()")
    t.check(f"converted seeker is fresh: 100 hp, 0 mistakes ({fresh})", fresh['hp'] == 100 and fresh['m'] == 0)

    # 5) simultaneity: a tag that HITS the player wins as a FIND (spotted), even if
    #    that seeker was on its last mistake — no bench, no 'tagged-out'.
    sim = pg.evaluate("""(()=>{
      Round.reset(); Round.phase='seek'; Round.elapsed=20; Tags.reset();
      const c=Arena.centre(6,1); Player.x=c.x; Player.y=c.y; Player.hidden=true; Player.found=false;
      Hiders.list.forEach(h=>h.found=true);
      const s=Seekers.list[0]; s.state='patrol'; s.health=10; s.mistakes=3;
      const sc=Arena.centre(4,1); s.x=sc.x; s.y=sc.y;
      Seekers.list.length=1;
      Tags.fire(s, 0);
      for(let i=0;i<60 && Tags.list.length;i++) Tags.update(0.016);
      Round.update(0.016);
      return {reason:Round.result?Round.result.reason:'-', hp:s.health, m:s.mistakes, pfound:Player.found};})()""")
    t.check(f"player hit by the last-mistake seeker's tag -> FIND wins ('spotted'), no bench ({sim})",
            sim['reason'] == 'spotted' and sim['hp'] == 10 and sim['m'] == 3 and sim['pfound'] is True)

    # 6) score-farm: nothing is earned on the ending frame (check runs before scoring)
    farm = pg.evaluate("""(()=>{
      Round.reset(); Round.phase='seek'; Round.elapsed=20; Tags.reset(); Player.found=false;
      Player.hidden=true; Round.score=500; Round._wasHidden=true;
      Seekers.list.forEach(s=>{s.state='spectator'; s.health=-10;});
      const before=Round.score; Round.update(0.5);   // a big dt — must still add 0
      return {before, after:Round.score, phase:Round.phase};})()""")
    t.check(f"no score is earned on the ending frame ({farm})", farm['after'] == farm['before'] and farm['phase'] == 'over')

    # 7) the leaderboard freezes at round end (end() snapshots; live scores can't move it)
    frozen = pg.evaluate("""(()=>{
      Round.reset(); Round.phase='seek'; Round.elapsed=20; Tags.reset(); Player.found=false;
      Hiders.list[0].score=42;
      Seekers.list.forEach(s=>{s.state='spectator'; s.health=-10;});
      Round.update(0.016);                                   // -> over, rows snapshotted
      const row = Round.result.rows.find(r=>r.name===Hiders.list[0].name);
      const snap = row.score;
      Hiders.list[0].score=9999;                             // mutate the live dummy after end
      return {snap, live:Hiders.list[0].score, still:Round.result.rows.find(r=>r.name===Hiders.list[0].name).score};})()""")
    t.check(f"leaderboard row is a frozen snapshot ({frozen})", frozen['snap'] == frozen['still'] and frozen['still'] != frozen['live'])

    t.finish("end-states", errs)
