"""Projectile Tag canon (Concept Brief v3.2 §104).
Oracle = the spec numbers, hand-written here, independent of the code.
"""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game() as (pg, errs):
    pg.evaluate("Game.pause()")
    T = pg.evaluate("Arena.T")
    # Effective base move speed = baseSpeed x the global pace scale. The tag's
    # canon is "2x base MOVE speed", which is scale-invariant — so the oracle
    # includes speedScale (a uniform scale must not break the 2x ratio).
    BASE = pg.evaluate("TUNING.seeker.baseSpeed * STATE.speedScale")
    t = Tally()

    SETUP = """(([sc,sr,tc,tr,hidden])=>{
      Round.phase='seek'; Tags.reset();
      Player.x=Arena.W-24; Player.y=Arena.H-24; Player.found=false; Player.hidden=false;
      Hiders.list.forEach((d,i)=>{ d.found = i>0; });
      const d=Hiders.list[0]; const c=Arena.centre(tc,tr);
      d.found=false; d.x=c.x; d.y=c.y; d.hidden=!!hidden; d.progress=hidden?1:0; d.vx=0; d.vy=0;
      d.camo=Arena.camoSurface(d.x,d.y,d.h);
      const s=Seekers.list[0]; const p=Arena.centre(sc,sr);
      s.x=p.x; s.y=p.y; s.health=100; s.mistakes=0; s.state='patrol'; s.hold=0; s.tagCd=0;
      Seekers.list.length=1;
      return {sx:s.x, sy:s.y, dx:d.x, dy:d.y};})"""
    setup = lambda a, b, c, d, hid=False: pg.evaluate(SETUP, [a, b, c, d, hid])
    def fire(pos, tx, ty): pg.evaluate(f"Tags.fire(Seekers.list[0], {math.atan2(ty-pos['sy'], tx-pos['sx'])})")
    def step(n=1, dt=0.016): [pg.evaluate(f"Tags.update({dt})") for _ in range(n)]
    st = lambda: pg.evaluate("({n:Tags.list.length, hp:Seekers.list[0].health, m:Seekers.list[0].mistakes, state:Seekers.list[0].state, found:Hiders.list[0].found, trav:(Tags.list[0]||{}).travelled})")

    # A) travel speed ~2x base
    pos = setup(1, 1, 8, 1); fire(pos, pos["sx"] + 300, pos["sy"])
    x0 = pg.evaluate("Tags.list[0].x"); step(1, 0.02); x1 = pg.evaluate("Tags.list[0]?Tags.list[0].x:null")
    measured = (x1 - x0) / 0.02 / T if x1 else 0
    t.check(f"travel speed {measured:.2f} = 2x base ({2*BASE:.2f}) tiles/s", abs(measured - 2 * BASE) < 0.15)

    # B) range ~3 tiles, then a MISS costing 30
    pos = setup(1, 1, 8, 4); fire(pos, pos["sx"] + 300, pos["sy"]); trav = 0
    for _ in range(60):
        s = st()
        if s["n"] == 0: break
        trav = s["trav"]; step()
    s = st()
    t.check(f"range {trav/T:.2f} tiles (spec ~3)", abs(trav / T - 3.0) < 0.35)
    t.check(f"empty-air miss costs 30 (hp {s['hp']}, mistakes {s['m']})", s['hp'] == 70 and s['m'] == 1)

    # C) walls block it; wall hit is a wrong tag
    pos = setup(4, 2, 1, 2); fire(pos, pos["dx"], pos["dy"])
    for _ in range(60):
        if st()["n"] == 0: break
        step()
    s = st()
    t.check("wall blocks the tag (hider behind cover survives)", not s['found'])
    t.check(f"wall hit is a wrong tag (hp {s['hp']}, mistakes {s['m']})", s['hp'] == 70 and s['m'] == 1)

    # D/E) camouflaged AND running hits are both the find, no cost
    for hidden, label in [(True, "camouflaged"), (False, "running")]:
        pos = setup(3, 1, 5, 1, hidden); fire(pos, pos["dx"], pos["dy"])
        for _ in range(60):
            if st()["n"] == 0: break
            step()
        s = st()
        t.check(f"{label} hider hit = find, no health cost", s['found'] and s['hp'] == 100)

    # F) 0.75s cooldown
    cd = pg.evaluate("TUNING.tag.cooldown")
    setup(3, 1, 5, 1)
    pg.evaluate("(()=>{const s=Seekers.list[0]; s.state='chase'; s.target=Hiders.list[0]; s.targetPos={x:Hiders.list[0].x,y:Hiders.list[0].y}; s.live=true; s.tagCd=0; s.hold=0;})()")
    pg.evaluate("Seekers.update(0.016)"); n1 = pg.evaluate("Tags.list.length"); cd1 = pg.evaluate("Seekers.list[0].tagCd")
    pg.evaluate("Seekers.update(0.016)"); n2 = pg.evaluate("Tags.list.length")
    t.check(f"cooldown {cd}s (spec 0.75) and no second shot inside it", abs(cd - 0.75) < 1e-9 and n1 == 1 and n2 == 1 and abs(cd1 - 0.75) < 0.05)

    # G) 4th miss -> spectator (via the fired tag)
    setup(1, 1, 8, 4)
    pg.evaluate("Tags.reset(); Seekers.list[0].health=100; Seekers.list[0].mistakes=0; Seekers.list[0].state='patrol';")
    hps = []
    for _ in range(4):
        pos = pg.evaluate("({sx:Seekers.list[0].x, sy:Seekers.list[0].y})")
        pg.evaluate("Tags.fire(Seekers.list[0], 0)")
        for _ in range(60):
            if pg.evaluate("Tags.list.length") == 0: break
            step()
        hps.append(pg.evaluate("({hp:Seekers.list[0].health, st:Seekers.list[0].state})"))
    ok = all(h["hp"] == 100 - 30 * (i + 1) and ((h["st"] == 'spectator') == (100 - 30 * (i + 1) <= 0)) for i, h in enumerate(hps))
    t.check("misses 100->70->40->10->spectator on the 4th", ok)

    t.finish("projectile-tag", errs)
