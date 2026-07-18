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

| — | *(SECOND redo, 18-07: wall/bush/floor regenerated from the Fandom wiki's "Spots of Yore" map render — a source class later found to be unconfirmed against true in-game rendering. Tessa's own real screenshot arrived mid-flight and superseded this batch before it could be reviewed. Logged honestly — not used, not hidden.)* | | | | | |
| 11 | Wall prop (wiki-referenced, SUPERSEDED before use) | 1024² high, `--ref` (blue→cutout) | 2 | $0.34 | **$3.22** | ⛔ superseded — Tessa's real screenshot arrived before review; not wired |
| 12 | Bush (wiki-referenced, SUPERSEDED before use) | 1024² high, `--ref` (blue→cutout) | 2 | $0.34 | **$3.56** | ⛔ superseded — same reason |
| 13 | Floor (wiki-referenced, SUPERSEDED before use) | 1024² high, `--ref` | 2 | $0.34 | **$3.90** | ⛔ superseded — same reason |

**Running total: $3.90.** These 3 assets were never wired into the game (still using the v16 faithful set, itself now paused pending Tessa's new map pick). No further generation until she picks a current-rotation map and the PM clears the next batch — see `Research Dossier — Real In-Game References.md` and PLAN.md.

| — | *(ACID LAKES BATCH, 18-07-2026, build v24 — PM-cleared estimate, $2.72–$3.06 projected. Reference class, stated honestly: genuine current-skin "Showdown Mortuary" gameplay VIDEO was searched for directly [2 focused YouTube passes] and not found within reasonable effort — the wiki's own verified-direct sources were used instead: `Acid_Lakes-Map.png` [the same render the grid was traced from] for shape/base-hue, and `Showdown_Mortuary-Environment.png` [the wiki's own environment mood banner — dark graveyard, acid-green glow] for the current skin's actual atmosphere, blended in the prompts. One real OLDER-skin gameplay frame [`walkthrough_part32`, a desert-theme match] was used only to confirm the 3D camera-tilt/chunky-render STYLE, not colour. This mixed sourcing is disclosed, not silently presented as footage.)* | | | | | |
| 14 | Wall block (spiky teal-capped stone, footage/wiki-ref) | 1024² high, `--ref` (green→cutout) | 2 | $0.34 | **$4.24** | ⛔ SUPERSEDED before use — comp had an unavoidable green-glow accent that keyed out with the green screen (self-inflicted prompt/key conflict) |
| 15 | Wall block v2 — same issue | 1024² high, `--ref` (green→cutout) | 1 | $0.17 | **$4.41** | ⛔ SUPERSEDED — same fringe issue, confirmed on both comps before switching key colour |
| 16 | Wall block v3 (glow removed from prompt, magenta→cutout) | 1024² high, `--ref` | 2 | $0.34 | **$4.75** | ✅ picked comp 1; clean cutout, no fringing — WIRED |
| 17 | Floor (deep violet checker + acid-green glow patches, wiki-ref) | 1024² high, `--ref`, no cutout (full-bleed texture) | 2 | $0.34 | **$5.09** | ✅ picked comp 1 (comp 2's glow read too diffuse, lost checker legibility) — WIRED |
| 18 | Water (glowing acid-green organic surface, wiki-ref) | 1024² high, `--ref`, no cutout (full-bleed texture) | 2 | $0.34 | **$5.43** | ✅ picked comp 1 (comp 2's finer cell pattern read noisier at in-game tile scale) — WIRED |
| 19 | Power-Cube spawn prop (orange crate + lock, wiki-ref) | 1024² high, `--ref` (green→cutout) | 2 | $0.34 | **$5.77** | ⛔ SUPERSEDED — the prop's own green power-cube gem icon keyed out with the green screen, same self-inflicted conflict as #14 |
| 20 | Power-Cube prop v2 (green gem swapped to yellow bolt in the prompt, magenta→cutout) | 1024² high, `--ref` | 2 | $0.34 | **$6.11** | ✅ picked comp 1; clean cutout — WIRED, new `Arena.drawProps()` decal system (two traced spawn positions, col3/row2 and col2/row3) |
| 21 | Tag icon (Belle "Spotter"-referenced: magenta crosshair + gold badge, dark navy circle) | 1024² high, no ref (no verified icon image found — concept-level match from text sources, see Art Inventory.md) | 2 | $0.34 | **$6.45** | ✅ picked comp 1; clean cutout — WIRED to `assets/ui/tag_icon.png`, not yet displayed anywhere in UI (icon asset ready; no seeker-side HUD surface exists yet to show it) |
| 22 | Camo-badge paint-brush glyph | 1024² high, no ref | 2 | $0.34 | **$6.79** | ✅ picked comp 1; clean cutout — WIRED, swaps the 🖌 emoji placeholder in the bottom-right badge (`game.js`, non-breaking: falls back to the emoji if the image fails to load) |

**Running total: $6.79** against the $8 ceiling ($1.21 headroom). Two estimate line-items intentionally NOT spent, both defensible calls made mid-batch, not silent trims: **(a) joystick ring/knob texture** — checked Tessa's own reference screenshot again before spending on this; real Brawl's joystick is a plain, minimal translucent shape with no painted texture, so "faithful" here means staying plain, not adding art that would be a fidelity regression. The current CSS ring already matches. **(b) the contingent bottom-right partial props** — stayed genuinely gated on footage confirmation as scoped; none was found, so this line is honestly skipped, not charged. **Queued, not spent:** the Tag hit-mark/target-marker overlay (the projectile-impact visual) — the icon itself is done and wired; the in-flight hit-mark treatment is real remaining scope for a follow-up pass, flagged in PLAN.md rather than rushed into this batch.
