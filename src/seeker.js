/* Brawl & Seek — the bot seeker(s). Seeker fairness rules from the Concept Brief:
 *  - a single universal Tag (same range for everyone), not brawler attacks;
 *  - a WRONG tag costs health (three mistakes survivable, the fourth benches you
 *    into spectator) so the pack can't brute-force the map;
 *  - camouflage is strong, not perfect: a hidden brawler only ripples when
 *    someone moves close (the tell). Sprint past and you see nothing.
 *  - found hiders become seekers (the 1v11 -> 11v1 snowball); the pack loses its
 *    speed boost as it grows. */
(function () {
  const T = CFG.tile;
  const list = [];

  // Every hider still in play: the player (unless found) plus live dummies.
  function hiders() {
    const out = Hiders.alive();
    if (!Player.found) out.push(Player);
    return out;
  }
  const active = () => list.filter((s) => s.state !== 'spectator');

  // +15% while <= 2 seekers, fading as the pack grows.
  function speedOf() {
    const n = active().length, B = TUNING.seeker;
    const boost = n <= 2 ? B.speedBoost : n === 3 ? B.speedBoost * 0.5 : n === 4 ? B.speedBoost * 0.25 : 0;
    return B.baseSpeed * (1 + boost);
  }

  function make(x, y) {
    return {
      name: 'SEEKER', col: CFG.characters.seeker, isSeeker: true,
      x, y, h: CFG.playerRadius * T, r: CFG.playerRadius * T * 1.02, facing: 1,
      health: TUNING.seeker.health, mistakes: 0,
      state: 'held', target: null, targetPos: null, live: false,
      repath: 0, tagCd: 0, hold: 0, path: [], wp: 0, stall: 0, flash: 0,
    };
  }

  function reset() {
    list.length = 0;
    const sp = Arena.spawn();
    // start the seeker far from the player's spawn
    const far = Arena.freeTiles
      .map((t) => ({ t, c: Arena.centre(t.c, t.r) }))
      .sort((a, b) => AI.tileDist(sp.x, sp.y, b.c.x, b.c.y) - AI.tileDist(sp.x, sp.y, a.c.x, a.c.y))[0];
    list.push(make(far.c.x, far.c.y));
  }

  // A found hider becomes a seeker — but not instantly, or a lucky find next to
  // two more hiders cascades the whole round in a couple of seconds.
  function spawnAt(x, y) { const s = make(x, y); s.state = 'patrol'; s.hold = TUNING.seeker.spawnHold; list.push(s); }

  // ---- tagging ----------------------------------------------------------
  function attemptTag(s) {
    const B = TUNING.seeker;
    s.tagCd = B.tagCooldown;
    const hit = hiders().find((h) => AI.tileDist(s.x, s.y, h.x, h.y) <= B.tagRange);
    if (hit) {
      Round.onFound(hit, s);
      s.target = null; s.targetPos = null; s.state = 'patrol'; s.hold = 0.5;
      return true;
    }
    // wrong tag — it costs
    s.health -= B.wrongTagCost; s.mistakes++; s.flash = 0.35;
    FX.breakBurst(s.x, s.y - s.r * 0.2);
    if (s.health <= 0) { s.state = 'spectator'; s.target = null; }
    else { s.target = null; s.targetPos = null; s.state = 'patrol'; }
    return false;
  }

  // ---- perception -------------------------------------------------------
  function perceive(s, dt, speedFrac) {
    const B = TUNING.seeker;
    // Sprinting past blinds you to the tell; slowing down rewards you.
    const notice = B.noticeChance * (1 - B.sprintBlindness * Math.min(1, speedFrac));
    let best = null, bestD = Infinity;
    for (const h of hiders()) {
      const d = AI.tileDist(s.x, s.y, h.x, h.y);
      if (!h.hidden && d < B.visionRadius && d < bestD) { best = h; bestD = d; }
      // the tell: a mover this close to a hidden brawler ripples the camo
      if (h.hidden && speedFrac > 0.02 && d < B.rippleRadius) {
        h._tellCd = (h._tellCd || 0) - dt;
        if (h._tellCd <= 0) { FX.tell(h.x, h.y - h.r * 0.2); h._tellCd = 0.45; }
        if (Math.random() < notice * dt) {                   // the bot reads its own ripple
          // A ripple says "somebody's near HERE", not "exactly there". The fix is
          // noisy, so the seeker sometimes tags empty ground and pays 30 health.
          const a = Math.random() * Math.PI * 2, m = Math.random() * B.noticeNoise * T;
          let gx = h.x + Math.cos(a) * m, gy = h.y + Math.sin(a) * m;
          const tl = Arena.tileOf(gx, gy);
          if (Arena.isSolid(tl.c, tl.r)) { gx = h.x; gy = h.y; }   // don't aim into a wall
          s.target = h; s.targetPos = { x: gx, y: gy }; s.live = false; s.state = 'chase'; s.repath = 0;
        }
      }
    }
    if (best) { s.target = best; s.targetPos = { x: best.x, y: best.y }; s.live = true; s.state = 'chase'; }
  }

  function update(dt) {
    const B = TUNING.seeker, spd = speedOf();
    for (const s of list) {
      if (s.state === 'spectator') continue;
      if (s.flash > 0) s.flash -= dt;
      if (s.tagCd > 0) s.tagCd -= dt;
      if (Round.phase === 'hide') { s.state = 'held'; continue; }
      if (s.hold > 0) { s.hold -= dt; continue; }     // freshly converted — gather yourself
      if (s.state === 'held') s.state = 'patrol';

      const before = { x: s.x, y: s.y };

      if (s.state === 'patrol') {
        if (AI.arrived(s) || s.stall > 0.7) AI.goTo(s, Arena.pick(Arena.freeTiles));
        AI.step(s, dt, spd);
      } else if (s.state === 'chase' && s.target) {
        if (s.target.found) { s.state = 'patrol'; s.target = null; }
        else {
          // a live target that paints in vanishes — fall back to its last seen spot
          if (s.live && s.target.hidden) { s.live = false; s.targetPos = { x: s.target.x, y: s.target.y }; }
          if (s.live) s.targetPos = { x: s.target.x, y: s.target.y };
          s.repath -= dt;
          if (s.repath <= 0) { const t = Arena.tileOf(s.targetPos.x, s.targetPos.y); AI.goTo(s, t); s.repath = B.repathEvery; }
          AI.step(s, dt, spd);
          const d = AI.tileDist(s.x, s.y, s.targetPos.x, s.targetPos.y);
          if (d <= B.tagRange && s.tagCd <= 0) attemptTag(s);
          else if (s.stall > 0.9) { s.state = 'patrol'; s.target = null; }
        }
      }

      // Smooth the speed estimate (~0.3s) — a single waypoint frame must not read
      // as "standing still and watching carefully".
      const movedDist = Math.hypot(s.x - before.x, s.y - before.y);
      const inst = Math.min(1, movedDist / Math.max(1e-6, spd * T * dt));
      const k = 1 - Math.exp(-dt / 0.3);
      s.speedEMA = (s.speedEMA == null ? inst : s.speedEMA + (inst - s.speedEMA) * k);
      perceive(s, dt, s.speedEMA);
    }
  }

  window.Seekers = { list, reset, update, spawnAt, active, speedOf };
})();
