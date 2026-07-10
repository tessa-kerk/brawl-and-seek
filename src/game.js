/* Brawl & Seek — boot, global state, the fit-to-viewport transform, and the main
 * loop. The arena is a fixed world drawn contained and centred, so it reads from
 * a 1280-wide desktop down to a 360-wide phone. A debug API (window.Game.pose /
 * pause) lets the capture rig freeze exact frames; ?debug=1 adds the overlay. */
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
  let elHint, elStatus, elBanner, elBonus, elTicker;
  let lastPhase = 'hide', bannerT = 0, bonusArmed = false, lastDt = 0.016;

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
    if (Round.phase === 'over') { Round.update(dt); FX.update(dt); return; }  // freeze the scene
    STATE.repaintTime = Round.repaintTime();
    Player.update(dt);
    Hiders.update(dt);
    Seekers.update(dt);
    Tags.update(dt);
    Round.update(dt);
    FX.update(dt);
    if (Player.hidden) STATE.everHidden = true;
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#171B33'; ctx.fillRect(0, 0, cssW, cssH);

    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offX * dpr, offY * dpr);
    Arena.draw(ctx, tSec);
    FX.draw(ctx);
    for (const d of Hiders.list) Render.drawHider(ctx, d, tSec, false);
    for (const s of Seekers.list) Render.drawSeeker(ctx, s, tSec);
    Render.drawPlayer(ctx, tSec);
    Tags.draw(ctx);
    Reveal.frame(ctx, tSec);                       // dim + reveal markers when over

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);        // screen space
    if (Round.phase === 'over' && Round.result.reason === 'spotted' && Round.overT < Reveal.delay())
      Render.drawSpotted(ctx, cssW, cssH, Round.overT);

    hud();
    if (window.Debug && Debug.on) Debug.frame();
  }

  // ---- HUD ---------------------------------------------------------------
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function hud() {
    const over = Round.phase === 'over';
    const st = Player.found ? 'exposed' : Player.state();
    elStatus.className = (!over && st !== 'exposed') ? st + ' visible' : st;
    elStatus.textContent = over ? '' : st === 'hidden' ? 'Camouflaged' : st === 'hiding' ? 'Painting in…' : '';
    if (STATE.everHidden) elHint.classList.add('dim');

    // ticker
    document.getElementById('tk-score').textContent = Math.round(Round.score).toLocaleString();
    const rate = Player.hidden ? Round.rate : TUNING.hider.scoreRate;
    document.getElementById('tk-rate').textContent = `+${rate.toFixed(rate < 10 ? 1 : 0)}/s`;
    const coinAlpha = Math.max(0.18, rate / TUNING.hider.scoreRate);
    document.getElementById('tk-coin').style.opacity = coinAlpha;
    document.getElementById('tk-coinchip').classList.toggle('decayed', rate < TUNING.hider.scoreRate * 0.6);
    document.getElementById('tk-repaint').textContent = Round.repaintTime().toFixed(1) + 's';
    document.getElementById('tk-hiders').textContent = Round.hidersAlive();
    const tl = Round.timeLeft();
    document.getElementById('tk-time').textContent = fmt(tl);
    document.querySelector('#ticker .time').classList.toggle('low', tl <= 15);

    // phase banner
    if (Round.phase !== lastPhase) {
      if (Round.phase === 'seek') { showBanner('SEEKER RELEASED', 'run · hide · reposition'); bannerT = 1.7; }
      lastPhase = Round.phase;
    }
    if (over) {
      elBanner.classList.remove('show');   // never let a banner sit over the reveal map
      elHint.classList.add('dim');
      bannerT = 0;
    } else if (Round.phase === 'hide') {
      showBanner('HIDE!', `seeker releases in ${Math.ceil(Round.hideTimeLeft())}s`);
    } else if (bannerT > 0) {
      bannerT -= lastDt;
      if (bannerT <= 0) elBanner.classList.remove('show');
    }
    // the reveal map is the shareable artefact — keep the ticker off it
    elTicker.classList.toggle('hidden', over);

    // reposition bonus flash
    if (Round.bonusFlash > 0 && !bonusArmed) {
      bonusArmed = true;
      elBonus.textContent = `+${TUNING.hider.repositionBonus}`;
      elBonus.classList.remove('show'); void elBonus.offsetWidth; elBonus.classList.add('show');
    }
    if (Round.bonusFlash <= 0) bonusArmed = false;
  }
  function showBanner(main, sub) {
    elBanner.innerHTML = `${main}<small>${sub}</small>`;
    elBanner.classList.add('show');
  }

  // ---- loop --------------------------------------------------------------
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    lastDt = dt;
    tSec += STATE.paused ? 0 : dt;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function newRound() {
    Round.reset();
    Reveal.hidePanel();
    lastPhase = 'hide'; bannerT = 0; bonusArmed = false;
    elBanner.classList.remove('show');
  }

  function start() {
    stage = document.getElementById('stage');
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    elHint = document.getElementById('hint');
    elStatus = document.getElementById('status');
    elBanner = document.getElementById('banner');
    elBonus = document.getElementById('bonus');
    elTicker = document.getElementById('ticker');

    newRound();
    resize();
    addEventListener('resize', resize);
    addEventListener('orientationchange', () => setTimeout(resize, 60));
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', resize);
      visualViewport.addEventListener('scroll', resize);
    }
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => { STATE.reduceMotion = e.matches; });

    document.getElementById('replay').addEventListener('click', newRound);
    const stamp = document.querySelector('.stamp');
    if (stamp) stamp.textContent = `v${CFG.BUILD.n} · ${CFG.BUILD.milestone}`;

    if (new URLSearchParams(location.search).has('debug') && window.Debug) Debug.init();
    requestAnimationFrame(frame);
  }

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

  // ---- Debug / capture API ----------------------------------------------
  window.Game = {
    get scale() { return scale; }, get off() { return { x: offX, y: offY }; },
    pause() { STATE.paused = true; }, resume() { STATE.paused = false; last = 0; },
    setRepaint(s) { STATE.repaintTime = s; },
    setReduceMotion(b) { STATE.reduceMotion = !!b; },
    newRound,
    skipHide() { Round.elapsed = Math.max(Round.elapsed, TUNING.round.hidePhase); Round.phase = 'seek'; },
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
