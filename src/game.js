/* Brawl & Seek — boot, global state, the fit-to-viewport transform, and the
 * main loop. The arena is a fixed world (Arena.W × Arena.H) drawn contained and
 * centred, so it "feels right" from a 1280-wide desktop down to a 360-wide
 * phone. A small debug API (window.Game.pose/pause) lets the capture rig freeze
 * exact frames for QA. */
(function () {
  window.STATE = {
    view: 'event',
    repaintTime: CFG.repaintTime,
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    paused: false,
    everHidden: false,
  };

  let canvas, ctx, stage;
  let dpr = 1, cssW = 0, cssH = 0, scale = 1, offX = 0, offY = 0;
  let last = 0, tSec = 0;

  // ---- DOM chrome refs ---
  let elHint, elStatus;

  function resize() {
    cssW = stage.clientWidth; cssH = stage.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    scale = Math.min(cssW / Arena.W, cssH / Arena.H);
    offX = (cssW - Arena.W * scale) / 2;
    offY = (cssH - Arena.H * scale) / 2;
  }

  function update(dt) {
    if (STATE.paused) return;
    Player.update(dt);
    FX.update(dt);
    if (Player.hidden) STATE.everHidden = true;
  }

  function render() {
    // background (letterbox)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#171B33';
    ctx.fillRect(0, 0, cssW, cssH);
    // world
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offX * dpr, offY * dpr);
    Arena.draw(ctx, tSec);
    FX.draw(ctx);
    Render.drawPlayer(ctx, tSec);
    hud();
    if (window.Debug && Debug.on) Debug.frame();
  }

  function hud() {
    const st = Player.state();
    elStatus.className = st + (st !== 'exposed' ? ' visible' : '');
    elStatus.textContent = st === 'hidden' ? 'Camouflaged' : st === 'hiding' ? 'Painting in…' : '';
    if (STATE.everHidden) elHint.classList.add('dim');
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;               // clamp after tab-switch/stall
    tSec += STATE.paused ? 0 : dt;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function start() {
    stage = document.getElementById('stage');
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    elHint = document.getElementById('hint');
    elStatus = document.getElementById('status');

    Player.reset();
    resize();
    addEventListener('resize', resize);
    addEventListener('orientationchange', () => setTimeout(resize, 60));
    // iOS Safari: the toolbar showing/hiding mid-round changes the usable height
    // without firing 'resize' — track the visual viewport so the fit stays right.
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', resize);
      visualViewport.addEventListener('scroll', resize);
    }
    // Debug overlay (ground-truth instrument): ?debug=1
    if (new URLSearchParams(location.search).has('debug') && window.Debug) Debug.init();
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => { STATE.reduceMotion = e.matches; });

    // stamp the build in the top bar
    const stamp = document.querySelector('.stamp');
    if (stamp) stamp.textContent = `v${CFG.BUILD.n} · ${CFG.BUILD.milestone}`;

    requestAnimationFrame(frame);
  }

  // Wait for the display font so the first canvas text paints in Lilita One.
  function boot() {
    if (document.fonts && document.fonts.load) {
      Promise.race([
        Promise.all([document.fonts.load("400 20px 'Lilita One'"), document.fonts.ready]),
        new Promise((r) => setTimeout(r, 1200)),
      ]).then(start);
    } else start();
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  // ---- Debug / capture API ---------------------------------------------
  window.Game = {
    get scale() { return scale; }, get off() { return { x: offX, y: offY }; },
    pause() { STATE.paused = true; }, resume() { STATE.paused = false; last = 0; },
    setRepaint(s) { STATE.repaintTime = s; },
    setReduceMotion(b) { STATE.reduceMotion = !!b; },
    // Freeze the player in an exact pose for a deterministic screenshot.
    pose({ col, row, progress = 0, facing = 1 } = {}) {
      const T = Arena.T;
      if (col != null) { Player.x = col * T + T / 2; Player.y = row * T + T / 2; }
      Player.vx = 0; Player.vy = 0;
      Player.facing = facing;
      Player.camo = Arena.camoSurface(Player.x, Player.y, Player.h);
      Player.still = progress * STATE.repaintTime;
      Player.progress = Math.min(progress, 1);
      Player.hidden = Player.progress >= 1;
      STATE.paused = true;
    },
    player: () => Player,
  };
})();
