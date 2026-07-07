/* Brawl & Seek — input. Exposes a single normalised move vector so the player
 * module never cares whether it came from a keyboard or a thumb.
 *   WASD / Arrow keys on desktop.
 *   A floating touch thumb-stick on phones (appears where you first touch).
 * Full mobile-control polish is Milestone 4; this is the minimum that makes the
 * mechanic testable at phone width (the M1 gate). */
(function () {
  const keys = new Set();
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  addEventListener('keydown', (e) => {
    const dir = KEYMAP[e.code];
    if (dir) { keys.add(dir); e.preventDefault(); }
  });
  addEventListener('keyup', (e) => {
    const dir = KEYMAP[e.code];
    if (dir) { keys.delete(dir); e.preventDefault(); }
  });
  // Drop all keys if focus leaves the tab (prevents a stuck direction).
  addEventListener('blur', () => keys.clear());

  // ---- Touch thumb-stick ------------------------------------------------
  const stick = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const MAX = 46;            // px radius of the stick throw
  const DEAD = 6;            // px dead-zone

  const nub = document.createElement('div');
  const ring = document.createElement('div');
  Object.assign(ring.style, thumbBase(96));
  Object.assign(nub.style, thumbBase(44));
  ring.id = 'stick-ring'; nub.id = 'stick-nub';
  ring.appendChild(nub);
  ring.style.display = 'none';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(ring));

  function thumbBase(size) {
    return {
      position: 'absolute', width: size + 'px', height: size + 'px',
      borderRadius: '50%', zIndex: 6, pointerEvents: 'none',
      transform: 'translate(-50%,-50%)', left: '0', top: '0',
    };
  }

  function place() {
    ring.style.left = stick.ox + 'px'; ring.style.top = stick.oy + 'px';
    nub.style.left = (MAX + stick.dx) + 'px';   // relative offset inside ring box
    nub.style.top = (MAX + stick.dy) + 'px';
  }

  function start(t) {
    stick.active = true; stick.id = t.identifier;
    stick.ox = t.clientX; stick.oy = t.clientY; stick.dx = 0; stick.dy = 0;
    ring.style.display = 'block';
    ring.style.background = 'radial-gradient(circle, rgba(53,224,208,.10), rgba(23,27,51,.55))';
    ring.style.border = '2px solid rgba(53,224,208,.35)';
    nub.style.background = 'rgba(255,200,0,.9)';
    nub.style.boxShadow = '0 3px 10px rgba(0,0,0,.4)';
    place();
  }
  function move(t) {
    let dx = t.clientX - stick.ox, dy = t.clientY - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; }
    stick.dx = dx; stick.dy = dy; place();
  }
  function end() {
    stick.active = false; stick.id = null; stick.dx = stick.dy = 0;
    ring.style.display = 'none';
  }

  addEventListener('touchstart', (e) => {
    if (!stick.active) start(e.changedTouches[0]);
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) if (t.identifier === stick.id) move(t);
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) if (t.identifier === stick.id) end();
  });
  addEventListener('touchcancel', end);

  // ---- Public API -------------------------------------------------------
  // Returns a vector with magnitude 0..1. Player treats |v| < 0.01 as "still".
  window.Input = {
    vector() {
      let x = 0, y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m }; }
      if (stick.active) {
        const m = Math.hypot(stick.dx, stick.dy);
        if (m > DEAD) {
          const k = Math.min(m, MAX) / MAX; // analogue magnitude
          return { x: stick.dx / m * k, y: stick.dy / m * k };
        }
      }
      return { x: 0, y: 0 };
    },
  };
})();
