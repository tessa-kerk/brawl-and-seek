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

  /* The universal Tag — a FIRED PROJECTILE, not a touch (Concept Brief v3.2 §104).
   * Being seen ends in a committed shot, not an outrun-and-touch marathon.
   * Hitting any brawler — camouflaged or visibly running — is the find. A tag
   * that hits nothing, or a wall, is the wrong tag and costs the same 30. So
   * seekers commit to shots instead of spraying, and walls double as chase cover. */
  tag: {
    // --- CANON (Concept Brief v3.2) ---
    range: 3.0,             // tiles
    speedMult: 2.0,         // × the seeker's base move speed
    cooldown: 0.75,         // s between shots
    // --- PROTOTYPE-TUNED (thin hitbox + bot aim; not canon) ---
    projRadius: 0.07,       // tiles — thin
    hitRadius: 0.30,        // tiles — a brawler's effective hitbox against the tag
    fireAt: 0.92,           // fire once within this fraction of range
    botAimError: 0.13,      // radians of aim jitter
    botLeadNoise: 0.42,     // fractional error when leading a runner (juking beats it)
    botFixNoise: 0.85,      // tiles of error on a ripple fix at max range; sharpens as it closes…
    fixFloor: 0.55,         // …but never below this fraction of the error. A close shot is still
                            // a commitment, not a certainty — that's what makes misses cost 30.
  },

  seeker: {
    // --- CANON (Tessa) ---
    health: 100,
    wrongTagCost: 30,       // three mistakes survivable; the fourth -> spectator
    speedBoost: 0.15,       // +15% while <= 2 seekers, fading as the pack grows
    // --- PROTOTYPE-TUNED (not canon; balanced for this small 10x9 arena) ---
    baseSpeed: 3.7,         // tiles/s (player is 4.2, so a running hider can break away)
    visionRadius: 2.3,      // tiles — sees UNHIDDEN hiders (being caught in the open is bad,
                            // but not instantly fatal from across the arena)
    rippleRadius: 1.15,     // tiles — a mover this close to a hidden hider trips the tell
    noticeChance: 0.62,     // per second the bot reads its own ripple, BEFORE the speed penalty
    sprintBlindness: 0.72,  // a seeker at full sprint loses this much of its notice chance —
                            // "slow down and watch and you see it; sprint past and you don't"
    noticeNoise: 0.85,      // tiles of error on a ripple fix — a ripple says "near here", not "here".
                            // This is what makes wrong tags (and the -30 health rule) actually happen.
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
