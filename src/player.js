/* Brawl & Seek — the player hider and the one rule that carries the mode:
 * stand still against a surface and, over `repaintTime`, you paint in and vanish
 * (name tag + health fade with the fill); move and the camo breaks instantly and
 * the timer resets. State here; the paint-fill *look* lives in render.js. */
(function () {
  const T = CFG.tile;

  const player = {
    x: 0, y: 0,
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
      this.x = s.x; this.y = s.y;
      this.still = 0; this.progress = 0; this.hidden = false;
      this.camo = Arena.camoSurface(this.x, this.y, this.h);
    },

    update(dt) {
      const v = Input.vector();
      const mag = Math.hypot(v.x, v.y);
      const moving = mag > 0.01;

      if (moving) {
        if (v.x) this.facing = v.x > 0 ? 1 : -1;
        // Move with per-axis tile collision.
        const step = this.speed * dt;
        const p = Arena.collide(this.x, this.y, v.x * step, v.y * step, this.h);
        this.x = p.x; this.y = p.y;

        if (this.progress > 0) breakCamo(this);   // any real movement breaks camo
        this.still = 0;
      } else {
        this.still += dt;
        this.camo = Arena.camoSurface(this.x, this.y, this.h);
        const target = Math.min(this.still / STATE.repaintTime, 1);
        const wasHidden = this.hidden;
        this.progress = target;
        this.hidden = this.progress >= 1;
        if (this.hidden && !wasHidden) FX.settleRing(this.x, this.y - this.r * 0.2);
      }
      this.lastMoving = moving;
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
