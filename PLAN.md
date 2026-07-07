# Brawl & Seek — build plan & progress

## ⚡ CURRENT STATE — read this first (written 07-07-2026, Session 2)

**WHERE WE ARE:** **Milestone 1 is DONE and awaiting Tessa's sign-off (stop-and-show-me gate).** The repo scaffold is up and the core mechanic — the one-second paint fill and the camo break — is built, playable, and QA'd against real rendered output at desktop (1280×720) and phone (390×844) width. Nothing past M1 is built yet (no seeker, ticker, SPOTTED!, reveal, or Map Maker view).

**WHAT M1 PROVES (verified in real Chrome, not from numbers):**
- **The paint fill.** Stand still on/against a qualifying surface and, over `repaintTime` (1s default), a **magenta wet-paint edge sweeps left→right** across the brawler; behind the edge it repaints to the surface colour and fades to a hidden silhouette. A magenta progress ring + a "Painting in…" chip read the state. Fully hidden → the brawler all but vanishes ("strong, not perfect", `camoAlpha` floor) and a soft **teal you-are-here ripple** keeps the player oriented. Verified against wall-blend, water-blend and mid-sweep frames.
- **The camo break.** Any real movement instantly resets the fill and **flings a magenta paint-burst** off the body; name tag + health bar return. Verified live (keyboard-driven), not just posed.
- **Feels right on desktop AND phone.** Fit-contained arena; the sweep, ring, and vanish all read clearly at 390px. (Phone has generous vertical letterbox — a follow-camera could tighten it; deferred to M4.)
- **Live checks pass:** movement, wall collision (hard stop), the 1s timer → hidden, break-on-move → un-hidden, and the `repaint=0.5s` toggle (M3 pre-wire). **Zero console errors.**

**ARCHITECTURE (multi-file, data-driven — no colours/maps hard-coded in logic):**
- `src/config.js` — `CFG`: the locked v1.0 palette + gameplay tuning (repaintTime, speed, camoAlpha).
- `data/arena.js` — `ARENA`: the tile grid (10×9) + surface palette. Map geometry lives here only.
- `src/input.js` — `Input`: WASD/arrows + a floating touch thumb-stick → one normalised move vector.
- `src/arena.js` — `Arena`: grid parse, per-axis AABB collision, **camoSurface()** (wall > water > floor priority), and the chunky-Brawl tile render (beveled walls, checker floor, aqua pool).
- `src/fx.js` — `FX`: the paint break-burst, the camo-settle ring, the you-are-here pulse (all reduce-motion aware).
- `src/player.js` — `Player`: movement + the camo state machine (still → progress → hidden; move → break).
- `src/render.js` — `Render`: the paint-fill money shot (sweep clip, wet edge, ring, fading name tag/health).
- `src/game.js` — `STATE` + boot + fit-to-viewport transform + main loop + a **debug API** (`Game.pose/pause/setRepaint`) the capture rig uses to freeze exact frames.

**BUILD STAMP RITUAL (every commit):** bump `CFG.BUILD.n` in `src/config.js` AND find-replace `?v=<old>`→`?v=<new>` across `index.html` (currently **`?v=1`**, BUILD n:1). The top-right title stamp (`v1 · M1`) is the witness — if it doesn't match, a script is cached stale.

**QA METHOD (reused every session):** Playwright driving **system Chrome via `channel="chrome"`** — no `playwright install` needed. `Game.pose({col,row,progress,facing})` freezes a deterministic frame; screenshot at exact device viewports; **read the real frames back and judge the picture, never the numbers.** Scripts live in the session scratchpad for M1; a permanent rig lands in `tools/` at the capture session (Session 3). Do **not** use the preview MCP's pixel screenshot (it hung at harness level on the Elixir Hour build).

**NEXT — Milestone 2 (after Tessa signs off M1):** one bot **seeker** patrolling; a few **AI dummy hiders**; the on-screen **score ticker** (survival + reposition bonus − camp decay); the **proximity ripple tell** when a mover passes a hidden brawler; **wrong-tag → SPOTTED! stamp**; **end-of-round reveal map** showing every hiding spot. A full round must run **under 90 seconds**.

**NEEDS TESSA:**
- **M1 sign-off gate.** Play it / watch the captures and confirm the paint fill + camo break "feel right" before M2 starts.
- Nothing else blocking. Original art is programmatic (a vector brawler + tile shapes) — no Supercell assets anywhere; a hero brawler illustration can replace the token later without touching logic.

**SOURCE OF TRUTH:** `../Concept Brief.md` (v2) wins on any design fact; `../Project Brief.md` is the process/visual master. This PLAN + `CLAUDE.md` track the build; the briefs win on conflict.

---

## Milestones (from the Session 2 kickoff)

- [x] **M0 — Scaffold.** Repo, folders, self-hosted fonts (Lilita One / Nunito Sans / Caveat), visual-system CSS tokens, `PLAN.md`, `CLAUDE.md`, `README.md`, `.gitignore`.
- [x] **M1 — Paint fill + camo break** feel right on desktop AND phone width. *(← show-me gate; awaiting sign-off.)*
- [ ] **M2 — Round loop.** Seeker bot, AI dummy hiders, score ticker, proximity-ripple tell, SPOTTED! stamp, reveal map. Round < 90s.
- [ ] **M3 — Map Maker view.** The same map in an editor frame with three live toggles: camo surfaces (walls/floor/water), repaint time (0.5/1/2s), ripple tell on/off. Flip a toggle → the mechanic changes live.
- [ ] **M4 — Polish.** Mobile controls, `prefers-reduced-motion` full pass, performance pass.

## Log
- **07-07-2026** — Session 2. Scaffolded the repo and shipped M1: the one-second paint fill + camo break, playable and QA'd against real rendered frames at desktop and phone width. Public repo created, pushed. Held at the M1 stop-and-show-me gate.
