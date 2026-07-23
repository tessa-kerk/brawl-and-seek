# Brawl & Seek — build rules (read me first, every session)

*This file belongs at the root of the `game/` repo. Claude Code reads it automatically. It is separate from the Knowledge Base vault's `claude.md`.*

You are building **Brawl & Seek**, a playable browser prototype of a hide-and-seek event mode for Brawl Stars: hiders paint themselves into the arena, then the same camouflage ships into Map Maker as a creator toolkit. The prototype is the asset engine — every capture in the case study, landing page and deck is shot from it.

## Source of truth
- `../Concept Brief.md` (v2) is the **design master** — every mechanic, number and rule comes from it and it **wins on any design fact**. `../Project Brief.md` is the **process/visual master** (pipeline, acceptance criteria, the LOCKED visual system). Re-read both after compacting.
- Keep **`PLAN.md`** current — especially the **⚡ CURRENT STATE** block at the top. Tick milestones, note what changed and why.
- These parent docs live **outside** the repo and must **never** be committed (see `.gitignore`). Never `git add` anything from `../`.

## What to build (v1)
- Web, single-page: **HTML + CSS + vanilla JavaScript, no build step.** Gameplay composition is landscape. Mobile portrait self-rotates full bleed only when orientation is portrait with a coarse primary pointer and no primary hover; fine-pointer desktop windows never rotate and instead receive a centred upright landscape surface. `manifest.webmanifest` remains `"orientation": "any"`. Permanent tests cover desktop capability contexts and mobile portrait/landscape.
- **Two views, one build:** (1) **Event view** — play a hider; move, hold still on a surface to paint in, move to break camo; one bot seeker patrols; AI dummy hiders; on-screen score ticker; wrong-tag → SPOTTED!; end-of-round reveal map. (2) **Map Maker view** — the same map in an editor frame with live toggles: camo surfaces (walls/floor/water/**bushes** — added art pass 18-07-2026, a real Brawl hiding verb, not decoration; priority wall > bush > water > floor), repaint time (0.5/1/2s), ripple tell on/off.
- **Multi-file, data-driven:** palette + tuning in `src/config.js`; map geometry in `data/`; no colours or map data hard-coded in logic.
- A **full round must run under 90 seconds** so captures stay clip-length.

## The LOCKED visual system (v1.0, 07-07-2026 — do not invent colours)
| Role | Name | Hex |
|---|---|---|
| Background | Night Navy | `#1E2340` |
| Accent / display / the player | Brawl Yellow | `#FFC800` |
| The paint (camo motif) | Paint Magenta | `#FF4FA0` |
| The tell (ripple / you-are-here) | Ripple Teal | `#35E0D0` |
| Text on dark | Chalk White | `#F6F4EF` |
| Text on light / outlines | Ink | `#14172B` |

Type: **display = Lilita One** (the Brawl-brand face), **body = Nunito Sans**, **accent = Caveat**. All self-hosted in `assets/fonts/` (woff2). Three carry-across motifs, all from the mechanics: the **one-second paint fill** (magenta swipe), the **SPOTTED! stamp** (display type, tilted ~8°, yellow on magenta), the **proximity ripple** (soft teal ring). Governing rule: **it must read as Brawl Stars / Supercell at a glance.**

## Acceptance criteria (QA against real rendered output, never against numbers)
The paint fill is visible and satisfying at a glance; moving obviously breaks camo; the ripple tell reads without explanation; the ticker is legible; playable at 360px **landscape**; `prefers-reduced-motion` gets a static-friendly version; a full round takes under 90 seconds.

**QA method:** Playwright driving **system Chrome via `channel="chrome"`** (no `playwright install` needed). Use `Game.pose(...)` / `Game.pause()` to freeze deterministic frames, screenshot at exact device sizes, and **read the frames back** — judge the picture. Do not use the preview MCP's pixel screenshot (it hung at harness level on the Elixir Hour build).

## ⚖️ STANDING RULE — verification oracles must be independent of the code under test
**Any sweep, sim or test whose expected-value oracle shares logic with the implementation does not count as proof.** Established 07-07-2026 after two failed fix attempts: a collision "escape sweep" decided which directions were *free* by calling the very `collide()` function it was testing. Probe and actual agreed, the sweep reported "0 stuck", and the bug shipped twice to Tessa's device.

- Derive expected values from an **independent source of truth** — the raw data (e.g. the tile grid), a hand-computed table, a second implementation, or geometry — never from the function under test.
- The collision proof that finally worked: oracle = `box_overlaps_solid()` computed **straight from the grid in Python**, asserting two invariants (never end inside a wall; if an axis is geometrically free it must move). 5,968 cases, independent of `collide()`.
- **Corollary: a passing sim is never sign-off.** Tessa's device recording is the judge for anything she can feel. Say plainly what a sim does and does not prove.

## 🔧 STANDING RULE — `?debug=1` must keep working in every future build
The on-screen debug overlay (`src/debug.js`) is the instrument that found the real bug. Keep it functional and current: raw active touch points, stick anchor + vector, intended vs applied velocity, collision-blocked axes, `preventDefault` success, `touch-action`, `visualViewport`. When you add systems (seeker, score, round state), **extend the overlay to expose them too.** `?joystick=fixed` also stays.

## Art direction (FINAL, 07-07-2026 — supersedes the earlier hybrid note; nothing to build yet, just don't architect against it)
The art pass follows the **BrawlHouse workflow**:
1. **Check the official Supercell Fankit (fankit.supercell.com) FIRST for every asset**, and use it **unmodified** wherever the quality is up to par.
2. Only where official assets are **missing or below par**, generate **our own fan art of ACTUAL brawlers in Brawl Stars' art style** (recognisable characters) — with **our own original backgrounds and arena tiles**.

**Goal: the prototype reads as Brawl Stars art the way Elixir Hour reads as Clash Royale art.**

**Hard lines (unchanged, never move):**
- **No extracted game files or sprite rips.** Fankit + our own art only.
- Every build and capture keeps the notice *"This material is unofficial and is not endorsed by Supercell. For more information see Supercell's Fan Content Policy: www.supercell.com/fan-content-policy"* **plus a small `CONCEPT` label in the game UI** — nothing can pass as a real in-game screenshot.

Keep the renderer **swap-friendly**: `render.js` `drawBrawler` and `arena.js` tiles are drawn programmatically and must stay trivially replaceable with richer sprites without touching game logic.

## Do not
- Do not rip, extract, or reproduce any Supercell game file, sprite, sound or copy. (Fankit assets used unmodified are allowed per the art direction above.)
- Do not oversize the map (a Meccha lesson): keep it compact and legible.
- Do not commit the parent folder's private design docs.

## Always
- Keep the **"Fan concept by Tessa Kerk · not affiliated with Supercell"** notice visible; name Supercell's Fan Content Policy in any credits/README.
- Every PM-approved runnable milestone gets concise, public-facing commit(s) and is published to the phone-playable GitHub Pages URL. Keep internal directives, evidence retries and budget discussion outside the public repository. Refresh README visuals only once the final build and final captures exist; do not churn interim screenshots.
- Bump the build stamp (`CFG.BUILD.n` + the `?v=` token) for each runnable milestone.
- **Respect the stop-and-show-me gates** (M1, then M2/M3/M4). Do not blast past a gate — get it solid, show Tessa, wait.
- Anything Tessa signs off is a **regression surface**: re-render approved states and diff before shipping a change to them; flag visual changes to approved surfaces, never ship silently.
