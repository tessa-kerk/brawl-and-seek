/* Brawl & Seek — the MAP MAKER view. The pitch's money shot: camouflage as a
 * tunable map property, not a sentence in a deck. The same arena sits in an
 * editor frame with FOUR properties that change the mechanic LIVE, with no
 * restart — flip a toggle and the next second of play obeys it.
 *
 *   • Camo surfaces  — which surfaces paint a hider in (walls / floor / water /
 *     bush — bush added art pass 18-07-2026, a real Brawl hiding verb, not
 *     decoration; priority wall > bush > water > floor)
 *   • Repaint time   — how long stillness takes to hide you (0.5 / 1 / 2s)
 *   • Ripple tell    — do hidden brawlers ripple when someone moves close
 *
 * It's a test-play sandbox, not a round: one bot seeker patrols so the tell and
 * the Tag stay meaningful, and being tagged just respawns you. */
(function () {
  const DEFAULTS = { surfaces: { wall: true, floor: true, water: true, bush: true }, repaint: 1.0, ripple: true };
  const M = { surfaces: { ...DEFAULTS.surfaces }, repaint: DEFAULTS.repaint, ripple: DEFAULTS.ripple };

  let toastT = 0, benchT = 0, el = {};

  // ---- push the panel's values into the live mechanic --------------------
  function apply() {
    STATE.camoSurfaces = { ...M.surfaces };
    STATE.rippleTell = M.ripple;
    if (STATE.view === 'maker') STATE.repaintTime = M.repaint;
    syncPanel();
  }

  function syncPanel() {
    for (const b of document.querySelectorAll('.mk-surf'))
      b.classList.toggle('on', !!M.surfaces[b.dataset.surface]);
    for (const b of document.querySelectorAll('#mk-repaint button'))
      b.classList.toggle('on', parseFloat(b.dataset.repaint) === M.repaint);
    if (el.ripple) { el.ripple.classList.toggle('on', M.ripple); el.ripple.setAttribute('aria-checked', String(M.ripple)); }
    const none = !M.surfaces.wall && !M.surfaces.floor && !M.surfaces.water && !M.surfaces.bush;
    if (el.warn) el.warn.hidden = !none;
  }

  // ---- view switching ----------------------------------------------------
  function enter() {
    STATE.view = 'maker';
    Round.phase = 'seek';          // the seeker patrols; there is no round clock
    Hiders.list.length = 0;        // sandbox: no dummies, all attention on the property
    Player.reset(); Seekers.reset(); Tags.reset();
    for (const s of Seekers.list) { s.state = 'patrol'; s.hold = 1.2; }
    document.body.classList.add('maker');
    apply();
    Game.refit();
  }

  function exit() {
    STATE.view = 'event';
    STATE.camoSurfaces = { ...DEFAULTS.surfaces };   // the event runs canon rules
    STATE.rippleTell = true;
    document.body.classList.remove('maker');
    Game.newRound();
    Game.refit();
  }

  // ---- sandbox behaviour -------------------------------------------------
  function onTagged(h) {
    if (h !== Player) return;
    toast('TAGGED!');
    Player.reset();
    for (const s of Seekers.list) { s.hold = 1.4; s.target = null; s.targetPos = null; s.state = 'patrol'; }
  }
  function toast(text) { toastT = 1.5; if (el.toast) { el.toast.textContent = text; el.toast.classList.add('show'); } }

  function update(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0 && el.toast) el.toast.classList.remove('show'); }
    // A benched seeker would leave an empty sandbox — put it back after a beat.
    const s = Seekers.list[0];
    if (s && s.state === 'spectator') {
      benchT += dt;
      if (benchT > 1.6) { s.health = TUNING.seeker.health; s.mistakes = 0; s.state = 'patrol'; s.hold = 0.6; benchT = 0; }
    } else benchT = 0;
  }

  // ---- wiring ------------------------------------------------------------
  function init() {
    el.panel = document.getElementById('makerpanel');
    el.toast = document.getElementById('mk-toast');
    el.ripple = document.getElementById('mk-ripple');
    el.warn = document.getElementById('mk-warn');

    document.getElementById('mk-open').addEventListener('click', enter);
    document.getElementById('mk-back').addEventListener('click', exit);

    for (const b of document.querySelectorAll('.mk-surf'))
      b.addEventListener('click', () => { M.surfaces[b.dataset.surface] = !M.surfaces[b.dataset.surface]; apply(); });

    for (const b of document.querySelectorAll('#mk-repaint button'))
      b.addEventListener('click', () => { M.repaint = parseFloat(b.dataset.repaint); apply(); });

    el.ripple.addEventListener('click', () => { M.ripple = !M.ripple; apply(); });

    document.getElementById('mk-reset').addEventListener('click', () => {
      M.surfaces = { ...DEFAULTS.surfaces }; M.repaint = DEFAULTS.repaint; M.ripple = DEFAULTS.ripple; apply();
    });

    syncPanel();
    if (new URLSearchParams(location.search).get('view') === 'maker') enter();
  }

  window.MAKER = M;
  window.Maker = { init, enter, exit, apply, update, onTagged, DEFAULTS };
})();
