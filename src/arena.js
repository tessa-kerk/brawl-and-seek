/* Brawl & Seek — the arena: grid parsing, collision, camo-surface lookup, and
 * the top-down tile rendering (chunky beveled walls, checkered floor, an aqua
 * pool) that has to read as "a Brawl-like arena" at a glance. */
(function () {
  const T = CFG.tile;
  const S = ARENA.surfaces;
  const grid = ARENA.grid.map((row) => row.split(''));
  const rows = grid.length, cols = grid[0].length;
  const W = cols * T, H = rows * T;

  const isWall  = (c, r) => inBounds(c, r) && grid[r][c] === '#';
  const isWater = (c, r) => inBounds(c, r) && grid[r][c] === '~';
  // Bush (art pass, 18-07-2026): walkable, unlike walls — Tessa's ruling, a real
  // camo surface, not a collider. The map's true edge is now open floor/bush
  // (no border wall ring — see data/arena.js), so isSolid(out-of-bounds)=true
  // IS the arena's boundary; nothing else marks it.
  const isBush  = (c, r) => inBounds(c, r) && grid[r][c] === 'b';
  const isSolid = (c, r) => !inBounds(c, r) || grid[r][c] === '#' || grid[r][c] === '~';
  function inBounds(c, r) { return c >= 0 && r >= 0 && c < cols && r < rows; }

  // Spawn (the 'S' cell), centre of its tile.
  function spawn() {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      if (grid[r][c] === 'S') return { x: c * T + T / 2, y: r * T + T / 2 };
    return { x: W / 2, y: H / 2 };
  }

  /* Move-and-slide tile collision. Two fully DECOUPLED axis passes so a wall on
   * one axis can never eat movement on the free axis (the bug that pinned a
   * hider in a 1-wide corridor and reported "blocked X:YES Y:YES" while pushing
   * into open space):
   *   1. Move X, resolve against tiles overlapping the ORIGINAL y-band [py±h].
   *   2. Move Y, resolve against tiles overlapping the RESOLVED x-band [x±h].
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
   * nothing here qualifies — stand there all day and you'll never vanish. */
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
    // water tile adjacent, OR a bush tile itself/adjacent (bush is walkable —
    // you stand IN it, not beside it, art pass 18-07-2026 — dummies must be
    // able to pick bush tiles directly, not just their neighbours).
    if (isSolid(c - 1, r) || isSolid(c + 1, r) || isSolid(c, r - 1) || isSolid(c, r + 1)
      || isBush(c, r) || isBush(c - 1, r) || isBush(c + 1, r) || isBush(c, r - 1) || isBush(c, r + 1))
      hideTiles.push({ c, r });
  }
  const centre = (c, r) => ({ x: c * T + T / 2, y: r * T + T / 2 });
  const tileOf = (x, y) => ({ c: Math.floor(x / T), r: Math.floor(y / T) });
  const key = (c, r) => r * cols + c;

  // Shortest tile path from (c0,r0) to (c1,r1). Returns [{c,r}…] excluding the
  // start, or null if unreachable. 4-way — diagonals would clip wall corners.
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
  function draw(ctx, t) {
    // Floor (drawn under everything). Art pass: a textured painted-ground image,
    // cover-fit across the arena; falls back to the signed-off 2-shade checker.
    const floorImg = window.Assets && Assets.get('floor');
    if (floorImg) {
      const s = Math.max(W / floorImg.naturalWidth, H / floorImg.naturalHeight);
      const fw = floorImg.naturalWidth * s, fh = floorImg.naturalHeight * s;
      ctx.drawImage(floorImg, (W - fw) / 2, (H - fh) / 2, fw, fh);
    } else {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell === '#') continue;            // walls painted later, on top
        ctx.fillStyle = ((c + r) & 1) ? S.floorB : S.floorA;
        ctx.fillRect(c * T, r * T, T, T);
      }
    }
    drawBush(ctx);
    drawWater(ctx, t);
    // NOTE: walls are NOT drawn here (engineering pass, 18-07-2026) — they now
    // draw as part of the Y-sorted interleave in game.js render(), alongside
    // entities, so a tall block can correctly occlude what's behind it. See
    // wallDrawables() below. Ground layers (floor/bush/water) stay flat and
    // always-first, since they have no height to occlude anything with.
    // subtle vignette to seat the arena on the navy stage
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    drawCutEdgeFade(ctx);
  }

  /* "Never feel cut off" (Concept Brief rule 3g). This recreated section has
   * TWO genuine map edges (top + left — the real spiky wall border, traced
   * from the reference, drawn as-is — never faded) and TWO crop edges (right
   * + bottom — not a real boundary, just where our 10x9 window on the actual
   * 61x61 map stops). Rather than let those two sides read as a hard wall, a
   * soft gradient fades them toward the exact tone the screen-space world-skirt
   * already uses beyond the arena's own bounds (game.js render() — a dimmed
   * continuation of the same floor ground) — "the map keeps going, just past
   * legible focus," not a stop. Only right + bottom get this; top + left, the
   * map's own true edge, stay sharp. */
  function drawCutEdgeFade(ctx) {
    const fadeW = T * 1.3, tone = 'rgba(23,27,51,0.82)', clear = 'rgba(23,27,51,0)';
    let g = ctx.createLinearGradient(W - fadeW, 0, W, 0);
    g.addColorStop(0, clear); g.addColorStop(1, tone);
    ctx.fillStyle = g; ctx.fillRect(W - fadeW, 0, fadeW, H);
    g = ctx.createLinearGradient(0, H - fadeW, 0, H);
    g.addColorStop(0, clear); g.addColorStop(1, tone);
    ctx.fillStyle = g; ctx.fillRect(0, H - fadeW, W, fadeW);
  }

  // Bounding boxes of contiguous same-type tile regions, 4-way flood fill.
  // Used to trace a ROUNDED outer silhouette around a pool/cluster instead of
  // raw per-tile rects (real Brawl water is never a hard square — Art
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

  function drawWater(ctx, t) {
    const pools = tileRegions((c, r) => grid[r][c] === '~');
    if (!pools.length) return;
    // Fill each pool's bounding box as ONE rounded rect (the outer silhouette),
    // then a lighter inner rim + a slow ripple sheen inside it.
    ctx.save();
    ctx.beginPath();
    for (const p of pools) {
      const x = p.c0 * T, y = p.r0 * T, w = (p.c1 - p.c0 + 1) * T, h = (p.r1 - p.r0 + 1) * T;
      roundRectPath(ctx, x, y, w, h, Math.min(T * 0.28, w / 2, h / 2));
    }
    // Art pass: paint a teal-paint texture into the pool(s); the ripple sheen
    // + dark rim below stay procedural (the mechanic's motion). Fallback = flat.
    const waterImg = window.Assets && Assets.get('water');
    ctx.save(); ctx.clip();
    if (waterImg) {
      const s = Math.max(W / waterImg.naturalWidth, H / waterImg.naturalHeight);
      const ww = waterImg.naturalWidth * s, wh = waterImg.naturalHeight * s;
      ctx.drawImage(waterImg, (W - ww) / 2, (H - wh) / 2, ww, wh);
    } else {
      ctx.fillStyle = S.water; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    ctx.clip();
    // moving highlight bands
    ctx.globalAlpha = 0.22; ctx.strokeStyle = S.waterHi; ctx.lineWidth = 3;
    for (let i = -2; i < rows + 2; i++) {
      const yy = i * 26 + (t * 14) % 26;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy - 40); ctx.stroke();
    }
    ctx.restore();
    // A warm terracotta rim around each pool, matching the real map's own pool
    // border — colour SAMPLED directly from genuine in-game reference art
    // (the Fandom wiki's map asset, not the brawlify map-SELECTION THUMBNAIL
    // that misled the first faithful pass; see Art Inventory.md's reference-
    // class correction, 18-07-2026). Pixel-sampled at RGB(130,68,46).
    ctx.strokeStyle = '#82442E'; ctx.lineWidth = 5;
    for (const p of pools) {
      const x = p.c0 * T, y = p.r0 * T, w = (p.c1 - p.c0 + 1) * T, h = (p.r1 - p.r0 + 1) * T;
      roundRect(ctx, x, y, w, h, Math.min(T * 0.28, w / 2, h / 2)); ctx.stroke();
    }
  }

  // Bush (art pass, 18-07-2026): a walkable, textured foliage cluster — flat
  // ground cover, not a raised object like walls. Each cell clipped with a
  // touch of rounding so a cluster's outer edge softens instead of a hard
  // tile grid. Fallback = a flat themed green (never the raw Brawl-IP asset).
  function drawBush(ctx) {
    const clusters = tileRegions((c, r) => grid[r][c] === 'b');
    if (!clusters.length) return;
    const bushImg = window.Assets && Assets.get('bush');
    ctx.save();
    ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      if (grid[r][c] === 'b') roundRectPath(ctx, c * T + 1, r * T + 1, T - 2, T - 2, T * 0.22);
    ctx.clip();
    if (bushImg) {
      const s = Math.max(W / bushImg.naturalWidth, H / bushImg.naturalHeight);
      const bw = bushImg.naturalWidth * s, bh = bushImg.naturalHeight * s;
      ctx.drawImage(bushImg, (W - bw) / 2, (H - bh) / 2, bw, bh);
    } else {
      ctx.fillStyle = S.bush; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.5; ctx.fillStyle = S.bushHi;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== 'b') continue;
        ctx.beginPath(); ctx.arc(c * T + T * 0.3, r * T + T * 0.35, T * 0.16, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(c * T + T * 0.68, r * T + T * 0.62, T * 0.14, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ---- Camera-tilt draw order (engineering pass, 18-07-2026) -------------
  // Real Brawl renders on a tilted camera, not flat top-down: chunky blocks
  // show both a top face and a front face, and whether a block sits "in
  // front of" or "behind" a character depends on ROW position, not a fixed
  // layer. Art + draw order ONLY (PM-scoped, Concept Brief rule 3d) — the
  // collision grid, all mechanics and the fit geometry are untouched; this
  // changes what gets painted where, never what collides or scores.
  //
  // wallDrawables() returns one entry per wall tile: {y, draw(ctx)}, where y
  // is the tile's ground-contact edge (its south side, y=(r+1)*T) — the same
  // "how close to the camera is this thing's base" measure game.js uses for
  // entities (feet ≈ e.y + e.r). game.js merges walls + entities into ONE
  // array and sorts it ascending by y before drawing, so a wall correctly
  // occludes an entity further away (smaller y, drawn first, wall paints
  // over it) while an entity nearer the camera (larger y, drawn after) paints
  // over the wall's own base — real occlusion, not a fixed z-order guess.
  const FRONT_FACE_H = 0.24;   // fraction of T the front face extends below the tile

  function wallDrawables() {
    const block = window.Assets && Assets.get('wall_block');
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '#') continue;
      out.push({ y: (r + 1) * T, draw: (ctx) => drawOneWall(ctx, c, r, block) });
    }
    return out;
  }

  function drawOneWall(ctx, c, r, block) {
    const x = c * T, y = r * T, lift = T * 0.10;
    ctx.save();
    // contact shadow
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(x + T / 2, y + T * 0.9, T * 0.42, T * 0.15, 0, 0, 7); ctx.fill();
    if (block) {
      // Front face: a flat dark strip extending below the block's own top-
      // down art, so the block reads as a 3D object (top face + front face)
      // without needing separate front-face art. Drawn first so the block's
      // sprite visually sits above/behind it, like a lip under the block.
      ctx.fillStyle = 'rgba(8,6,18,.46)';
      roundRect(ctx, x + T * 0.06, y + T - T * 0.04, T * 0.88, T * FRONT_FACE_H, T * 0.08); ctx.fill();
      // flip alternate blocks so a wall of them doesn't read as one stamped image
      const flip = ((c * 5 + r * 3) & 1) === 1;
      if (flip) { ctx.translate(x + T / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + T / 2), 0); }
      ctx.drawImage(block, x, y - lift, T, T);
    } else {
      // ---- procedural fallback (the signed-off block look; already has a
      // top-face/side-face split, so it needs no separate front-face strip) ----
      const inset = 3, rad = 12, plift = 7;
      const wx = x + inset, wy = y + inset, w = T - inset * 2, hh = T - inset * 2;
      ctx.fillStyle = 'rgba(0,0,0,.30)';
      roundRect(ctx, wx + 2, wy + plift, w, hh, rad); ctx.fill();
      ctx.fillStyle = S.wallSide;
      roundRect(ctx, wx, wy + plift * 0.5, w, hh, rad); ctx.fill();
      ctx.fillStyle = S.wallTop;
      roundRect(ctx, wx, wy, w, hh - 2, rad); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
      roundRect(ctx, wx + 2, wy + 2, w - 4, hh - 8, rad - 2); ctx.stroke();
      ctx.strokeStyle = CFG.palette.ink; ctx.lineWidth = 2.5;
      roundRect(ctx, wx, wy, w, hh - 2, rad); ctx.stroke();
    }
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  // roundRectPath adds ONE rounded-rect subpath to whatever path is already
  // open — safe to call repeatedly inside a loop to accumulate several shapes
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
  // it for a single shape you immediately .fill()/.stroke() — NOT inside a loop
  // building a combined path (that silently keeps only the last iteration).
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); roundRectPath(ctx, x, y, w, h, r); }

  window.Arena = {
    T, cols, rows, W, H, grid, isSolid, isWall, isWater, isBush, spawn, collide, camoSurface, draw, roundRect, roundRectPath,
    freeTiles, hideTiles, centre, tileOf, path, pick, drawCamoOverlay, typeAt, wallDrawables,
  };
})();
