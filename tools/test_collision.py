"""M1 collision proof — platform-independent.

Oracle = raw grid plus hand-authored prop circles (`box_hits`), never
`Arena.collide()`. Two invariants over a fine grid of positions x 8 dirs:
  - no-clip: collide() never leaves the player's box inside a wall
  - slide:   if an axis is geometrically free to move, collide() must move it
This is geometry, so it holds identically on every device.
"""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally  # noqa: E402

STEP = 6.0
DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]

with game() as (pg, errs):
    T = pg.evaluate("Arena.T"); h = pg.evaluate("Player.h")
    cols = pg.evaluate("Arena.cols"); rows = pg.evaluate("Arena.rows")
    grid = pg.evaluate("Arena.grid.map(r=>r.join(''))")
    props = pg.evaluate("Arena.props.map(({id,kind,x,y,radius})=>({id,kind,x,y,radius}))")
    W, H = cols * T, rows * T

    def solid(c, r):
        return (c < 0 or r < 0 or c >= cols or r >= rows) or grid[r][c] in "#~"

    def box_hits(x, y):
        c0 = math.floor((x - h) / T); c1 = math.floor((x + h) / T)
        r0 = math.floor((y - h) / T); r1 = math.floor((y + h) / T)
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                if solid(c, r):
                    return True
        for p in props:
            if math.hypot(x - p['x'], y - p['y']) < h + p['radius'] - 0.01:
                return True
        return False

    starts = []
    x = T * 0.5
    while x < W - T * 0.4:
        y = T * 0.5
        while y < H - T * 0.4:
            if not box_hits(x, y):
                starts.append((round(x, 2), round(y, 2)))
            y += 10
        x += 10
    cases = [[px, py, sx * STEP, sy * STEP] for (px, py) in starts for (sx, sy) in DIRS]
    res = pg.evaluate(
        "(([cs,h])=>cs.map(c=>{const p=Arena.collide(c[0],c[1],c[2],c[3],h);return [p.x,p.y];}))",
        [cases, h])

    clip = stuckx = stucky = 0; y_examples = []
    for (px, py, dx, dy), (rx, ry) in zip(cases, res):
        if box_hits(rx, ry):
            clip += 1; continue
        if dx != 0 and not box_hits(px + dx, py) and abs(rx - px) <= 0.5 * STEP:
            stuckx += 1
        if dy != 0 and not box_hits(rx, py + dy) and abs(ry - py) <= 0.5 * STEP:
            stucky += 1
            if len(y_examples) < 3: y_examples.append(((px, py, dx, dy), (rx, ry)))

    t = Tally()
    print(f"  {len(starts)} positions x 8 dirs = {len(cases)} cases  (corridor {T}px, box {2*h:.1f}px)")
    if y_examples: print(f"  sample blocked-Y cases: {y_examples}")
    t.check("no-clip: collide never ends inside a wall or prop", clip == 0)
    t.check("slide: free X axis always moves", stuckx == 0)
    t.check("slide: free Y axis always moves", stucky == 0)

    # EXPLICIT edge-of-map case set (art pass 18-07-2026): the general sweep
    # above already samples every free cell across the whole grid — including
    # cells that sit on the true grid boundary, now that the recreated map has
    # NO border wall ring (real-map law 1) — so edge geometry was already
    # implicitly covered. This section makes it an explicit, independently-
    # named proof per the PM's instruction, rather than a side-effect of the
    # general sweep: every free cell whose col/row touches 0/cols-1/rows-1,
    # pushed straight toward the true boundary, must never cross world bounds.
    edge_starts = [(x, y) for (x, y) in starts
                   if math.floor((x - h) / T) <= 0 or math.floor((x + h) / T) >= cols - 1
                   or math.floor((y - h) / T) <= 0 or math.floor((y + h) / T) >= rows - 1]
    edge_cases = [[px, py, sx * STEP, sy * STEP] for (px, py) in edge_starts for (sx, sy) in DIRS]
    edge_res = pg.evaluate(
        "(([cs,h])=>cs.map(c=>{const p=Arena.collide(c[0],c[1],c[2],c[3],h);return [p.x,p.y];}))",
        [edge_cases, h])
    out_of_bounds = sum(1 for (rx, ry) in edge_res if rx - h < -0.5 or rx + h > W + 0.5 or ry - h < -0.5 or ry + h > H + 0.5)
    print(f"  edge-of-map: {len(edge_starts)} boundary-adjacent positions x 8 dirs = {len(edge_cases)} cases")
    t.check("edge-of-map: the true grid boundary always stops the box (no border wall needed)", out_of_bounds == 0)

    t.finish("collision", errs)
