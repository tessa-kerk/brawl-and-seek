# Brawl & Seek — art generation log (Session 2b)

Every paid image generation, with estimated cost + running total. Model: OpenAI **gpt-image-2**.
Cost model: image output tokens @ $40/1M → high 1024² ≈ $0.17 · high 1536×1024 ≈ $0.25 · medium 1024² ≈ $0.04 · low ≈ $0.01.
Fidelity rule: brawler sprites generated with the official Fankit full-body render as `--ref`. Reference images live in the session scratchpad (outside the vault) — no Supercell pixels in the build.

| # | Asset | Size / qual | n | Est. $ | Running $ | Verdict |
|---|---|---|---|---|---|---|
| — | *(environment batch — skirt, walls, floor, water)* | | | | | |
| 1 | World skirt (repaint-site surround) | 1536×1024 high | 2 | $0.50 | **$0.50** | ✅ chose skirt-1 (cleaner frame, darker centre); skirt-2 kept as backup |
| 2 | Floor texture (muted navy + streaks + flecks) | 1024² high | 1 | $0.17 | **$0.67** | ✅ muted, low-contrast, brawlers pop |
| 3 | Water / teal-paint surface | 1024² high | 1 | $0.17 | **$0.84** | ✅ glossy teal, ripple stays procedural |
| — | Wall drum / crate — `--transparent` rejected by model | — | 2 | $0.00 | $0.84 | ⚠️ API: transparent unsupported; no charge |
| 4 | Wall: paint drum | 1024² high (green→cutout) | 1 | $0.17 | **$1.01** | ✅ clean cutout, no halo on navy |
| 5 | Wall: half-painted crate | 1024² high (green→cutout) | 1 | $0.17 | **$1.18** | ✅ clean cutout |
| — | *(map redirect 18-07: recreated real Spots-of-Yore section replaces the invented v14 layout; floor/water/drum/crate above are REUSED as-is on the new grid — no re-spend)* | | | | | |
| 6 | Bush cluster (new 4th camo surface, Tessa's ruling) | 1024² high (blue→cutout) | 2 | $0.34 | **$1.52** | ✅ picked comp 2 (rounder, more Brawl-authentic dome silhouette); clean cutout, no halo |
