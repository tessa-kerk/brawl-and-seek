"""M3 Map Maker: the three properties change the mechanic live, AND the Event
view (a signed-off regression surface) still fits by the pre-M3 formula exactly.
Geometry oracle = the original fit formula, recomputed here."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

with game(query="?view=maker") as (pg, errs):
    pg.wait_for_function("STATE.view==='maker'", timeout=5000)
    t = Tally()

    t.check("sandbox: 1 seeker, 0 dummies, no round clock",
            pg.evaluate("Seekers.list.length") == 1 and pg.evaluate("Hiders.list.length") == 0)

    # camo surfaces mutate live; null when nothing qualifies
    pg.evaluate("Player.x=Arena.centre(4,1).x; Player.y=Arena.centre(4,1).y;")
    pg.evaluate("MAKER.surfaces={wall:false,floor:true,water:false}; Maker.apply();")
    t.check("floor-only still camouflages beside a wall", pg.evaluate("!!Arena.camoSurface(Player.x,Player.y,Player.h)"))
    pg.evaluate("MAKER.surfaces={wall:false,floor:false,water:false}; Maker.apply();")
    t.check("all surfaces off -> camoSurface null + warning shown",
            pg.evaluate("Arena.camoSurface(Player.x,Player.y,Player.h)") is None
            and pg.evaluate("!document.getElementById('mk-warn').hidden"))
    pg.evaluate("Player.still=0;Player.progress=0;Player.hidden=false;"); pg.wait_for_timeout(1300)
    t.check("no surface -> standing still never hides", pg.evaluate("Player.progress") == 0 and not pg.evaluate("Player.hidden"))

    # repaint live
    pg.evaluate("Maker.enter(); MAKER.surfaces={wall:true,floor:true,water:true}; MAKER.repaint=0.5; Maker.apply();")
    pg.evaluate("Player.x=Arena.centre(4,1).x; Player.y=Arena.centre(4,1).y; Player.still=0;Player.progress=0;Player.hidden=false;")
    pg.wait_for_timeout(650)
    t.check("repaint 0.5s applies live", pg.evaluate("Player.hidden"))

    # ripple tell gate: off => no ripple AND the bot never notices a hidden hider
    noticed = pg.evaluate("""(()=>{
      MAKER.ripple=false; Maker.apply();
      TUNING.seeker.noticeChance=5.0;                       // cranked — still no clue
      const c=Arena.centre(5,1); Player.x=c.x; Player.y=c.y;
      Player.still=9; Player.progress=1; Player.hidden=true; Player.found=false;
      Player.camo=Arena.camoSurface(Player.x,Player.y,Player.h);
      const s=Seekers.list[0]; s.hold=0; s.state='patrol'; s.target=null; s.tagCd=99;
      s.x=Player.x+30; s.y=Player.y; s.speedEMA=1;
      let saw=false;
      for(let i=0;i<120;i++){ Seekers.update(0.016); if(s.target===Player) saw=true; }
      return saw;})()""")
    t.check("ripple tell OFF -> bot never locks onto a hidden hider (camo perfect)", not noticed)
    pg.evaluate("Maker.exit()")

    # Event-view regression: fit must equal the pre-M3 formula exactly
    W = pg.evaluate("Arena.W"); H = pg.evaluate("Arena.H")
    ok = True
    for w, hh in [(1280, 800), (390, 844), (360, 740)]:
        pg.set_viewport_size({"width": w, "height": hh}); pg.wait_for_timeout(120)
        sc = pg.evaluate("Game.scale"); off = pg.evaluate("Game.off")
        want = min(w / W, hh / H)
        if not (abs(sc - want) < 1e-6 and abs(off["x"] - (w - W * want) / 2) < 1e-4 and abs(off["y"] - (hh - H * want) / 2) < 1e-4):
            ok = False
    t.check("Event view fit unchanged from pre-M3 (independent formula oracle)", ok)

    t.finish("map-maker", errs)
