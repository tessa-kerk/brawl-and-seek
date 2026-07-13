"""M1 collision proof — platform-independent.

Oracle = pure grid overlap (`box_hits`), computed straight from the tile grid,
INDEPENDENT of collide(). Two invariants over a fine grid of positions x 8 dirs:
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

    clip = stuckx = stucky = 0
    for (px, py, dx, dy), (rx, ry) in zip(cases, res):
        if box_hits(rx, ry):
            clip += 1; continue
        if dx != 0 and not box_hits(px + dx, py) and abs(rx - px) <= 0.5 * STEP:
            stuckx += 1
        if dy != 0 and not box_hits(rx, py + dy) and abs(ry - py) <= 0.5 * STEP:
            stucky += 1

    t = Tally()
    print(f"  {len(starts)} positions x 8 dirs = {len(cases)} cases  (corridor {T}px, box {2*h:.1f}px)")
    t.check("no-clip: collide never ends inside a wall", clip == 0)
    t.check("slide: free X axis always moves", stuckx == 0)
    t.check("slide: free Y axis always moves", stucky == 0)
    t.finish("collision", errs)
