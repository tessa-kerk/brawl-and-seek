/* Brawl & Seek — TEMPORARY M4 gate control: an in-game pace picker.
 *
 * Tessa's canonical test flow is the home-screen PWA, which has no URL bar, so
 * she cannot type ?speed=<n> to A/B the movement pace. This is a visible,
 * tappable, blind A/B/C segmented control that switches the global speed live,
 * survives Play again within the session, and works in the PWA on phone AND on
 * desktop. `?speed=` stays as the debug affordance.
 *
 * This is temporary UI on the signed-off Event surface (flagged in PLAN.md). It
 * gets removed / demoted into a debug corner once Tessa's pick is baked into
 * TUNING.speedScale with a dated note. Kept in its own file so removal is one
 * script tag + one DOM block. */
(function () {
  function init() {
    const seg = document.getElementById('pace-seg');
    if (!seg || !window.STATE) return;
    const btns = [...seg.querySelectorAll('button')];

    function sync() {
      for (const b of btns) {
        b.classList.toggle('on', Math.abs(parseFloat(b.dataset.speed) - STATE.speedScale) < 0.001);
      }
    }
    for (const b of btns) {
      b.addEventListener('click', () => {
        STATE.speedScale = parseFloat(b.dataset.speed);   // live, uniform (ratios preserved)
        sync();
      });
    }
    sync();
    window.Pace = { sync };
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init);
  else init();
})();
