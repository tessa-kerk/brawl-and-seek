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
  // bleed = the world-space rect that exactly covers the full visible canvas
  // at the current fit (game.js render()); falls back to the arena's own
  // W×H bounds for callers that don't pass one (e.g. any older/direct call).
  function draw(ctx, t, bleed) {
    drawGround(ctx, bleed || { x0: 0, y0: 0, x1: W, y1: H });
    drawBush(ctx);
    drawWater(ctx, t);
    drawProps(ctx);
    // NOTE: walls are NOT drawn here (engineering pass, 18-07-2026) — they now
    // draw as part of the Y-sorted interleave in game.js render(), alongside
    // entities, so a tall block can correctly occlude what's behind it. See
    // wallDrawables() below. Ground layers (floor/bush/water) stay flat and
    // always-first, since they have no height to occlude anything with.
  }

  /* Full-bleed ground (Concept Brief rule 3l, 20-07-2026 — "kill the
   * letterbox completely"). The floor texture now covers the ENTIRE visible
   * world rect, not just the playable Arena.W×H footprint, so there is no
   * rectangle edge or dimmed void anywhere on screen — the SAME ground just
   * keeps going. The two true map edges (top+left) already carry a wall
   * cluster as their natural boundary feature; the two crop edges (right+
   * bottom) now read as "the map keeps going" simply because the ground
   * genuinely does, at full brightness, with nothing marking a stop. This
   * supersedes the old per-arena floor fill AND the old drawCutEdgeFade
   * gradient (both retired — a fade that stops at W/H is itself a visible
   * rectangle edge once the ground bleeds past it). */
  function drawGround(ctx, bleed) {
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

  /* TRUE organic pool silhouette (PM directive, 18-07-2026): Acid Lakes'
   * pool is a genuine diagonal chain of tiles, unlike Spots of Yore's clean
   * rounded-square (measured precisely last pass — that pool really was a
   * square, this one really isn't). A per-REGION bounding box would round
   * the diagonal off into a rectangle; instead each water TILE gets its own
   * rounded-rect (same technique drawBush already uses), so the union
   * traces the actual stair-step diagonal from the real map, not a guess. */
  function drawWater(ctx, t) {
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === '~') cells.push([c, r]);
    if (!cells.length) return;

    // Rim first, as a soft shadow cast by the SAME per-tile union: canvas
    // shadows read the final composited alpha of the fill, not individual
    // subpaths, so two adjacent water tiles never show a seam where they
    // touch — the glow traces only the shape's true outer boundary. Colour
    // sampled directly from genuine in-game reference art (RGB 130,68,46),
    // matching the Spots of Yore rim tone (both maps use the same terracotta
    // pool border language).
    ctx.save();
    ctx.shadowColor = '#82442E'; ctx.shadowBlur = 3;
    ctx.fillStyle = '#82442E';
    ctx.beginPath();
    for (const [c, r] of cells) roundRectPath(ctx, c * T, r * T, T, T, T * 0.12);
    ctx.fill(); ctx.fill();   // twice: shadowBlur only casts from an actual fill, and one pass reads faint on some canvases
    ctx.restore();

    // The water texture/fill covers the rim layer's interior at the exact
    // same footprint, leaving only the shadow's outward bleed visible —
    // that bleed IS the rim, no inset math, no seam risk.
    ctx.save();
    ctx.beginPath();
    for (const [c, r] of cells) roundRectPath(ctx, c * T, r * T, T, T, T * 0.12);
    ctx.clip();
    const waterImg = window.Assets && Assets.get('water');
    if (waterImg) {
      const s = Math.max(W / waterImg.naturalWidth, H / waterImg.naturalHeight);
      const ww = waterImg.naturalWidth * s, wh = waterImg.naturalHeight * s;
      ctx.drawImage(waterImg, (W - ww) / 2, (H - wh) / 2, ww, wh);
    } else {
      ctx.fillStyle = S.water; ctx.fillRect(0, 0, W, H);
    }
    // moving highlight bands
    ctx.globalAlpha = 0.22; ctx.strokeStyle = S.waterHi; ctx.lineWidth = 3;
    for (let i = -2; i < rows + 2; i++) {
      const yy = i * 26 + (t * 14) % 26;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy - 40); ctx.stroke();
    }
    ctx.restore();
  }

  // Decorative floor-level props (footage/reference batch, 18-07-2026): the
  // two traced Power-Cube spawn markers. Flat ground decals ON the floor
  // layer, drawn after water so they read as sitting on the ground, never
  // consulted by collide()/isSolid()/hideTiles — purely visual, matching
  // real Brawl where Power Cube spawns are walkable floor markers, not
  // obstacles. Falls back to a simple procedural badge if no asset loaded.
  const PROPS = (ARENA.props || []);
  function drawProps(ctx) {
    const img = window.Assets && Assets.get('powercube');
    for (const p of PROPS) {
      const x = p.c * T + T / 2, y = p.r * T + T / 2;
      if (img) {
        const s = T * 0.62 / Math.max(img.naturalWidth, img.naturalHeight);
        const w = img.naturalWidth * s, h = img.naturalHeight * s;
        ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
      } else {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + T * 0.18, T * 0.24, T * 0.1, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#E8862E'; ctx.strokeStyle = CFG.palette.ink; ctx.lineWidth = 2.5;
        roundRect(ctx, x - T * 0.2, y - T * 0.2, T * 0.4, T * 0.4, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(20,23,43,.55)';
        ctx.beginPath(); ctx.arc(x, y, T * 0.09, 0, 7); ctx.fill();
        ctx.restore();
      }
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

  /* Bush canopy — organic overlapping mass with height, characters sink into
   * it (Concept Brief rule 3l, 20-07-2026 — Tessa: "bushes are actual bushes
   * not 2D flat objects"). drawBush() above stays the flat walkable/camo
   * ground layer (unchanged); this is a SEPARATE taller layer that joins the
   * Y-sorted wall+entity interleave in game.js, so a hider standing at or
   * behind a clump's near edge gets genuinely partly occluded by foliage —
   * the same "front of / behind" read walls already get, not a flat sheet
   * painted under everyone. Silhouette is several overlapping soft blobs,
   * not a rounded-rect union, so the outer edge reads organic rather than a
   * tile-grid outline with the corners filed off. */
  function bushCanopyDrawables() {
    const regions = tileRegions((c, r) => grid[r][c] === 'b');
    const out = [];
    for (const reg of regions) out.push({ y: (reg.r1 + 1) * T, draw: (ctx) => drawBushCanopy(ctx, reg) });
    return out;
  }

  function drawBushCanopy(ctx, reg) {
    const x0 = reg.c0 * T, y0 = reg.r0 * T, x1 = (reg.c1 + 1) * T, y1 = (reg.r1 + 1) * T;
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const bushImg = window.Assets && Assets.get('bush');
    // A handful of overlapping blobs, offset beyond the tile footprint on
    // every side and lifted above the tile tops — the "puffs out and rises
    // above the grid" cue a flat per-tile fill can't give.
    const n = Math.max(3, reg.c1 - reg.c0 + 2);
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      blobs.push({
        x: x0 + w * t,
        y: cy - h * (0.18 + 0.1 * Math.sin(i * 2.4)),
        r: Math.max(w, h) * (0.3 + 0.06 * ((i * 7) % 3)),
      });
    }
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(cx, y1 - 2, w * 0.42, h * 0.16, 0, 0, 7); ctx.fill();
    ctx.beginPath();
    for (const b of blobs) { ctx.moveTo(b.x + b.r, b.y); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); }
    ctx.clip();
    if (bushImg) {
      const bleedW = w * 1.5, bleedH = h * 1.8;
      const s = Math.max(bleedW / bushImg.naturalWidth, bleedH / bushImg.naturalHeight);
      const bw = bushImg.naturalWidth * s, bh = bushImg.naturalHeight * s;
      ctx.drawImage(bushImg, cx - bw / 2, cy - bh / 2 - h * 0.15, bw, bh);
    } else {
      ctx.fillStyle = S.bush; ctx.fillRect(x0 - w * 0.4, y0 - h * 0.5, w * 1.8, h * 1.8);
      ctx.globalAlpha = 0.5; ctx.fillStyle = S.bushHi;
      for (const b of blobs) { ctx.beginPath(); ctx.arc(b.x, b.y - b.r * 0.3, b.r * 0.4, 0, 7); ctx.fill(); }
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

  /* Wall tiles MERGE into one continuous structure, not per-cell stamped
   * icons (Concept Brief rule 3l, 20-07-2026 — Tessa: "what even are these
   * purple blocks" over the old look). The wall_block asset is a discrete
   * capped-pillar OBJECT with transparent margins on every side (checked
   * directly: alpha=0 at all four tile corners) — drawn edge-to-edge per
   * tile as before, that transparency shows raw floor between adjacent
   * pillars, which IS the board-game "stamped icon with gaps" defect. Fix,
   * code-only (no new art): a flush, gapless base fill in the wall's own
   * body colour goes down FIRST across every wall tile — since tiles are
   * already flush squares, this alone reads as one continuous mass, no
   * union/clip math needed — then the pillar art layers on top as surface
   * ornamentation (the dome+spike pattern still reads, just no longer the
   * thing defining the silhouette). Front face + drop shadow now draw ONLY
   * on a tile's true south-facing cluster edge (its south neighbour isn't
   * also a wall) — marching-squares-style local edge detection, so a
   * multi-tile-tall block gets ONE base lip, not one per row. */
  function drawOneWall(ctx, c, r, block) {
    const x = c * T, y = r * T;
    const edgeS = !isWall(c, r + 1);   // true south-facing edge of this structure
    ctx.save();
    // Shared drop shadow — only at the structure's true base, once per span.
    if (edgeS) {
      ctx.fillStyle = 'rgba(0,0,0,.30)';
      ctx.beginPath(); ctx.ellipse(x + T / 2, y + T * 0.98, T * 0.5, T * 0.13, 0, 0, 7); ctx.fill();
    }
    // Gapless base — every wall tile, flush, no per-tile inset or rounding,
    // so touching tiles form one unbroken mass at the fill level regardless
    // of what the pillar art's own silhouette does on top.
    ctx.fillStyle = S.wallSide;
    ctx.fillRect(x, y, T, T + (edgeS ? T * FRONT_FACE_H * 0.4 : 0));
    ctx.fillStyle = S.wallTop;
    ctx.fillRect(x, y, T, T);
    if (block) {
      // Front face: a flat dark strip, only on a true south edge.
      if (edgeS) {
        ctx.fillStyle = 'rgba(8,6,18,.46)';
        roundRect(ctx, x + T * 0.02, y + T - T * 0.03, T * 0.96, T * FRONT_FACE_H, T * 0.06); ctx.fill();
      }
      // flip alternate tiles so the repeating pillar/dome art doesn't read
      // as one stamped image copy-pasted across the mass
      const flip = ((c * 5 + r * 3) & 1) === 1;
      if (flip) { ctx.translate(x + T / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + T / 2), 0); }
      ctx.drawImage(block, x, y, T, T);
    } else if (edgeS) {
      // procedural fallback front face only (base fill above already gives
      // the flat colour read; this just adds the edge lip)
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      roundRect(ctx, x + 2, y + T - T * 0.18, T - 4, T * 0.18, 4); ctx.fill();
    }
    // Single-pass outline: stroke ONLY the edges that border a non-wall
    // tile (or the map's own out-of-bounds edge) — the marching-squares
    // step that keeps internal seams between same-cluster tiles from
    // showing at all, so the whole structure reads with one outline.
    // Softened (full-frame gate, 20-07-2026): a full-strength ink stroke
    // read as a hard cartoon-sticker outline next to her footage's soft
    // painted block shading, which has no comparable hard edge — thinner,
    // semi-transparent dark-purple instead of solid ink.
    ctx.strokeStyle = 'rgba(20,16,42,.5)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    if (!isWall(c, r - 1)) line(ctx, x, y, x + T, y);
    if (edgeS) line(ctx, x, y + T, x + T, y + T);
    if (!isWall(c - 1, r)) line(ctx, x, y, x, y + T);
    if (!isWall(c + 1, r)) line(ctx, x + T, y, x + T, y + T);
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
    freeTiles, hideTiles, centre, tileOf, path, pick, drawCamoOverlay, typeAt, wallDrawables, bushCanopyDrawables,
  };
})();
