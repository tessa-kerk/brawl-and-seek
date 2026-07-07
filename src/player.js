/* Brawl & Seek — the player hider and the one rule that carries the mode:
 * stand still against a surface and, over `repaintTime`, you paint in and vanish
 * (name tag + health fade with the fill); move and the camo breaks instantly and
 * the timer resets. State here; the paint-fill *look* lives in render.js. */
(function () {
  const T = CFG.tile;

  const player = {
    x: 0, y: 0,
    vx: 0, vy: 0,                     // world px/s — smoothed so free-walking isn't jerky
    h: CFG.playerRadius * T,          // collision half-extent
    r: CFG.playerRadius * T * 1.02,   // draw radius
    speed: CFG.playerSpeed * T,       // world px / s
    facing: 1,                        // 1 right, -1 left (for the little face)

    still: 0,                         // seconds held still on a valid surface
    progress: 0,                      // 0..1 paint-fill
    hidden: false,                    // progress === 1
    camo: null,                       // {type,color} being matched
    lastMoving: false,

    reset() {
      const s = Arena.spawn();
      this.x = s.x; this.y = s.y; this.vx = 0; this.vy = 0;
      this.still = 0; this.progress = 0; this.hidden = false;
      this.camo = Arena.camoSurface(this.x, this.y, this.h);
    },

    update(dt) {
      const v = Input.vector();                 // {x,y}, |v| = direction × speed factor
      const hasInput = Math.hypot(v.x, v.y) > 0.001;  // input.js already applies the dead-zone

      // Ease velocity toward intent — fast to start (punchy), quick to stop.
      const tvx = v.x * this.speed, tvy = v.y * this.speed;
      const a = 1 - Math.exp(-dt / (hasInput ? 0.04 : 0.06));
      this.vx += (tvx - this.vx) * a;
      this.vy += (tvy - this.vy) * a;

      // Integrate with per-axis tile collision; kill velocity into a blocked axis
      // so it never accumulates against a wall (which would feel like sticking).
      const rx = this.vx * dt, ry = this.vy * dt;
      const p = Arena.collide(this.x, this.y, rx, ry, this.h);
      if (Math.abs((p.x - this.x) - rx) > 0.01) this.vx = 0;
      if (Math.abs((p.y - this.y) - ry) > 0.01) this.vy = 0;
      this.x = p.x; this.y = p.y;
      if (hasInput && v.x) this.facing = v.x > 0 ? 1 : -1;

      if (hasInput) {
        if (this.progress > 0) breakCamo(this);  // intent to move breaks camo at once
        this.still = 0;
      } else {
        this.still += dt;
        this.camo = Arena.camoSurface(this.x, this.y, this.h);
        const wasHidden = this.hidden;
        this.progress = Math.min(this.still / STATE.repaintTime, 1);
        this.hidden = this.progress >= 1;
        if (this.hidden && !wasHidden) FX.settleRing(this.x, this.y - this.r * 0.2);
      }
      this.lastMoving = hasInput;
    },

    // Derived read-outs for HUD.
    nameAlpha() { return 1 - this.progress; },
    state() { return this.hidden ? 'hidden' : (this.progress > 0 ? 'hiding' : 'exposed'); },
  };

  function breakCamo(pl) {
    if (pl.hidden || pl.progress > 0.15) FX.breakBurst(pl.x, pl.y - pl.r * 0.2);
    pl.progress = 0; pl.hidden = false;
  }

  window.Player = player;
})();
