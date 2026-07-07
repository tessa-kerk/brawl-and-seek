/* Brawl & Seek — input. One normalised move vector out.
 *   WASD / Arrow keys on desktop (full speed).
 *   Touch: a thumb-stick, in one of two modes (query-selectable):
 *     float  (default)      — a floating stick that anchors where you first touch.
 *     fixed  (?joystick=fixed) — a standard fixed base bottom-left, generous
 *                                dead-zone, NO re-anchor. Boring, always works.
 *
 * iOS-Safari hardening (07-07-2026, after two mobile playtests where the sim
 * passed but the device didn't):
 *   - Listeners live on the #stage ELEMENT with {passive:false} (element-level
 *     listeners are reliably non-passive, so preventDefault actually stops
 *     iOS page-pan / pinch / double-tap-zoom stealing the touch).
 *   - State is rebuilt from the authoritative `event.touches` EVERY event, so a
 *     dropped touchend / reused identifier can't leave a stale anchor.
 *   - Telemetry (Input.debug()) drives the ?debug=1 overlay — the device
 *     recording is now the ground truth, not a scripted sim. */
(function () {
  const keys = new Set();
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  };
  addEventListener('keydown', (e) => { const d = KEYMAP[e.code]; if (d) { keys.add(d); e.preventDefault(); } });
  addEventListener('keyup', (e) => { const d = KEYMAP[e.code]; if (d) { keys.delete(d); e.preventDefault(); } });
  addEventListener('blur', () => keys.clear());

  const MODE = new URLSearchParams(location.search).get('joystick') === 'fixed' ? 'fixed' : 'float';

  // Tuning per mode.
  const F = { DEAD: 4, MAX: 34, MINK: 0.5 };            // floating
  const X = { DEAD: 12, RAD: 62, MINK: 0.55 };          // fixed (generous)

  let anchorId = null;                 // identifier of the driving touch
  let active = false;
  const anchor = { x: 0, y: 0 };       // float: where the finger first landed; fixed: the base
  const cur = { x: 0, y: 0 };          // current finger position
  const stick = { dx: 0, dy: 0 };      // throw offset, clamped to the mode's radius

  const dbg = {
    mode: MODE, touches: [], anchor: null, cur: null, vec: { x: 0, y: 0 }, mag: 0,
    pdOk: false, lastType: '-', evtCount: 0,
  };

  // ---- visuals ----------------------------------------------------------
  const ring = el(MODE === 'fixed' ? 128 : 92), nub = el(MODE === 'fixed' ? 54 : 40);
  ring.id = 'stick-ring'; nub.id = 'stick-nub'; ring.appendChild(nub);
  ring.style.display = MODE === 'fixed' ? 'block' : 'none';
  function el(s) { const d = document.createElement('div'); Object.assign(d.style, { position: 'fixed', width: s + 'px', height: s + 'px', borderRadius: '50%', zIndex: 6, pointerEvents: 'none', transform: 'translate(-50%,-50%)', left: '0', top: '0' }); return d; }
  addEventListener('DOMContentLoaded', () => document.body.appendChild(ring));

  function base() { return { x: Math.max(78, innerWidth * 0.15), y: innerHeight - Math.max(120, innerHeight * 0.17) }; }
  function styleRing(on) {
    ring.style.background = 'radial-gradient(circle, rgba(53,224,208,.10), rgba(23,27,51,.5))';
    ring.style.border = '2px solid rgba(53,224,208,' + (on ? '.4' : '.22') + ')';
    nub.style.background = 'rgba(255,200,0,' + (on ? '.92' : '.5') + ')';
    nub.style.boxShadow = '0 3px 10px rgba(0,0,0,.4)';
  }
  function drawVisual() {
    if (MODE === 'fixed') {
      const b = base(); ring.style.left = b.x + 'px'; ring.style.top = b.y + 'px';
      nub.style.left = (b.x + stick.dx) + 'px'; nub.style.top = (b.y + stick.dy) + 'px';
      styleRing(active);
    } else {
      ring.style.display = active ? 'block' : 'none';
      ring.style.left = anchor.x + 'px'; ring.style.top = anchor.y + 'px';
      nub.style.left = (anchor.x + stick.dx) + 'px'; nub.style.top = (anchor.y + stick.dy) + 'px';
      styleRing(true);
    }
  }

  // ---- clamp helpers ----------------------------------------------------
  function setThrow(px, py, ox, oy, RAD) {
    let dx = px - ox, dy = py - oy; const d = Math.hypot(dx, dy);
    if (d > RAD) { dx = dx / d * RAD; dy = dy / d * RAD; }
    stick.dx = dx; stick.dy = dy;
  }

  // ---- the one handler, rebuilt from event.touches ----------------------
  function handle(e) {
    dbg.evtCount++; dbg.lastType = e.type;
    if (e.cancelable) { e.preventDefault(); dbg.pdOk = true; } else { dbg.pdOk = false; }

    const list = [];
    for (const t of e.touches) list.push({ id: t.identifier, x: t.clientX, y: t.clientY });
    dbg.touches = list;

    if (MODE === 'fixed') {
      const b = base();
      let t = list.find((t) => t.id === anchorId);
      if (!t) { t = list.find(inZone); anchorId = t ? t.id : null; }   // engage a touch in the zone
      if (t) { active = true; cur.x = t.x; cur.y = t.y; anchor.x = b.x; anchor.y = b.y; setThrow(t.x, t.y, b.x, b.y, X.RAD); }
      else { active = false; stick.dx = stick.dy = 0; }
    } else {
      let t = list.find((t) => t.id === anchorId);
      if (!t) {                                    // anchor gone: (re)anchor to the newest live touch
        if (list.length) { t = list[list.length - 1]; anchorId = t.id; anchor.x = t.x; anchor.y = t.y; }
        else { anchorId = null; active = false; stick.dx = stick.dy = 0; }
      }
      if (t) { active = true; cur.x = t.x; cur.y = t.y; setThrow(t.x, t.y, anchor.x, anchor.y, F.MAX); }
    }
    drawVisual();
  }
  function inZone(t) { return t.x < innerWidth * 0.62 && t.y > innerHeight * 0.42; }

  addEventListener('DOMContentLoaded', () => {
    const surface = document.getElementById('stage') || window;
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel'])
      surface.addEventListener(ev, handle, { passive: false });
    drawVisual();
  });

  // ---- public API -------------------------------------------------------
  function curve(d, C) {
    const ramp = Math.min((d - C.DEAD) / (C.RAD !== undefined ? C.RAD - C.DEAD : C.MAX - C.DEAD), 1);
    return C.MINK + (1 - C.MINK) * ramp;
  }
  // Is the player actively commanding movement right now (key held, or the
  // stick deflected past its dead-zone)? Used to gate the repaint so pushing
  // against a wall — where displacement can be zero — never starts a hide.
  function engaged() {
    if (keys.size) return true;
    if (!active) return false;
    const C = MODE === 'fixed' ? X : F;
    return Math.hypot(stick.dx, stick.dy) > C.DEAD;
  }

  window.Input = {
    mode: MODE,
    engaged,
    vector() {
      let x = 0, y = 0;
      if (keys.has('left')) x -= 1; if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1; if (keys.has('down')) y += 1;
      if (x || y) { const m = Math.hypot(x, y); const v = { x: x / m, y: y / m }; dbg.vec = v; dbg.mag = 1; return v; }
      if (active) {
        const C = MODE === 'fixed' ? X : F;
        const d = Math.hypot(stick.dx, stick.dy);
        if (d > C.DEAD) {
          const k = curve(d, C);
          const v = { x: stick.dx / d * k, y: stick.dy / d * k };
          dbg.vec = v; dbg.mag = Math.hypot(v.x, v.y);
          dbg.anchor = MODE === 'fixed' ? base() : { x: anchor.x, y: anchor.y };
          dbg.cur = { x: cur.x, y: cur.y };
          return v;
        }
      }
      dbg.vec = { x: 0, y: 0 }; dbg.mag = 0;
      dbg.anchor = MODE === 'fixed' ? base() : (active ? { x: anchor.x, y: anchor.y } : null);
      dbg.cur = active ? { x: cur.x, y: cur.y } : null;
      return { x: 0, y: 0 };
    },
    debug() { return dbg; },
  };
})();
