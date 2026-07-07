# Brawl & Seek — build rules (read me first, every session)

*This file belongs at the root of the `game/` repo. Claude Code reads it automatically. It is separate from the Knowledge Base vault's `claude.md`.*

You are building **Brawl & Seek**, a playable browser prototype of a hide-and-seek event mode for Brawl Stars: hiders paint themselves into the arena, then the same camouflage ships into Map Maker as a creator toolkit. The prototype is the asset engine — every capture in the case study, landing page and deck is shot from it.

## Source of truth
- `../Concept Brief.md` (v2) is the **design master** — every mechanic, number and rule comes from it and it **wins on any design fact**. `../Project Brief.md` is the **process/visual master** (pipeline, acceptance criteria, the LOCKED visual system). Re-read both after compacting.
- Keep **`PLAN.md`** current — especially the **⚡ CURRENT STATE** block at the top. Tick milestones, note what changed and why.
- These parent docs live **outside** the repo and must **never** be committed (see `.gitignore`). Never `git add` anything from `../`.

## What to build (v1)
- Web, single-page: **HTML + CSS + vanilla JavaScript, no build step.** Runs by opening `index.html`; must be **fully responsive down to 360px phone width.**
- **Two views, one build:** (1) **Event view** — play a hider; move, hold still on a surface to paint in, move to break camo; one bot seeker patrols; AI dummy hiders; on-screen score ticker; wrong-tag → SPOTTED!; end-of-round reveal map. (2) **Map Maker view** — the same map in an editor frame with three live toggles: camo surfaces (walls/floor/water), repaint time (0.5/1/2s), ripple tell on/off.
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
The paint fill is visible and satisfying at a glance; moving obviously breaks camo; the ripple tell reads without explanation; the ticker is legible; playable at 360px; `prefers-reduced-motion` gets a static-friendly version; a full round takes under 90 seconds.

**QA method:** Playwright driving **system Chrome via `channel="chrome"`** (no `playwright install` needed). Use `Game.pose(...)` / `Game.pause()` to freeze deterministic frames, screenshot at exact device sizes, and **read the frames back** — judge the picture. Do not use the preview MCP's pixel screenshot (it hung at harness level on the Elixir Hour build).

## Do not
- Do not use any Supercell asset, sprite, sound or copy. Art is **original, Brawl-adjacent** per the visual system (a programmatic vector brawler + tile shapes for now; a hero illustration can replace the token later without touching logic).
- Do not oversize the map (a Meccha lesson): keep it compact and legible.
- Do not commit the parent folder's private design docs.

## Always
- Keep the **"Fan concept by Tessa Kerk · not affiliated with Supercell"** notice visible; name Supercell's Fan Content Policy in any credits/README.
- Commit after each runnable milestone and **push to GitHub**. Bump the build stamp (`CFG.BUILD.n` + the `?v=` token) every commit.
- **Respect the stop-and-show-me gates** (M1, then M2/M3/M4). Do not blast past a gate — get it solid, show Tessa, wait.
- Anything Tessa signs off is a **regression surface**: re-render approved states and diff before shipping a change to them; flag visual changes to approved surfaces, never ship silently.
