# Brawl & Seek — build plan & progress

## ⚡ CURRENT STATE — read this first (written 07-07-2026, Session 2)

**WHERE WE ARE:** **Milestone 1 is DONE and awaiting Tessa's sign-off (stop-and-show-me gate).** The repo scaffold is up and the core mechanic — the one-second paint fill and the camo break — is built, playable, and QA'd against real rendered output at desktop (1280×720) and phone (390×844) width. Nothing past M1 is built yet (no seeker, ticker, SPOTTED!, reveal, or Map Maker view).

**MOVEMENT FIX (build v2, 07-07) — from Tessa's mobile playtest.** Two issues found and fixed, both verified against real output (a scripted collision+input escape sweep over every wall-adjacent tile × 8 directions, AND frames from a scripted phone-width play recording):
- **Stuck after hiding.** Two real causes: (a) a *crawl band* — drags under ~14px moved ≤8px/130ms (oversized 46px throw + analog curve); (b) a genuine *multi-touch lock* — when the hide-finger lifted while a second finger was down, the stick went dead until all fingers lifted (the "takes multiple tries" bug on iPad). **Fix (input.js):** robust multi-touch (first finger drives, strays ignored, hand-off to a remaining finger on release — no more dead-lock), a shorter 34px throw, and a response curve (MIN_K 0.5) that gives real speed straight out of a 4px dead-zone.
- **Rough/sticky free-walking.** Not tile-snapping (movement was already continuous) — the crawl curve plus no easing. **Fix (player.js):** velocity smoothing (fast ~40ms attack, quick release) with velocity zeroed into any blocked axis so it never fights a wall.
- **Result (measured in sim):** escape sweep 0 stuck / 0 clip across 296 (tile,dir) cases; multi-touch handoff works; regression green; zero console errors.

**⚠️ v2 DID NOT HOLD ON DEVICE — approach changed (build v3, 07-07).** Tessa's second iPad video (after a hard refresh on v2) showed the *same class* of fault: pinned at the right wall, stick deflected, barely moving. **The lesson: the scripted synthetic-touch sweep is NOT iOS Safari ground truth — it passed while the device failed.** So per Tessa's rule (two targeted fixes = no third reasoning-patch), the approach changed:
- **Instrument, don't guess.** A debug overlay (`?debug=1`, `src/debug.js`) draws the ground truth on screen: raw active touch points, stick anchor + current vector, intended vs applied velocity, which axes collision blocked this frame, plus the iOS gotchas — `preventDefault` success, `touch-action`, and `visualViewport` offset. **Verification is now Tessa's device recording with the overlay on, not the sim.**
- **iOS-Safari touch-path hardening** (`input.js` + `main.css`): touch listeners moved to the **#stage element** with `{passive:false}` (element-level = reliably non-passive, so preventDefault actually stops iOS pan/pinch/double-tap-zoom); input state **rebuilt from the authoritative `event.touches`** every event (kills stale-identifier bugs after multi-touch); `touch-action:none` + `overscroll-behavior:none` on the surface; page pinned `position:fixed` (no rubber-band); `visualViewport` resize/scroll re-fits the canvas when the Safari toolbar shows/hides mid-round. Movement math (throw/curve/smoothing) left UNCHANGED so the overlay isolates whether plumbing was the fault.
- **Fallback ready — fixed-anchor joystick** (`?joystick=fixed`): a standard fixed base bottom-left, generous 12px dead-zone, NO floating re-anchor (the floating anchor's drifting neutral point is the prime suspect). Boring, always works. To be adopted as default if the overlay shows input is the fault or v3 still doesn't hold.
- **Build v3 is sound in sim** (overlay renders, both stick modes drive movement, keyboard intact, zero console errors) — but **that proves nothing about iOS; awaiting Tessa's `?debug=1` device recording as ground truth.**

**✅ ROOT CAUSE FOUND — it was COLLISION, not input (build v4, 07-07).** Tessa's two `?debug=1` recordings were the ground truth: at the stuck moment the panel read **`applied v (0,0)`, `blocked X:YES Y:YES` while she pushed up-left into open space** — the collision was falsely blocking BOTH axes and eating the whole move, pinning her in a 1-tile-wide corridor. The fault survived a full input-scheme swap (float→fixed), exonerating input. **Why the earlier "0 stuck" sweeps lied: my "open direction" oracle was computed with the same buggy `collide()`, so probe and actual agreed — circular validation.** The bug is platform-independent geometry, so it always reproduced; the sim just never *checked* it correctly.
- **Fix 1 — collision rewritten as decoupled move-and-slide** (`arena.js`): X moves and resolves against the **original** y-band `[py±h]`; Y then moves and resolves against the **resolved** x-band. A blocked axis can never eat the free axis; nothing reverts the whole move. (The old code built the X-pass row band from `py+dy`, so a diagonal near a corner let one axis's wall poison the other.)
- **Fix 2 — repaint gated on engagement, not displacement** (`player.js` + `Input.engaged()`): pushing against a wall (displacement can be zero) can never start a hide; only a genuinely idle stick does.
- **PROOF (platform-independent, real this time):** a geometric sweep whose oracle is **pure grid overlap, independent of `collide()`** — 746 positions × 8 directions (5,968 cases): **0 clips, 0 stuck** (X or Y). Integration: corridor push-up-into-wall now **slides 57px, no clip**; holding into a wall 1.2s keeps `progress 0.00` (no repaint); idle still hides; break still works; zero console errors. This is geometry, so it holds on iOS too.
- **PWA added** (`manifest.webmanifest` + apple-touch-icon + iOS standalone meta): "Add to Home Screen" opens fullscreen — no Safari tab/URL bar or browser gestures (Safari tab-switched mid-round in Clip 2). **Recommended way to play on phone.** Icons generated (paint-drop + ripple).
- **Verification for sign-off stays device-first:** Tessa records from the home-screen icon showing wall-contact → slide → clean escape, and no repaint while the stick is deflected.

**ART DIRECTION (decided 07-07 for the later art pass — do NOT build now, just don't architect against it):** hybrid assets. (1) Official **Supercell Fankit** assets (fankit.supercell.com) used unmodified where they fit — reveal cards, end screens, marketing shell. (2) For in-game top-down sprites + arena tiles the kit won't cover, generate **our own Brawl-style fan art** (BrawlHouse method). **Two hard lines that never move:** every capture carries the required notice *"This material is unofficial and is not endorsed by Supercell. For more information see Supercell's Fan Content Policy: www.supercell.com/fan-content-policy"* **plus a small `CONCEPT` label in the game UI** (so nothing can pass as a real in-game screenshot); and **no extracted/ripped game files — Fankit + our own art only.** Keep the renderer swap-friendly: the brawler + tiles are drawn programmatically now (`render.js` `drawBrawler`, `arena.js` tiles) and must stay easy to replace with richer sprites without touching game logic.

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

**BUILD STAMP RITUAL (every commit):** bump `CFG.BUILD.n` in `src/config.js` AND find-replace `?v=<old>`→`?v=<new>` across `index.html` (currently **`?v=4`**, BUILD n:4). The top-right title stamp (`v4 · M1`) is the witness — if it doesn't match, a script is cached stale.

**DEBUG OVERLAY:** append `?debug=1` to the URL for the on-screen instrument. `?joystick=fixed` switches to the fixed-anchor stick; combine as `?debug=1&joystick=fixed`.

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
