/* Brawl & Seek — input. One normalised move vector out; the player module never
 * cares if it came from a keyboard or a thumb.
 *   WASD / Arrow keys on desktop (full speed).
 *   A floating touch thumb-stick on phones.
 *
 * Touch design (reworked 07-07-2026 after the M1 mobile playtest):
 *  - ROBUST MULTI-TOUCH: the first finger down drives the stick; a stray second
 *    finger is ignored (can't steal control); and if the driving finger lifts
 *    while another is still down, control HANDS OFF to that finger instead of
 *    going dead. (The dead-lock was the "takes multiple tries to move" bug.)
 *  - SNAPPY RESPONSE: small dead-zone + a short throw, and a response curve that
 *    gives real speed the instant you clear the dead-zone (no crawl band). */
(function () {
  const keys = new Set();
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  };
  addEventListener('keydown', (e) => { const d = KEYMAP[e.code]; if (d) { keys.add(d); e.preventDefault(); } });
  addEventListener('keyup', (e) => { const d = KEYMAP[e.code]; if (d) { keys.delete(d); e.preventDefault(); } });
  addEventListener('blur', () => keys.clear());

  // ---- Touch thumb-stick ------------------------------------------------
  const DEAD = 4;      // px dead-zone (tiny — just kills accidental micro-jitter)
  const MAX = 34;      // px throw to reach full speed
  const MIN_K = 0.5;   // speed factor the instant you clear the dead-zone (no crawl)

  const touches = new Map();                 // id -> {x, y}  (all active touches)
  const stick = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };

  const ring = document.createElement('div');
  const nub = document.createElement('div');
  Object.assign(ring.style, base(90)); Object.assign(nub.style, base(40));
  ring.id = 'stick-ring'; nub.id = 'stick-nub'; ring.appendChild(nub);
  ring.style.display = 'none';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(ring));
  function base(s) { return { position: 'absolute', width: s + 'px', height: s + 'px', borderRadius: '50%', zIndex: 6, pointerEvents: 'none', transform: 'translate(-50%,-50%)', left: '0', top: '0' }; }

  function showRing() {
    ring.style.display = 'block';
    ring.style.background = 'radial-gradient(circle, rgba(53,224,208,.10), rgba(23,27,51,.5))';
    ring.style.border = '2px solid rgba(53,224,208,.35)';
    nub.style.background = 'rgba(255,200,0,.92)';
    nub.style.boxShadow = '0 3px 10px rgba(0,0,0,.4)';
  }
  function place() {
    ring.style.left = stick.ox + 'px'; ring.style.top = stick.oy + 'px';
    nub.style.left = (45 + stick.dx) + 'px'; nub.style.top = (45 + stick.dy) + 'px';
  }
  function anchor(id) {                       // (re)seat the stick on a given touch
    const t = touches.get(id); if (!t) return;
    stick.id = id; stick.ox = t.x; stick.oy = t.y; stick.dx = 0; stick.dy = 0;
    showRing(); place();
  }
  function drive(id) {                         // update throw from the stick touch
    const t = touches.get(id);
    let dx = t.x - stick.ox, dy = t.y - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; }
    stick.dx = dx; stick.dy = dy; place();
  }
  function release(id) {                        // a touch ended
    touches.delete(id);
    if (id !== stick.id) return;               // a non-driving finger lifted — nothing to do
    const next = [...touches.keys()].pop();     // hand off to a remaining finger, if any
    if (next != null) anchor(next);
    else { stick.id = null; stick.dx = stick.dy = 0; ring.style.display = 'none'; }
  }

  addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    if (stick.id == null) anchor(e.changedTouches[0].identifier);  // first finger drives; strays ignored
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) { if (touches.has(t.identifier)) touches.set(t.identifier, { x: t.clientX, y: t.clientY }); }
    if (stick.id != null && touches.has(stick.id)) drive(stick.id);
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', (e) => { for (const t of e.changedTouches) release(t.identifier); }, { passive: false });
  addEventListener('touchcancel', (e) => { for (const t of e.changedTouches) release(t.identifier); });

  // ---- Public API -------------------------------------------------------
  // Returns {x,y} with magnitude 0..1 (direction × response-curve speed factor).
  window.Input = {
    vector() {
      let x = 0, y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m }; }
      if (stick.id != null) {
        const d = Math.hypot(stick.dx, stick.dy);
        if (d > DEAD) {
          const ramp = Math.min((d - DEAD) / (MAX - DEAD), 1);
          const k = MIN_K + (1 - MIN_K) * ramp;   // real speed straight out of the dead-zone
          return { x: stick.dx / d * k, y: stick.dy / d * k };
        }
      }
      return { x: 0, y: 0 };
    },
  };
})();
