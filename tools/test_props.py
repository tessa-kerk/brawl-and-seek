"""Independent all-prop collision sweep from raw hand-authored circle geometry."""
import math, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally

with game() as (pg, errs):
    h = pg.evaluate("Player.h")
    props = pg.evaluate("Arena.props.map(({id,kind,x,y,radius})=>({id,kind,x,y,radius}))")
    t = Tally(); failures = []
    for p in props:
        reach = h + p['radius']
        # Hand-geometry oracle: all final centres must be outside the raw circle.
        starts = [(p['x']-reach-8,p['y'],16,0),(p['x']+reach+8,p['y'],-16,0),
                  (p['x'],p['y']-reach-8,0,16),(p['x'],p['y']+reach+8,0,-16),
                  (p['x']-reach-8,p['y']-reach/2,16,16)]
        out = pg.evaluate("(([cs,h])=>cs.map(c=>Arena.collide(c[0],c[1],c[2],c[3],h)))", [starts,h])
        # Leave a small measurement tolerance at a fitted contact boundary;
        # overlap means visibly inside the base, not a sub-pixel tangent.
        bad = [q for q in out if math.hypot(q['x']-p['x'],q['y']-p['y']) < reach-.25]
        if bad: failures.append((p['id'], p['x'], p['y'], reach, bad))
    if failures: print("  failed raw prop cases:", failures[:3])
    t.check(f"all {len(props)} barrel/stump approach, contact and diagonal cases escape raw bases", not failures)
    t.finish("props", errs)
