/* Brawl & Seek — the round loop. Owns the phase clock, the anti-camping score
 * (the rule the whole mode balances on), the escalating repaint time, and how a
 * round ends. All numbers come from TUNING; none are invented here.
 *
 * The camping rule, on screen and legible: your score ticks up while hidden, the
 * rate halves the longer you sit in one spot (floor 2/s), and repainting >= 3
 * tiles away banks +100 and resets the rate. The best play is the daring run. */
(function () {
  const T = CFG.tile;

  const R = {
    phase: 'hide',      // hide -> seek -> over
    elapsed: 0,
    overT: 0,           // seconds since the round ended (drives the SPOTTED! stamp)
    result: null,
    foundCount: 0,
    // player score state
    score: 0, rate: TUNING.hider.scoreRate, camp: 0,
    lastHideSpot: null, bonusFlash: 0,
    _wasHidden: false,

    hidersAlive() { return Hiders.alive().length + (Player.found ? 0 : 1); },
    totalSeconds() { return TUNING.round.hidePhase + TUNING.round.seekPhase; },
    timeLeft() { return Math.max(0, this.totalSeconds() - this.elapsed); },
    seekTimeLeft() { return Math.max(0, this.totalSeconds() - this.elapsed); },
    hideTimeLeft() { return Math.max(0, TUNING.round.hidePhase - this.elapsed); },

    // Repaint escalates as the round thins out; always shown on the ticker.
    repaintTime() {
      const P = TUNING.repaint;
      if (this.hidersAlive() <= 2) return P.whenTwoRemain;
      if (this.foundCount >= 3) return P.afterThreeFound;
      return P.base;
    },

    reset() {
      this.phase = 'hide'; this.elapsed = 0; this.overT = 0; this.result = null;
      this.foundCount = 0; this.score = 0; this.rate = TUNING.hider.scoreRate;
      this.camp = 0; this.lastHideSpot = null; this.bonusFlash = 0; this._wasHidden = false;
      Player.reset(); Hiders.reset(); Seekers.reset();
      STATE.repaintTime = this.repaintTime();
    },

    onPlayerHidden() {
      const H = TUNING.hider;
      if (this.lastHideSpot && AI.tileDist(Player.x, Player.y, this.lastHideSpot.x, this.lastHideSpot.y) >= H.repositionMinTiles) {
        this.score += H.repositionBonus; this.camp = 0; this.bonusFlash = 1.4;
      }
      this.lastHideSpot = { x: Player.x, y: Player.y };
      Player.hideSpot = { x: Player.x, y: Player.y };
    },

    onFound(h, seeker) {
      if (h === Player) {
        Player.found = true; Player.foundAt = this.elapsed;
        Player.hideSpot = { x: Player.x, y: Player.y };
        this.foundCount++;
        this.end('spotted');
        return;
      }
      h.found = true; h.foundAt = this.elapsed;
      h.hideSpot = { x: h.x, y: h.y };
      this.foundCount++;
      FX.breakBurst(h.x, h.y - h.r * 0.2);
      Seekers.spawnAt(h.x, h.y);            // found hiders become seekers — the snowball
      if (this.hidersAlive() === 0) this.end('all-found');
    },

    end(reason) {
      if (this.phase === 'over') return;
      this.phase = 'over'; this.overT = 0;
      const rows = [];
      const push = (e, isPlayer) => rows.push({
        name: isPlayer ? 'YOU' : e.name, col: e.col, isPlayer,
        x: (e.hideSpot || e).x, y: (e.hideSpot || e).y,
        found: !!e.found,
        survived: e.found ? (e.foundAt != null ? e.foundAt : this.elapsed) : this.elapsed,
        score: Math.round(isPlayer ? this.score : e.score),
      });
      push(Player, true);
      for (const d of Hiders.list) push(d, false);
      rows.sort((a, b) => b.score - a.score);
      this.result = {
        reason,                                   // 'spotted' | 'timeout' | 'all-found'
        survived: !Player.found,
        playerScore: Math.round(this.score),
        playerTime: Player.found && Player.foundAt != null ? Player.foundAt : this.elapsed,
        rows,
      };
    },

    update(dt) {
      if (this.phase === 'over') { this.overT += dt; return; }

      this.elapsed += dt;
      if (this.phase === 'hide' && this.elapsed >= TUNING.round.hidePhase) this.phase = 'seek';
      STATE.repaintTime = this.repaintTime();
      if (this.bonusFlash > 0) this.bonusFlash -= dt;

      // player score — the camping rule
      const H = TUNING.hider;
      if (Player.hidden && !Player.found) {
        if (!this._wasHidden) this.onPlayerHidden();
        this.camp += dt;
        this.rate = Math.max(H.rateFloor, H.scoreRate * Math.pow(0.5, this.camp / H.rateHalfLife));
        this.score += this.rate * dt;
      }
      this._wasHidden = Player.hidden;

      if (this.elapsed >= this.totalSeconds()) this.end('timeout');   // hiders win on the clock
    },
  };

  window.Round = R;
})();
