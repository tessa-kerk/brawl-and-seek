/* Brawl & Seek — M2 tuning. CANON values from Tessa (07-07-2026; source: the
 * Concept Brief's design tuning). These are NOT placeholders. Everything the
 * round loop balances on lives in this one block, so iteration is fast and no
 * number is ever scattered into logic. */
window.TUNING = {
  hider: {
    scoreRate: 10,          // +10 pts/s while hidden
    rateHalfLife: 10,       // the rate halves every 10s spent in the same spot
    rateFloor: 2,           // …but never drops below 2/s
    repositionBonus: 100,   // repainting >= repositionMinTiles away banks +100
    repositionMinTiles: 3,  // …and resets the decay rate
  },

  repaint: {                // repaint time escalates as the round thins out
    base: 1.0,              // at round start
    afterThreeFound: 1.5,   // once three hiders have been found
    whenTwoRemain: 2.0,     // when only two hiders remain
  },

  seeker: {
    // --- CANON (Tessa) ---
    health: 100,
    wrongTagCost: 30,       // three mistakes survivable; the fourth -> spectator
    speedBoost: 0.15,       // +15% while <= 2 seekers, fading as the pack grows
    // --- PROTOTYPE-TUNED (not canon; balanced for this small 10x9 arena) ---
    tagRange: 0.7,          // tiles — the universal Tag's short reach
    baseSpeed: 3.7,         // tiles/s (player is 4.2, so a running hider can break away)
    visionRadius: 2.3,      // tiles — sees UNHIDDEN hiders (being caught in the open is bad,
                            // but not instantly fatal from across the arena)
    rippleRadius: 1.15,     // tiles — a mover this close to a hidden hider trips the tell
    noticeChance: 0.62,     // per second the bot reads its own ripple, BEFORE the speed penalty
    sprintBlindness: 0.72,  // a seeker at full sprint loses this much of its notice chance —
                            // "slow down and watch and you see it; sprint past and you don't"
    noticeNoise: 0.85,      // tiles of error on a ripple fix — a ripple says "near here", not "here".
                            // This is what makes wrong tags (and the -30 health rule) actually happen.
    tagCooldown: 0.8,       // s between tag attempts
    repathEvery: 0.35,      // s
    spawnHold: 1.6,         // s a newly-converted seeker waits before hunting
  },

  round: {
    hidePhase: 15,          // s of hiding before the seeker is released
    // CANON is a 180s cap. The prototype compresses the seek phase so a FULL
    // round stays clip-length (< 90s) per the Project Brief's acceptance
    // criteria. 15 + 60 = 75s total. Design number unchanged; demo compressed.
    seekPhase: 60,
    canonCapSeconds: 180,
  },

  counts: { dummies: 5 },   // AI dummy hiders alongside the player
};
