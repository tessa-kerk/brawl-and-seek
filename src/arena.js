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
  const isSolid = (c, r) => !inBounds(c, r) || grid[r][c] === '#' || grid[r][c] === '~';
  function inBounds(c, r) { return c >= 0 && r >= 0 && c < cols && r < rows; }

  // Spawn (the 'S' cell), centre of its tile.
  function spawn() {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      if (grid[r][c] === 'S') return { x: c * T + T / 2, y: r * T + T / 2 };
    return { x: W / 2, y: H / 2 };
  }

  // Per-axis AABB tile collision. Player is a square of half-extent h.
  function collide(px, py, dx, dy, h) {
    let x = px + dx, y = py + dy;
    if (dx > 0) { const c = Math.floor((x + h) / T); for (const r of span(y, h)) if (isSolid(c, r)) { x = c * T - h - 0.001; break; } }
    else if (dx < 0) { const c = Math.floor((x - h) / T); for (const r of span(y, h)) if (isSolid(c, r)) { x = (c + 1) * T + h + 0.001; break; } }
    if (dy > 0) { const r = Math.floor((y + h) / T); for (const c of span(x, h)) if (isSolid(c, r)) { y = r * T - h - 0.001; break; } }
    else if (dy < 0) { const r = Math.floor((y - h) / T); for (const c of span(x, h)) if (isSolid(c, r)) { y = (r + 1) * T + h + 0.001; break; } }
    return { x, y };
  }
  function span(centre, h) {
    const a = Math.floor((centre - h) / T), b = Math.floor((centre + h) / T);
    const out = []; for (let i = a; i <= b; i++) out.push(i); return out;
  }

  /* Which surface does a hider at (px,py) paint into? Priority wall > water >
   * floor, matching the mechanic's intent (hug a wall and become the wall; sit
   * by the pond and become water; otherwise blend into the floor you stand on).
   * Returns {type, color}. Floor returns the exact checker shade underfoot so
   * the blend is pixel-honest. */
  function camoSurface(px, py, h) {
    const pad = T * 0.42;             // reach a touch beyond the body to "hug"
    const c0 = Math.floor((px - h - pad) / T), c1 = Math.floor((px + h + pad) / T);
    const r0 = Math.floor((py - h - pad) / T), r1 = Math.floor((py + h + pad) / T);
    let water = null;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (isWall(c, r)) return { type: 'wall', color: S.wallTop };
      if (isWater(c, r)) water = { type: 'water', color: S.water };
    }
    if (water) return water;
    const cc = Math.floor(px / T), cr = Math.floor(py / T);
    return { type: 'floor', color: ((cc + cr) & 1) ? S.floorB : S.floorA };
  }

  // ---- Rendering --------------------------------------------------------
  function draw(ctx, t) {
    // Floor checker (drawn under everything).
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell === '#') continue;              // walls painted later, on top
      ctx.fillStyle = ((c + r) & 1) ? S.floorB : S.floorA;
      ctx.fillRect(c * T, r * T, T, T);
    }
    drawWater(ctx, t);
    drawWalls(ctx);
    // subtle vignette to seat the arena on the navy stage
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function drawWater(ctx, t) {
    // Fill water cells, then a lighter inner rim + a slow ripple sheen.
    ctx.save();
    ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      if (grid[r][c] === '~') ctx.rect(c * T + 1, r * T + 1, T - 2, T - 2);
    ctx.fillStyle = S.water; ctx.fill();
    ctx.clip();
    // moving highlight bands
    ctx.globalAlpha = 0.22; ctx.strokeStyle = S.waterHi; ctx.lineWidth = 3;
    for (let i = -2; i < rows + 2; i++) {
      const yy = i * 26 + (t * 14) % 26;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy - 40); ctx.stroke();
    }
    ctx.restore();
    // dark contour around the pool so it reads as depth
    ctx.strokeStyle = 'rgba(9,20,40,.55)'; ctx.lineWidth = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '~') continue;
      if (grid[r - 1]?.[c] !== '~') line(ctx, c * T, r * T, (c + 1) * T, r * T);
      if (grid[r + 1]?.[c] !== '~') line(ctx, c * T, (r + 1) * T, (c + 1) * T, (r + 1) * T);
      if (grid[r][c - 1] !== '~') line(ctx, c * T, r * T, c * T, (r + 1) * T);
      if (grid[r][c + 1] !== '~') line(ctx, (c + 1) * T, r * T, (c + 1) * T, (r + 1) * T);
    }
  }

  function drawWalls(ctx) {
    const inset = 3, rad = 12, lift = 7;   // rounded, lifted blocks
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '#') continue;
      const x = c * T + inset, y = r * T + inset, w = T - inset * 2, hh = T - inset * 2;
      // drop shadow
      ctx.fillStyle = 'rgba(0,0,0,.30)';
      roundRect(ctx, x + 2, y + lift, w, hh, rad); ctx.fill();
      // side (front face)
      ctx.fillStyle = S.wallSide;
      roundRect(ctx, x, y + lift * 0.5, w, hh, rad); ctx.fill();
      // top face
      ctx.fillStyle = S.wallTop;
      roundRect(ctx, x, y, w, hh - 2, rad); ctx.fill();
      // top highlight
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
      roundRect(ctx, x + 2, y + 2, w - 4, hh - 8, rad - 2); ctx.stroke();
      // ink outline (Brawl-thick)
      ctx.strokeStyle = CFG.palette.ink; ctx.lineWidth = 2.5;
      roundRect(ctx, x, y, w, hh - 2, rad); ctx.stroke();
    }
  }

  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  window.Arena = { T, cols, rows, W, H, grid, isSolid, isWall, isWater, spawn, collide, camoSurface, draw, roundRect };
})();
