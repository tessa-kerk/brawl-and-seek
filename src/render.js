/* Brawl & Seek — the player render, i.e. the M1 money shot: the one-second
 * paint fill. A magenta paint edge sweeps left→right across the brawler; behind
 * the edge it is repainted to the surface colour and fades to a hidden
 * silhouette; the name tag + health bar fade with the fill. All world-space. */
(function () {
  const P = CFG.palette;

  // ---- The brawler silhouette (shared by normal + camo so the shape matches) -
  function bodyPath(ctx, cx, cy, r) {
    const w = r * 1.72, h = r * 2.02;
    Arena.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, r * 0.86);
  }

  function drawNormal(ctx, cx, cy, r, facing) {
    // feet
    ctx.fillStyle = '#E0A800';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.45, cy + r * 0.92, r * 0.34, r * 0.24, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r * 0.45, cy + r * 0.92, r * 0.34, r * 0.24, 0, 0, 7); ctx.fill();
    // body
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, '#FFD84A'); g.addColorStop(1, P.yellow);
    bodyPath(ctx, cx, cy, r); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = r * 0.17; ctx.strokeStyle = P.ink; ctx.stroke();
    // cheek highlight
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#FFF0B0';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.42, cy - r * 0.5, r * 0.32, r * 0.42, -0.4, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    // eyes
    const ex = facing * r * 0.16;
    for (const s of [-1, 1]) {
      ctx.fillStyle = P.chalk;
      ctx.beginPath(); ctx.ellipse(cx + ex + s * r * 0.34, cy - r * 0.18, r * 0.22, r * 0.3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(cx + ex + s * r * 0.34 + facing * r * 0.05, cy - r * 0.12, r * 0.12, 0, 7); ctx.fill();
    }
  }

  function drawCamo(ctx, cx, cy, r, color, extraAlpha) {
    // Same silhouette, painted the surface colour, "strong not perfect" opacity.
    ctx.globalAlpha = CFG.camoAlpha * extraAlpha;
    bodyPath(ctx, cx, cy, r); ctx.fillStyle = color; ctx.fill();
    ctx.globalAlpha = CFG.camoAlpha * extraAlpha * 1.3;
    ctx.lineWidth = r * 0.1; ctx.strokeStyle = 'rgba(9,16,36,.8)'; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawPlayer(ctx, t) {
    const pl = Player, cx = pl.x, cy = pl.y, r = pl.r;
    const p = pl.progress;

    // ground shadow, fading out as the paint fills (a shadow is a giveaway)
    ctx.globalAlpha = (1 - p) * 0.28; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 1.12, r * 0.8, r * 0.3, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;

    if (pl.hidden) {
      // Fully hidden: just the faint surface-matched silhouette + you-are-here.
      drawCamo(ctx, cx, cy, r, pl.camo.color, 1);
      FX.youAreHere(ctx, cx, cy + r * 0.1, t);
      return;
    }

    const left = cx - r * 1.12, right = cx + r * 1.12;
    const sweepX = left + p * (right - left);

    if (p <= 0) {
      drawNormal(ctx, cx, cy, r, pl.facing);
    } else {
      // Right of the wet edge: still the normal brawler.
      ctx.save();
      ctx.beginPath(); ctx.rect(sweepX, cy - r * 2, right - sweepX + r, r * 4); ctx.clip();
      drawNormal(ctx, cx, cy, r, pl.facing);
      ctx.restore();
      // Left of the wet edge: already painted in (ramp opacity up as it settles).
      ctx.save();
      ctx.beginPath(); ctx.rect(left - r, cy - r * 2, sweepX - left + r, r * 4); ctx.clip();
      drawCamo(ctx, cx, cy, r, pl.camo.color, 0.55 + 0.45 * p);
      ctx.restore();
      // The wet magenta paint edge.
      drawWetEdge(ctx, sweepX, cy, r, t);
    }

    if (p > 0 && p < 1) drawRing(ctx, cx, cy, r, p);
    drawNameTag(ctx, cx, cy, r, pl);
  }

  function drawWetEdge(ctx, x, cy, r, t) {
    const wob = STATE.reduceMotion ? 0 : Math.sin(t * 12) * r * 0.05;
    ctx.save();
    ctx.shadowColor = P.magenta; ctx.shadowBlur = 12;
    ctx.fillStyle = P.magenta;
    Arena.roundRect(ctx, x - r * 0.16, cy - r * 1.15 + wob, r * 0.32, r * 2.25, r * 0.16); ctx.fill();
    ctx.shadowBlur = 0;
    // bright core
    ctx.fillStyle = '#FF8CC6';
    Arena.roundRect(ctx, x - r * 0.06, cy - r * 1.05 + wob, r * 0.12, r * 2.05, r * 0.06); ctx.fill();
    // a couple of drips
    if (!STATE.reduceMotion) {
      ctx.fillStyle = P.magenta; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(x, cy + r * 1.2 + (t * 40 % 12), r * 0.12, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawRing(ctx, cx, cy, r, p) {
    const rad = r * 1.62;
    ctx.save();
    ctx.globalAlpha = p < 0.9 ? 0.9 : (1 - p) * 9;   // fade the ring out as it completes
    ctx.strokeStyle = 'rgba(23,27,51,.55)'; ctx.lineWidth = r * 0.2;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = P.magenta; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawNameTag(ctx, cx, cy, r, pl) {
    const a = pl.nameAlpha();
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = a;
    const label = 'YOU', fs = r * 0.62;
    ctx.font = `${fs}px 'Lilita One', sans-serif`;
    const tw = ctx.measureText(label).width;
    const padX = r * 0.34, boxW = tw + padX * 2, boxH = fs * 1.34;
    const bx = cx - boxW / 2, by = cy - r * 2.35;
    // health bar (above the pill)
    const hbW = boxW * 0.92, hbX = cx - hbW / 2, hbY = by - r * 0.4, hbH = r * 0.24;
    Arena.roundRect(ctx, hbX, hbY, hbW, hbH, hbH / 2); ctx.fillStyle = 'rgba(9,16,36,.85)'; ctx.fill();
    Arena.roundRect(ctx, hbX + 1.5, hbY + 1.5, hbW - 3, hbH - 3, (hbH - 3) / 2); ctx.fillStyle = '#3BD16B'; ctx.fill();
    // name pill
    Arena.roundRect(ctx, bx, by, boxW, boxH, boxH * 0.32);
    ctx.fillStyle = 'rgba(20,23,43,.9)'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(246,244,239,.25)'; ctx.stroke();
    // little pointer
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.18, by + boxH); ctx.lineTo(cx + r * 0.18, by + boxH); ctx.lineTo(cx, by + boxH + r * 0.24);
    ctx.closePath(); ctx.fillStyle = 'rgba(20,23,43,.9)'; ctx.fill();
    // text
    ctx.fillStyle = P.chalk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, by + boxH / 2 + fs * 0.06);
    ctx.restore();
  }

  window.Render = { drawPlayer };
})();
