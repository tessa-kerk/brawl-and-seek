/* Brawl & Seek â€” the arena: grid parsing, collision, camo-surface lookup, and
 * the top-down tile rendering (chunky beveled walls, checkered floor, an aqua
 * pool) that has to read as "a Brawl-like arena" at a glance. */
(function () {
  const T = CFG.tile;
  const S = ARENA.surfaces;
  const grid = ARENA.grid.map((row) => row.split(''));
  const rows = grid.length, cols = grid[0].length;
  const W = cols * T, H = rows * T;
  let plateLayerCache = null, bushRuffle = { x: 0, y: 0, c: -1, r: -1 };
  // Directive 002's reference-locked fixture is deliberately query-gated.
  // It paints no cells into the 50×27 arena data and never alters collision.
  const truthMode = new URLSearchParams(location.search).get('truth') === '1';
  // Directive 002B: one contiguous source crop c7/r1 from 30.0s, translated
  // into this isolated fixture at world origin (10,9). No generated v37 unit
  // is used here; all geometry is deterministic and axis-aligned.
  const TRUTH = {
    horizontal: { cells: [[11,11],[12,11],[13,11]] },
    vertical: { cells: [[21,9],[21,10],[21,11]] },
    bush: [[10,12],[10,15],[11,15],[12,15],[13,15],[14,15]],
    lake: [[10,13],[11,13],[12,13],[13,13],[10,14],[11,14],[12,14],[13,14],[14,14],[11,15],[12,15],[13,15]],
    props: [
      { c: 10, r: 9, key: 'stump', rot: 0 }, { c: 16, r: 9, key: 'barrel_plain' },
      { c: 20, r: 10, key: 'barrel_cobweb' }, { c: 15, r: 11, key: 'bones_pair' },
      { c: 17, r: 11, key: 'bones_skull' }, { c: 20, r: 12, key: 'stump', rot: 20 },
      { c: 18, r: 15, key: 'bones_ribs' },
    ],
  };

  const isWall  = (c, r) => inBounds(c, r) && grid[r][c] === '#';
  const isWater = (c, r) => inBounds(c, r) && grid[r][c] === '~';
  // Bush (art pass, 18-07-2026): walkable, unlike walls â€” Tessa's ruling, a real
  // camo surface, not a collider. The map's true edge is now open floor/bush
  // (no border wall ring â€” see data/arena.js), so isSolid(out-of-bounds)=true
  // IS the arena's boundary; nothing else marks it.
  const isBush  = (c, r) => inBounds(c, r) && grid[r][c] === 'b';
  const isSolid = (c, r) => !inBounds(c, r) || grid[r][c] === '#' || grid[r][c] === '~';
  function inBounds(c, r) { return c >= 0 && r >= 0 && c < cols && r < rows; }

  // Spawn (the 'S' cell), centre of its tile.
  function spawn() {
    if (truthMode) return centre(16, 13);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      if (grid[r][c] === 'S') return { x: c * T + T / 2, y: r * T + T / 2 };
    return { x: W / 2, y: H / 2 };
  }

  /* Move-and-slide tile collision. Two fully DECOUPLED axis passes so a wall on
   * one axis can never eat movement on the free axis (the bug that pinned a
   * hider in a 1-wide corridor and reported "blocked X:YES Y:YES" while pushing
   * into open space):
   *   1. Move X, resolve against tiles overlapping the ORIGINAL y-band [pyÂ±h].
   *   2. Move Y, resolve against tiles overlapping the RESOLVED x-band [xÂ±h].
   * No path reverts the whole move or re-clamps into the prior contact point. */
  const EPS = 0.01;
  function collide(px, py, dx, dy, h) {
    let x = px, y = py;
    if (dx !== 0) {
      x = px + dx;
      const rTop = Math.floor((py - h) / T), rBot = Math.floor((py + h) / T);
      if (dx > 0) { const c = Math.floor((x + h) / T); for (let r = rTop; r <= rBot; r++) if (isSolid(c, r)) { x = c * T - h - EPS; break; } }
      else { const c = Math.floor((x - h) / T); for (let r = rTop; r <= rBot; r++) if (isSolid(c, r)) { x = (c + 1) * T + h + EPS; break; } }
    }
    if (dy !== 0) {
      y = py + dy;
      const cLeft = Math.floor((x - h) / T), cRight = Math.floor((x + h) / T);
      if (dy > 0) { const r = Math.floor((y + h) / T); for (let c = cLeft; c <= cRight; c++) if (isSolid(c, r)) { y = r * T - h - EPS; break; } }
      else { const r = Math.floor((y - h) / T); for (let c = cLeft; c <= cRight; c++) if (isSolid(c, r)) { y = (r + 1) * T + h + EPS; break; } }
    }
    return { x, y };
  }

  /* Which surface does a hider at (px,py) paint into? Priority wall > bush >
   * water > floor (art pass, 18-07-2026, PM-approved): hugging solid cover
   * beats standing in foliage beats sitting by the pond beats open floor.
   * Returns {type, color}. Floor returns the exact checker shade underfoot so
   * the blend is pixel-honest. */
  /* Which surfaces paint you is a MAP PROPERTY (the Map Maker toggle), so this
   * reads STATE.camoSurfaces rather than assuming all four. Returns null when
   * nothing here qualifies â€” stand there all day and you'll never vanish. */
  const enabled = () => (window.STATE && STATE.camoSurfaces) || { wall: true, floor: true, water: true, bush: true };

  function camoSurface(px, py, h) {
    const en = enabled();
    const pad = T * 0.42;             // reach a touch beyond the body to "hug"
    const c0 = Math.floor((px - h - pad) / T), c1 = Math.floor((px + h + pad) / T);
    const r0 = Math.floor((py - h - pad) / T), r1 = Math.floor((py + h + pad) / T);
    let bush = null, water = null;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (en.wall && isWall(c, r)) return { type: 'wall', color: S.wallTop };
      if (en.bush && !bush && isBush(c, r)) bush = { type: 'bush', color: S.bush };
      if (en.water && !water && isWater(c, r)) water = { type: 'water', color: S.water };
    }
    if (bush) return bush;
    if (water) return water;
    if (!en.floor) return null;
    const cc = Math.floor(px / T), cr = Math.floor(py / T);
    return { type: 'floor', color: ((cc + cr) & 1) ? S.floorB : S.floorA };
  }

  const typeAt = (c, r) => (grid[r][c] === '#' ? 'wall' : grid[r][c] === '~' ? 'water' : grid[r][c] === 'b' ? 'bush' : 'floor');

  /* Map Maker only: show, at a glance, which surfaces camouflage you. Enabled
   * surfaces glow teal; disabled ones fall under a scrim. Flip a toggle and the
   * map itself tells you what changed. */
  function drawCamoOverlay(ctx) {
    const en = enabled(), teal = CFG.palette.teal;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const type = typeAt(c, r);
      const on = !!en[type];
      const x = c * T, y = r * T;
      if (on) {
        ctx.globalAlpha = 0.09; ctx.fillStyle = teal;
        ctx.fillRect(x, y, T, T);
        ctx.globalAlpha = 0.55; ctx.strokeStyle = teal; ctx.lineWidth = 1.5;
        roundRect(ctx, x + 4, y + 4, T - 8, T - 8, type === 'wall' ? 10 : 4); ctx.stroke();
      } else {
        ctx.globalAlpha = 0.34; ctx.fillStyle = '#080B18';
        ctx.fillRect(x, y, T, T);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---- Navigation (BFS on the tile grid; the arena is tiny, so this is free) --
  const freeTiles = [], hideTiles = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (isSolid(c, r)) continue;
    freeTiles.push({ c, r });
    // A good hiding spot = touches (or IS) something to paint into: a wall or
    // water tile adjacent, OR a bush tile itself/adjacent (bush is walkable â€”
    // you stand IN it, not beside it, art pass 18-07-2026 â€” dummies must be
    // able to pick bush tiles directly, not just their neighbours).
    if (isSolid(c - 1, r) || isSolid(c + 1, r) || isSolid(c, r - 1) || isSolid(c, r + 1)
      || isBush(c, r) || isBush(c - 1, r) || isBush(c + 1, r) || isBush(c, r - 1) || isBush(c, r + 1))
      hideTiles.push({ c, r });
  }
  const centre = (c, r) => ({ x: c * T + T / 2, y: r * T + T / 2 });
  const tileOf = (x, y) => ({ c: Math.floor(x / T), r: Math.floor(y / T) });
  const key = (c, r) => r * cols + c;

  // Shortest tile path from (c0,r0) to (c1,r1). Returns [{c,r}â€¦] excluding the
  // start, or null if unreachable. 4-way â€” diagonals would clip wall corners.
  function path(c0, r0, c1, r1) {
    if (isSolid(c1, r1) || isSolid(c0, r0)) return null;
    const prev = new Map(); const q = [[c0, r0]]; prev.set(key(c0, r0), null);
    for (let i = 0; i < q.length; i++) {
      const [c, r] = q[i];
      if (c === c1 && r === r1) {
        const out = []; let k = key(c, r), cc = c, rr = r;
        while (prev.get(k) !== null) { out.push({ c: cc, r: rr }); const p = prev.get(k); cc = p[0]; rr = p[1]; k = key(cc, rr); }
        return out.reverse();
      }
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (isSolid(nc, nr) || prev.has(key(nc, nr))) continue;
        prev.set(key(nc, nr), [c, r]); q.push([nc, nr]);
      }
    }
    return null;
  }
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // ---- Rendering --------------------------------------------------------
  // bleed = the world-space rect that exactly covers the full visible canvas
  // at the current fit (game.js render()); falls back to the arena's own
  // WÃ—H bounds for callers that don't pass one (e.g. any older/direct call).
  function draw(ctx, t, bleed) {
    drawGround(ctx, bleed || { x0: 0, y0: 0, x1: W, y1: H });
    if (window.Assets && Assets.get('world_plate')) return;
    if (truthMode) {
      drawTruthLake(ctx, t);
    } else {
      drawWater(ctx, t);
      drawDecals(ctx);
    }
    // NOTE: the fence, bush and stump/barrel props are NOT drawn here â€” they
    // all join the Y-sorted interleave in game.js render() alongside
    // entities (wallDrawables/bushCanopyDrawables/propDrawables), so a tall
    // structure correctly occludes what's behind it and characters can sink
    // into foliage. The floor + pools + flat bone decals stay here: no
    // height, so no occlusion story to get right.
  }

  /* Full-bleed ground (Concept Brief rule 3l, 20-07-2026 â€” "kill the
   * letterbox completely"). The floor texture now covers the ENTIRE visible
   * world rect, not just the playable Arena.WÃ—H footprint, so there is no
   * rectangle edge or dimmed void anywhere on screen â€” the SAME ground just
   * keeps going. The two true map edges (top+left) already carry a wall
   * cluster as their natural boundary feature; the two crop edges (right+
   * bottom) now read as "the map keeps going" simply because the ground
   * genuinely does, at full brightness, with nothing marking a stop. This
   * supersedes the old per-arena floor fill AND the old drawCutEdgeFade
   * gradient (both retired â€” a fade that stops at W/H is itself a visible
   * rectangle edge once the ground bleeds past it). */
  function drawGround(ctx, bleed) {
    const plate = window.Assets && Assets.get('world_plate');
    if (plate) { ctx.drawImage(plate, 0, 0, W, H); return; }
    const floorImg = window.Assets && Assets.get('floor');
    const bw = bleed.x1 - bleed.x0, bh = bleed.y1 - bleed.y0;
    if (floorImg) {
      const s = Math.max(bw / floorImg.naturalWidth, bh / floorImg.naturalHeight);
      const fw = floorImg.naturalWidth * s, fh = floorImg.naturalHeight * s;
      const cx = bleed.x0 + bw / 2, cy = bleed.y0 + bh / 2;
      ctx.drawImage(floorImg, cx - fw / 2, cy - fh / 2, fw, fh);
    } else {
      // Procedural fallback: the checker only inside the actual grid (it has
      // no meaning beyond it), on a flat fill matching floorA everywhere else
      // in the bleed rect so there's still no visible seam.
      ctx.fillStyle = S.floorA; ctx.fillRect(bleed.x0, bleed.y0, bw, bh);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] === '#') continue;
        ctx.fillStyle = ((c + r) & 1) ? S.floorB : S.floorA;
        ctx.fillRect(c * T, r * T, T, T);
      }
    }
  }

  function plateForegroundDrawables() {
    const plate=window.Assets&&Assets.get('world_plate'), wall=window.Assets&&Assets.get('world_mask_wall'), bush=window.Assets&&Assets.get('world_mask_bush'); if(!plate||!wall||!bush)return [];
    const layers=(plateLayerCache&&plateLayerCache[0]===plate&&plateLayerCache[1]===wall&&plateLayerCache[2]===bush)?plateLayerCache[3]:(plateLayerCache=[plate,wall,bush,[makePlateLayer(plate,wall),makePlateLayer(plate,bush)]])[3];
    const out=[];
    for(let r=0;r<rows;r++){let c=0;while(c<cols){if(!isWall(c,r)){c++;continue;}let c1=c;while(c1+1<cols&&isWall(c1+1,r))c1++;out.push({y:(r+1)*T,draw:(ctx)=>drawMaskedPlate(ctx,layers[0],c,r,c1+1,r+1)});c=c1+1;}}
    // Directive 003B: presentation-only local foliage response.  Keep the
    // last occupied bush cell while the offset decays, so exit is a short
    // settled sway rather than an abrupt global reset.  Only the occupied
    // cell and its four direct bush neighbours can ever move; every other
    // plate pixel stays byte-stable.
    const pc=Math.floor(Player.x/T), pr=Math.floor(Player.y/T);
    if(Player.lastMoving&&isBush(pc,pr)){
      bushRuffle.c=pc; bushRuffle.r=pr;
      // At the audited 43px source scale this resolves to a visible but still
      // leaf-local 1–1.5 screen-pixel sway, not a whole-cluster wobble.
      bushRuffle.x=Math.max(-3.0,Math.min(3.0,(Player.vx||0)*.024));
      bushRuffle.y=Math.max(-2.2,Math.min(2.2,(Player.vy||0)*.017));
    } else {
      bushRuffle.x *= .72; bushRuffle.y *= .72;
      if(Math.abs(bushRuffle.x)+Math.abs(bushRuffle.y)<.03){bushRuffle.x=0;bushRuffle.y=0;}
    }
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(isBush(c,r)) out.push({y:(r+1)*T,draw:(ctx)=>{const near=Math.abs(bushRuffle.c-c)+Math.abs(bushRuffle.r-r)<=1;ctx.save();if(near&&(bushRuffle.x||bushRuffle.y))ctx.translate(bushRuffle.x,bushRuffle.y);drawMaskedPlate(ctx,layers[1],c,r+.58,c+1,r+1);ctx.restore();}});
    return out;
  }
  function makePlateLayer(plate,mask){const c=document.createElement('canvas');c.width=plate.naturalWidth;c.height=plate.naturalHeight;const x=c.getContext('2d');x.drawImage(mask,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const a=Math.max(d.data[i],d.data[i+1],d.data[i+2]);d.data[i+3]=a;}x.putImageData(d,0,0);x.globalCompositeOperation='source-in';x.drawImage(plate,0,0,c.width,c.height);return c;}
  function drawMaskedPlate(ctx,layer,c0,r0,c1,r1){const x=c0*T,y=r0*T,w=(c1-c0)*T,h=(r1-r0)*T;ctx.drawImage(layer,c0*43,r0*43,(c1-c0)*43,(r1-r0)*43,x,y,w,h);}

  // Bounding boxes of contiguous same-type tile regions, 4-way flood fill.
  // Used to trace a ROUNDED outer silhouette around a pool/cluster instead of
  // raw per-tile rects (real Brawl water is never a hard square â€” Art
  // Inventory.md law 3; our reference pool is itself a clean rounded square,
  // so one rounded-rect over each region's bounding box matches it exactly).
  function tileRegions(match) {
    const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (seen[r][c] || !match(c, r)) continue;
      let c0 = c, c1 = c, r0 = r, r1 = r;
      const stack = [[c, r]]; seen[r][c] = true;
      while (stack.length) {
        const [cc, rr] = stack.pop();
        c0 = Math.min(c0, cc); c1 = Math.max(c1, cc); r0 = Math.min(r0, rr); r1 = Math.max(r1, rr);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = cc + dc, nr = rr + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || seen[nr][nc] || !match(nc, nr)) continue;
          seen[nr][nc] = true; stack.push([nc, nr]);
        }
      }
      out.push({ c0, c1, r0, r1 });
    }
    return out;
  }

  /* TRUE organic pool silhouette (PM directive, 18-07-2026): Acid Lakes'
   * pool is a genuine diagonal chain of tiles, unlike Spots of Yore's clean
   * rounded-square (measured precisely last pass â€” that pool really was a
   * square, this one really isn't). A per-REGION bounding box would round
   * the diagonal off into a rectangle; instead each water TILE gets its own
   * rounded-rect (same technique drawBush already uses), so the union
   * traces the actual stair-step diagonal from the real map, not a guess. */
  // Deterministic per-tile pseudo-random, 0..1 â€” stable across frames (no
  // flicker) without a stored seed table. Used by the water bubbles and the
  // bush-tuft jitter below.
  function hashTile(a, b) {
    let h = (a | 0) * 374761393 + (b | 0) * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  /* Layer 1 â€” pools: pure code-drawn, ZERO generation (Concept Brief rule 3l,
   * Tessa's layered-build spec, 21-07-2026 â€” "the real acid is that calm;
   * code guarantees the shape"). Flat bright fill + the same per-tile-union
   * rim-shadow technique as before (still the right call â€” organic
   * silhouette, no seam where tiles touch) + a couple of soft darker
   * patches and sparse bubble accents, deliberately calm, not a busy
   * animated blob pattern. No water.png asset any more. */
  function drawWater(ctx, t) {
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === '~') cells.push([c, r]);
    if (!cells.length) return;

    ctx.save();
    // Primary-frame lake study (30/45/60s, Directive 002): the live Acid
    // rim is a subdued dark green shadow, not the inherited warm-brown rim.
    ctx.shadowColor = '#235234'; ctx.shadowBlur = 3;
    ctx.fillStyle = '#235234';
    ctx.beginPath();
    for (const [c, r] of cells) roundRectPath(ctx, c * T, r * T, T, T, T * 0.12);
    ctx.fill(); ctx.fill();   // twice: shadowBlur only casts from an actual fill, and one pass reads faint on some canvases
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    for (const [c, r] of cells) roundRectPath(ctx, c * T, r * T, T, T, T * 0.12);
    ctx.clip();
    ctx.fillStyle = S.water; ctx.fillRect(0, 0, W, H);
    // one or two soft darker patches per pool, calm not busy
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#1E9A3E';
    for (const [c, r] of cells) {
      if (hashTile(c, r) < 0.3) {
        const cx = c * T + T * (0.3 + hashTile(c + 50, r) * 0.4);
        const cy = r * T + T * (0.3 + hashTile(c, r + 50) * 0.4);
        ctx.beginPath(); ctx.arc(cx, cy, T * 0.34, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // sparse bubble accents, a gentle pulse so the pool still reads as liquid
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (const [c, r] of cells) {
      if (hashTile(c + 200, r) >= 0.35) continue;
      const bx = c * T + T * (0.2 + hashTile(c, r) * 0.6);
      const by = r * T + T * (0.2 + hashTile(c + 300, r) * 0.6);
      const pulse = 0.4 + 0.3 * Math.sin(t * 1.1 + c * 3 + r * 5);
      ctx.globalAlpha = pulse;
      ctx.beginPath(); ctx.arc(bx, by, T * (0.03 + hashTile(c, r + 300) * 0.03), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Independently traced from the 30/45/60-second footage frames: a calm
  // acid surface, subdued dark-green rim, and no warm/brown outline. Its
  // exact six-cell union is the audit mask, not a rounded bounding box.
  function drawTruthLake(ctx, t) {
    const cells = TRUTH.lake;
    ctx.save(); ctx.shadowColor = '#235234'; ctx.shadowBlur = 4; ctx.fillStyle = '#235234';
    ctx.beginPath(); for (const [c, r] of cells) roundRectPath(ctx, c * T, r * T, T, T, T * .13); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.beginPath(); for (const [c, r] of cells) roundRectPath(ctx, c * T, r * T, T, T, T * .13); ctx.clip();
    ctx.fillStyle = '#36D65B'; ctx.fillRect(10 * T, 13 * T, 5 * T, 3 * T);
    ctx.globalAlpha = .13; ctx.fillStyle = '#1E9A3E';
    ctx.beginPath(); ctx.arc(12.2 * T, 14.2 * T, .52 * T, 0, 7); ctx.fill();
    ctx.globalAlpha = .55; ctx.fillStyle = '#D2FFD7';
    ctx.beginPath(); ctx.arc(12.45 * T, 13.65 * T, T * .045, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* Layer 2 ground decals â€” bone/fossil fragments (Concept Brief rule 3l,
   * Tessa's layered-build spec, 21-07-2026): flat, no height, drawn on the
   * floor layer before the Y-sorted interleave (never consulted by
   * collide()/isSolid()/hideTiles â€” purely visual). Stumps/barrels DO have
   * height and join the Y-sort instead â€” see propDrawables() below.
   * Power-Cube crates are REMOVED outright (Tessa's design ruling: Solo
   * Showdown power-up furniture, not map furniture â€” they'd falsely
   * promise power cubes in our camo mode); their old traced tile positions
   * are simply open floor now, not backfilled with anything. */
  const PROPS = (ARENA.props || []);
  const DECAL_KEYS = { bones_skull: 1, bones_pair: 1, bones_ribs: 1 };

  function drawDecals(ctx) {
    for (const p of PROPS) if (DECAL_KEYS[p.key]) drawOneProp(ctx, p);
  }

  function propDrawables() {
    const out = [];
    for (const p of PROPS) if (!DECAL_KEYS[p.key]) out.push({ y: (p.r + 1) * T, draw: (ctx) => drawOneProp(ctx, p) });
    return out;
  }

  function truthPatchDrawables() {
    if (!truthMode) return [];
    const out = [
      { y: 12 * T, draw: (ctx) => drawTruthFence(ctx, TRUTH.horizontal.cells) },
      { y: 12 * T, draw: (ctx) => drawTruthFence(ctx, TRUTH.vertical.cells) },
      { y: 16 * T, draw: (ctx) => drawTruthBush(ctx, TRUTH.bush) },
    ];
    for (const p of TRUTH.props) out.push({ y: (p.r + 1) * T, draw: (ctx) => drawOneProp(ctx, p) });
    return out;
  }

  function drawTruthFence(ctx, cells) {
    const horizontal = cells[0][1] === cells[1][1];
    const [c0,r0] = cells[0], [cN,rN] = cells[cells.length-1];
    const x=Math.min(c0,cN)*T, y=Math.min(r0,rN)*T, w=(Math.abs(cN-c0)+1)*T, h=(Math.abs(rN-r0)+1)*T;
    ctx.save(); ctx.fillStyle='#403b70'; ctx.fillRect(x,y+T*.28,w,h*.72); ctx.fillStyle='#7476b8'; ctx.fillRect(x,y,w,h*.5);
    ctx.strokeStyle='rgba(20,16,42,.72)'; ctx.lineWidth=2; ctx.strokeRect(x,y,w,h);
    for(let i=0;i<=cells.length;i++){ const px=horizontal?x+i*T:x+T*.5, py=horizontal?y+T*.18:y+i*T; ctx.fillStyle='#201b3c'; ctx.fillRect(px-2,py-7,4,14); }
    ctx.restore();
  }
  function drawTruthBush(ctx,cells) {
    const img=window.Assets&&Assets.get('bush_tuft'); if(!img)return;
    let c0=Infinity,c1=-Infinity,r0=Infinity,r1=-Infinity; for(const [c,r] of cells){c0=Math.min(c0,c);c1=Math.max(c1,c);r0=Math.min(r0,r);r1=Math.max(r1,r);}
    ctx.save();ctx.beginPath();for(const [c,r] of cells)ctx.rect(c*T,r*T,T,T);ctx.clip();ctx.drawImage(img,c0*T,r0*T,(c1-c0+1)*T,(r1-r0+1)*T);ctx.restore();
  }

  // Exact programmatic mask: the source-selected whole unit is painted once,
  // clipped to its audited occupied-cell union. No per-cell stamp, jitter,
  // rotation, scaling variance or overlap can introduce a false footprint.
  function drawTruthPiece(ctx, key, cells) {
    const img = window.Assets && Assets.get(key);
    if (!img) return;
    let c0 = Infinity, c1 = -Infinity, r0 = Infinity, r1 = -Infinity;
    for (const [c, r] of cells) { c0 = Math.min(c0,c); c1 = Math.max(c1,c); r0 = Math.min(r0,r); r1 = Math.max(r1,r); }
    ctx.save(); ctx.beginPath();
    for (const [c, r] of cells) ctx.rect(c * T, r * T, T, T);
    ctx.clip();
    ctx.drawImage(img, c0 * T, r0 * T, (c1 - c0 + 1) * T, (r1 - r0 + 1) * T);
    ctx.restore();
  }

  function drawOneProp(ctx, p) {
    const img = window.Assets && Assets.get(p.key);
    const x = p.c * T + T / 2, y = p.r * T + T / 2;
    const decal = !!DECAL_KEYS[p.key];
    if (!img) {
      ctx.save();
      ctx.fillStyle = 'rgba(200,200,210,.6)'; ctx.strokeStyle = CFG.palette.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, T * 0.14, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }
    const sizeFrac = decal ? 0.4 : 0.62;
    const s = T * sizeFrac / Math.max(img.naturalWidth, img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.save();
    if (!decal) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(x, y + h * 0.34, w * 0.34, h * 0.14, 0, 0, 7); ctx.fill();
    }
    ctx.translate(x, y);
    if (p.rot) ctx.rotate(p.rot * Math.PI / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /* Layer 2 â€” bush: ONE small tuft sprite duplicated with jitter/overlap
   * into an organic mass (Concept Brief rule 3l, Tessa's layered-build
   * spec, 21-07-2026 â€” "actual bushes not 2D flat objects", supersedes the
   * earlier single-stretched-texture version). A darker base layer draws
   * first (her "darker bases"), then several jittered tuft copies on top â€”
   * two per bush tile (one centred, one offset toward a neighbour) so the
   * outer edge overlaps raggedly instead of reading as a tile grid. Joins
   * the Y-sorted wall+entity interleave (game.js), so characters standing
   * at or behind a clump's near edge get genuine partial foliage occlusion. */
  function bushCanopyDrawables() {
    const regions = tileRegions((c, r) => grid[r][c] === 'b');
    const out = [];
    for (const reg of regions) out.push({ y: (reg.r1 + 1) * T, draw: (ctx) => drawBushCluster(ctx, reg) });
    return out;
  }

  function drawBushCluster(ctx, reg) {
    const x0 = reg.c0 * T, y0 = reg.r0 * T, x1 = (reg.c1 + 1) * T, y1 = (reg.r1 + 1) * T;
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const tuftImg = window.Assets && Assets.get('bush_tuft');

    // Directive 002 replacement: one grid-anchored texture is clipped to the
    // exact rectilinear union of occupied cells. It removes alpha seams at
    // interior boundaries without adding jitter, rotation, overlap or any
    // footprint outside the data-grid polyomino.
    if (tuftImg) {
      ctx.save(); ctx.beginPath();
      for (let r = reg.r0; r <= reg.r1; r++) for (let c = reg.c0; c <= reg.c1; c++)
        if (grid[r][c] === 'b') ctx.rect(c * T, r * T, T, T);
      ctx.clip();
      ctx.drawImage(tuftImg, x0, y0, w, h);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(cx, y1 - 2, w * 0.44, h * 0.18, 0, 0, 7); ctx.fill();

    // darker base mass -- a SMALL plain-filled blob per tile, just enough
    // to back-fill any sliver a tuft stamp doesn't cover; kept subordinate
    // (small radius) so it reads as shadow between leaves, never competes
    // with the tuft texture for visual weight (first pass had this too
    // large â€” it was reading as flat green circles, not foliage).
    ctx.fillStyle = S.bush;
    ctx.beginPath();
    for (let r = reg.r0; r <= reg.r1; r++) for (let c = reg.c0; c <= reg.c1; c++) {
      if (grid[r][c] !== 'b') continue;
      const bx = c * T + T / 2, by = r * T + T / 2;
      ctx.moveTo(bx + T * 0.3, by);
      ctx.arc(bx, by, T * 0.3, 0, Math.PI * 2);
    }
    ctx.fill();

    // Dense jittered tuft stamps: FOUR per bush tile, spread and overlapping
    // across the tile and into its neighbours, so adjacent tiles' foliage
    // physically overlaps and the cluster reads as one continuous ragged
    // mass rather than one distinguishable blob per tile (first pass used
    // 2 sparse stamps at near-tile-size â€” gaps of bare base colour showed
    // between tiles; this quadruples coverage and enlarges the stamp).
    const stamps = [];
    for (let r = reg.r0; r <= reg.r1; r++) for (let c = reg.c0; c <= reg.c1; c++) {
      if (grid[r][c] !== 'b') continue;
      for (let i = 0; i < 1; i++) {
        const a = hashTile(c * 4 + i, r * 4 + i) * Math.PI * 2;
        const d = 0;
        stamps.push({
          tx: c * T + T / 2 + Math.cos(a) * d,
          ty: r * T + T / 2 + Math.sin(a) * d,
          seed: c * 97 + r * 53 + i * 13,
        });
      }
    }
    for (const s of stamps) {
      const jx = 0;
      const jy = 0;
      const scale = 1;
      const rot = 0;
      const px = s.tx + jx, py = s.ty + jy;
      if (tuftImg) {
        const size = T;
        const iw = size, ih = size * (tuftImg.naturalHeight / tuftImg.naturalWidth);
        ctx.save();
        ctx.translate(px, py); ctx.rotate(rot);
        ctx.drawImage(tuftImg, -iw / 2, -ih / 2, iw, ih);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = 0.55; ctx.fillStyle = S.bushHi;
        ctx.beginPath(); ctx.arc(px, py, T * 0.22 * scale, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---- Camera-tilt draw order (engineering pass, 18-07-2026) -------------
  // Real Brawl renders on a tilted camera, not flat top-down: chunky blocks
  // show both a top face and a front face, and whether a block sits "in
  // front of" or "behind" a character depends on ROW position, not a fixed
  // layer. Art + draw order ONLY (PM-scoped, Concept Brief rule 3d) â€” the
  // collision grid, all mechanics and the fit geometry are untouched; this
  // changes what gets painted where, never what collides or scores.
  //
  // wallDrawables() returns one entry per wall tile: {y, draw(ctx)}, where y
  // is the tile's ground-contact edge (its south side, y=(r+1)*T) â€” the same
  // "how close to the camera is this thing's base" measure game.js uses for
  // entities (feet â‰ˆ e.y + e.r). game.js merges walls + entities into ONE
  // array and sorts it ascending by y before drawing, so a wall correctly
  // occludes an entity further away (smaller y, drawn first, wall paints
  // over it) while an entity nearer the camera (larger y, drawn after) paints
  // over the wall's own base â€” real occlusion, not a fixed z-order guess.
  /* Layer 2 â€” the fence: a COMPOUND object, not two separate structures
   * (Concept Brief rule 3l, Tessa's layered-build spec, 21-07-2026, with
   * her own reference crop): "low purple wall-slab run as the base, with
   * dark iron pointy posts/spikes layered on top at intervals." Built
   * exactly as she specified: a flush, gapless SLAB-MATERIAL base (the
   * same merge technique the v29 wall pass used, now painting a real
   * stone-slab texture instead of a discrete pillar icon, so there's no
   * per-tile object silhouette left to leave gaps) + spike POSTS
   * composited on top only at INTERVALS along the structure's true
   * boundary edges â€” never per-tile, which would just be the old
   * stamped-icon defect wearing a different asset. */
  function wallDrawables() {
    const slab = window.Assets && Assets.get('fence_slab');
    const spike = window.Assets && Assets.get('fence_spike');
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '#') continue;
      out.push({ y: (r + 1) * T, draw: (ctx) => drawOneFence(ctx, c, r, slab, spike) });
    }
    return out;
  }

  // Any tile bordering a non-fence tile â€” the structure's true outer
  // boundary, used both for the outline and for spike-post placement.
  function isFenceEdge(c, r) {
    return !isWall(c - 1, r) || !isWall(c + 1, r) || !isWall(c, r - 1) || !isWall(c, r + 1);
  }

  function drawOneFence(ctx, c, r, slab, spike) {
    const x = c * T, y = r * T;
    const edgeS = !isWall(c, r + 1);   // true south-facing edge of this structure
    ctx.save();
    // Shared drop shadow â€” only at the structure's true base, once per span.
    if (edgeS) {
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(x + T / 2, y + T * 0.96, T * 0.48, T * 0.12, 0, 0, 7); ctx.fill();
    }
    // Gapless slab base: flush per-tile fill of the MATERIAL texture, not a
    // discrete object, so touching tiles form one continuous low rail with
    // zero gap regardless of the texture's own pattern.
    if (slab) {
      const s = Math.max(T / slab.naturalWidth, T / slab.naturalHeight) * 1.4;
      const sw = slab.naturalWidth * s, sh = slab.naturalHeight * s;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, T, T + (edgeS ? T * 0.14 : 0)); ctx.clip();
      ctx.drawImage(slab, x + T / 2 - sw / 2, y + T / 2 - sh / 2, sw, sh);
      ctx.restore();
    } else {
      ctx.fillStyle = S.wallSide;
      ctx.fillRect(x, y, T, T + (edgeS ? T * 0.14 : 0));
      ctx.fillStyle = S.wallTop;
      ctx.fillRect(x, y, T, T);
    }
    // Spike posts: discrete props, only at intervals along a true boundary
    // edge. Even (c+r) parity spaces a post every second tile along a
    // straight run â€” the post-rail-post-rail rhythm her reference shows â€”
    // rather than one per tile.
    if (spike && isFenceEdge(c, r) && ((c + r) & 1) === 0) {
      const ps = T * 0.62 / Math.max(spike.naturalWidth, spike.naturalHeight);
      const pw = spike.naturalWidth * ps, ph = spike.naturalHeight * ps;
      ctx.drawImage(spike, x + T / 2 - pw / 2, y + T * 0.45 - ph, pw, ph);
    } else if (!spike && isFenceEdge(c, r) && ((c + r) & 1) === 0) {
      ctx.fillStyle = 'rgba(20,16,42,.7)';
      ctx.beginPath();
      ctx.moveTo(x + T / 2, y + T * 0.06); ctx.lineTo(x + T * 0.68, y + T * 0.32); ctx.lineTo(x + T * 0.32, y + T * 0.32);
      ctx.closePath(); ctx.fill();
    }
    // Single-pass outline: stroke ONLY the edges that border a non-fence
    // tile â€” the marching-squares step that keeps internal seams between
    // same-cluster tiles from showing at all. Softened (v29 full-frame
    // gate): a full-strength ink stroke read as a hard cartoon-sticker edge
    // next to her footage's soft painted shading â€” thin, semi-transparent
    // dark-purple instead.
    ctx.strokeStyle = 'rgba(20,16,42,.5)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    if (!isWall(c, r - 1)) line(ctx, x, y, x + T, y);
    if (edgeS) line(ctx, x, y + T, x + T, y + T);
    if (!isWall(c - 1, r)) line(ctx, x, y, x, y + T);
    if (!isWall(c + 1, r)) line(ctx, x + T, y, x + T, y + T);
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  // roundRectPath adds ONE rounded-rect subpath to whatever path is already
  // open â€” safe to call repeatedly inside a loop to accumulate several shapes
  // into one clip/fill/stroke (a single ctx.beginPath() before the loop, this
  // per shape, then .clip()/.fill()/.stroke() once after).
  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // roundRect is the standalone convenience form: resets the path, so only use
  // it for a single shape you immediately .fill()/.stroke() â€” NOT inside a loop
  // building a combined path (that silently keeps only the last iteration).
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); roundRectPath(ctx, x, y, w, h, r); }

  window.Arena = {
    T, cols, rows, W, H, grid, isSolid, isWall, isWater, isBush, spawn, collide, camoSurface, draw, roundRect, roundRectPath,
    freeTiles, hideTiles, centre, tileOf, path, pick, drawCamoOverlay, typeAt, wallDrawables, bushCanopyDrawables, propDrawables, truthPatchDrawables,
    isTruthPatch: truthMode, plateForegroundDrawables,
  };
})();
