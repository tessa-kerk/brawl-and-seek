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
| 6 | Bush cluster (new 4th camo surface, Tessa's ruling) | 1024² high (blue→cutout) | 2 | $0.34 | **$1.52** | ✅ picked comp 2 (rounder, more Brawl-authentic dome silhouette); clean cutout, no halo — SUPERSEDED below (see #10) |
| — | *(prop-fidelity redirect 18-07: Tessa rejected the whole generated set — "do not look like brawl stars assets" — regenerated all 4 world props reference-guided from Spots of Yore's own map render, cropped close-ups as `--ref`)* | | | | | |
| 7 | Wall block (faithful — coiled-cap wood crate, matches the real cluster) | 1024² high, `--ref` real crop (blue→cutout) | 2 | $0.34 | **$1.86** | ✅ picked comp 1; replaces the invented paint-drum/half-painted-crate pair |
| 8 | Floor (faithful — two-tone tan checker, matches the real map) | 1024² high, `--ref` real crop | 2 | $0.34 | **$2.20** | ✅ picked comp 1; restores the checker the earlier navy texture had lost |
| 9 | Water (faithful — flat cartoon blue, matches the real pool's fill) | 1024² high, `--ref` real crop | 2 | $0.34 | **$2.54** | ✅ picked comp 1 (comp 2 baked a non-tileable rounded-shape highlight, rejected); procedural rim recoloured navy→warm brown to match the real rim |
| 10 | Bush (faithful — flat 2-tone scalloped pattern, matches the real map, supersedes #6) | 1024² high, `--ref` real crop (blue→cutout) | 2 | $0.34 | **$2.88** | ✅ picked comp 1; the earlier 3D spiky bush read as generic-bush clipart, not Brawl's flat graphic language |

**Running total: $2.88** of the ~$5–8 envelope (PM confirmed ~$6.5 headroom before this batch). floor/water/wall/bush v1 assets superseded, not deleted — filed alongside skirt-1 for possible marketing/landing use.
