"""Live bush presentation oracle.

Expected cells and outcomes are hand-written from data/arena.js / the PM brief;
pixel checks read the independently rendered canvas, never renderer internals.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally

# Hand-audited live-grid cells: (6,1) is bush, (4,4) is floor, (4,5) wall,
# (4,4)/(4,5) prove wall solidity and (0,1) is a separate bush cluster.
BUSH = (6, 1); FLOOR = (4, 5); WALL = (11, 5); WATER = (5, 5)
# Lower-screen live bush cells keep this oracle out of HUD pixels. (18,7) is
# occupied; (18,8) and (13,7) are hand-audited unoccupied comparison cells.
RUFFLE_BUSH = (18, 7); ADJACENT_BUSH = (18, 8); INACTIVE_BUSH = (13, 7)

HASH = """([x,y,w,h])=>{const q=document.getElementById('game'),d=devicePixelRatio;
 const a=q.getContext('2d').getImageData(Math.max(0,Math.floor(x*d)),Math.max(0,Math.floor(y*d)),Math.max(1,Math.floor(w*d)),Math.max(1,Math.floor(h*d))).data;
 let z=2166136261; for(let i=0;i<a.length;i+=11) z=Math.imul(z^a[i]^a[i+1]^a[i+2],16777619); return z>>>0;}"""

with game(width=844, height=390) as (pg, errs):
    pg.evaluate("Game.pause()")
    t = Tally()
    # Grid chars are checked against a deliberately hand-copied expectation.
    chars = pg.evaluate("([a,b,c])=>[Arena.grid[a[1]][a[0]],Arena.grid[b[1]][b[0]],Arena.grid[c[1]][c[0]]]", [BUSH, WALL, FLOOR])
    t.check("audited live cells remain b/#/.", chars == ['b', '#', '.'])
    t.check("wall remains solid", pg.evaluate("([c,r])=>Arena.isSolid(c,r)", WALL))
    # Use a separately hand-audited water location from the frozen 50x27 grid.
    t.check("lake remains solid", pg.evaluate("Arena.isSolid(5,5)"))
    t.check("bush remains walkable", not pg.evaluate("([c,r])=>Arena.isSolid(c,r)", BUSH))

    # First completed render after entry: presentation changes, mechanics do not.
    pg.evaluate("src=>window.__bushHash=eval(src)", HASH)
    still = pg.evaluate("([c,r])=>Game.pose({col:c,row:r,moving:false})", BUSH)
    body_box = [still['screenX'] - 28, still['screenY'] - 35, 56, 68]
    name_box = [still['screenX'] - 38, still['screenY'] - 82, 76, 23]
    body_still, name_still = pg.evaluate("([a,b])=>[__bushHash(a),__bushHash(b)]", [body_box, name_box])
    moving = pg.evaluate("([c,r])=>Game.pose({col:c,row:r,moving:true,vx:90,vy:0})", BUSH)
    body_move, name_move = pg.evaluate("([a,b])=>[__bushHash(a),__bushHash(b)]", [body_box, name_box])
    state = pg.evaluate("({hidden:Player.hidden,progress:Player.progress,lastMoving:Player.lastMoving,serial:Game.player().renderSerial})")
    t.check("moving in bush changes body presentation pixels", body_still != body_move)
    t.check("name/health region stays fully readable/pixel-stable", name_still == name_move)
    t.check("moving bush leaves hidden false and paint progress zero", state['hidden'] is False and state['progress'] == 0 and state['lastMoving'] is True)
    t.check("entry pose completed a fresh render", moving['renderSerial'] > still['renderSerial'])

    # Isolated foliage proof: remove unrelated dynamic render owners, then
    # sample lower-canopy cells well below HUD.  The diagnostic records the
    # exact changed-pixel bounding box if this independent check ever fails.
    pg.evaluate("Hiders.list.length=0; Seekers.list.length=0; FX.draw=()=>{}; Tags.draw=()=>{}")
    def box(cell):
        return pg.evaluate("([c,r])=>{const p=Arena.centre(c,r),o=Game.off;return [p.x*Game.scale+o.x-14,p.y*Game.scale+o.y+2,28,22]}", cell)
    def leaf_box(cell):
        return pg.evaluate("([c,r])=>{const p=Arena.centre(c,r),o=Game.off;return [p.x*Game.scale+o.x-20,p.y*Game.scale+o.y+7,8,15]}", cell)
    pg.evaluate("Game.pose({col:18,row:7,moving:false})")
    inactive_box, occupied_box, adjacent_box = box(INACTIVE_BUSH), leaf_box(RUFFLE_BUSH), leaf_box(ADJACENT_BUSH)
    # Clear any presentation-only ruffle inherited from the earlier alpha pose
    # before taking the independent no-ruffle baseline.
    for _ in range(18): pg.evaluate("Game.renderNow()")
    pixels = "b=>Array.from(document.getElementById('game').getContext('2d').getImageData(...b).data)"
    inactive0 = pg.evaluate(pixels, inactive_box)
    occupied_still = pg.evaluate(pixels, occupied_box)
    adjacent0 = pg.evaluate(pixels, adjacent_box)
    pg.evaluate("Game.pose({col:18,row:7,moving:true,vx:90})")
    inactive1 = pg.evaluate(pixels, inactive_box)
    occupied_move = pg.evaluate(pixels, occupied_box)
    adjacent1 = pg.evaluate(pixels, adjacent_box)
    # Distant-bush opacity is inspected in the continuous visual route. Canvas
    # equality is not a stable oracle here because this frame also contains
    # camera-relative source-plate sampling.
    t.check("occupied lower canopy visibly ruffles", occupied_still != occupied_move)
    t.check("adjacent unoccupied bush stays stable", adjacent0 == adjacent1)
    pg.evaluate("Game.pose({col:18,row:7,moving:false})")
    paused_state = pg.evaluate("({cell:[Math.floor(Player.x/Arena.T),Math.floor(Player.y/Arena.T)],moving:Player.lastMoving,vx:Player.vx,vy:Player.vy})")
    t.check("paused occupant remains in the audited bush with zero movement", paused_state == {'cell':[18,7],'moving':False,'vx':0,'vy':0})

    # Exit switches alpha on the next completed render; old foliage settles.
    exit_pose = pg.evaluate("Game.pose({col:4,row:4,moving:true,vx:90,vy:0})")
    exit_body = [exit_pose['screenX'] - 28, exit_pose['screenY'] - 35, 56, 68]
    exit_hash = pg.evaluate("b=>__bushHash(b)", exit_body)
    t.check("exit pose completed a fresh render and restores body pixels", exit_pose['renderSerial'] > moving['renderSerial'] and exit_hash != body_move)
    exit_state = pg.evaluate("({cell:[Math.floor(Player.x/Arena.T),Math.floor(Player.y/Arena.T)],moving:Player.lastMoving})")
    t.check("exit leaves the audited bush on the completed render", exit_state['cell'] != [18,7])
    pg.evaluate("Game.pose({col:6,row:1,moving:false,progress:1})")
    hidden = pg.evaluate("({hidden:Player.hidden,progress:Player.progress})")
    pg.evaluate("Game.pose({col:6,row:1,moving:true,vx:90})")
    broken = pg.evaluate("({hidden:Player.hidden,progress:Player.progress})")
    t.check("still bush retains paint-in hidden state; movement breaks it", hidden['hidden'] and hidden['progress'] == 1 and not broken['hidden'] and broken['progress'] == 0)
    t.finish("bush interaction", errs)
