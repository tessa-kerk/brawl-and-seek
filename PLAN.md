# Brawl & Seek — build status

## Directive 005 publication receipt (24-07-2026)

- Gameplay commit: `e03aebbe987b1faa24e7f2ee062d34924a592006` (`Keep desktop play upright`).
- GitHub Pages workflow `30039937829` completed successfully for that commit. Public URL: [tessa-kerk.github.io/brawl-and-seek](https://tessa-kerk.github.io/brawl-and-seek/).
- Cache-busted public system-Chrome verification passed at 1,300×1,365, 1,280×720, 576×1,280 portrait, 844×390 landscape and 740×360 landscape: v45 stamp, approved plate, expected desktop/mobile orientation, exact viewport bounds, movement and zero page-origin errors. Public end-state and Play Again also passed at 1,300×1,365.
- README, capture utilities and Art evidence remain outside the public tree. No Gemini or paid generation occurred.

## Directive 004 publication receipt (24-07-2026)

## Directive 005 — v45 desktop-safe orientation local PM handoff (24-07-2026)

- Build/cache stamp: `v45 · DESKTOP ORIENT`; all 21 `?v=` tokens agree. README and gameplay surfaces remain unchanged.
- Exact defect reproduction: fine-pointer 1300×1365 previously produced a rotated stage; v45 now gives an upright centred stage `(0,337.3125)–(1300,1027.6875)`, 1.883:1, no overflow.
- Orientation logic: CSS and `Input.isRotated()` now require portrait + coarse pointer + no hover; tall fine-pointer desktops receive an upright centred landscape surface. Debug telemetry exposes the decision and actual stage rectangle.
- Artefacts: `Art/2026-07-24 - Directive 005 desktop orientation/v45-geometry.json`, six viewport stills, and exact desktop keyboard-walk/end-state/Play Again stills. Geometry covers 1300×1365, 1280×720, 900×1200, 576×1280 mobile portrait, 844×390 and 740×360 mobile landscape; every capture reports exact viewport bounds and zero page-origin errors.
- Motion: `v45-desktop-tall-keyboard-final.webm` is the clean trimmed desktop held-key recording (11.920s, 298 frames at 25fps, decoded by OpenCV from v45 frame 0); `v45-desktop-tall-keyboard-contact-sheet.jpg` is the labelled sequential sheet showing START V45, keyboard walk, END STATE and PLAY AGAIN. Raw recording is preserved as `v45-desktop-tall-keyboard-raw.webm`; console log is `v45-desktop-tall-keyboard-console.txt` and reports no page-origin errors.
- Regression: independent desktop-orientation oracle passed 4/4; mobile rotate/input oracle passed 5/5; complete regression passed **ALL 14 suites** (including the new desktop-orientation suite) with zero failures; `git diff --check` is clean.
- Local PM gate passed and the reviewed gameplay commit is now published as v45. No generation or Gemini spend occurred; public verification is recorded above.

## CURRENT STATE — v45 · DESKTOP ORIENT

The public playable build is v45 on GitHub Pages at gameplay commit `e03aebb`. Gameplay is frozen at the PM-approved desktop-safe orientation surface pending the next dated directive; Tessa’s physical-device feel test remains the device judge.

- Published gameplay commit: `e03aebb` (v45 desktop-safe orientation), following the v44 phone-correction history.
- GitHub Pages workflow `30039937829` completed successfully; public URL: [tessa-kerk.github.io/brawl-and-seek](https://tessa-kerk.github.io/brawl-and-seek/).
- System-Chrome public verification passed at 1,300×1,365, 1,280×720, 844×390, 740×360 and rotated 576×1280: `V45 · DESKTOP ORIENT`, approved world plate present, keyboard movement works, exact bounds and zero page-origin errors. Detailed v45 geometry is recorded in `Art/2026-07-24 - Directive 005 desktop orientation/v45-geometry.json`.

## Directive 004 — v44 phone-correction local PM handoff (24-07-2026)

- Build/cache stamp: `v44 · STEP 1 PHONE`; all 21 `?v=` tokens agree.
- Changed runtime surfaces: source-to-world prop collision data and slide-safe resolution in `src/arena.js`; hand-audited barrel/stump data in `data/arena.js`; occupancy-owned bush foreground; transformed-stage touch mapping and large viewport sizing in `src/input.js` / `css/main.css`; debug prop overlay; release-rule clarification in `CLAUDE.md`.
- Fossil plate audit: preserved v43 source in `Art/2026-07-24 - Directive 004 phone corrections/v44-fossil-plate-before.png`; corrected plate plus full diff, CSV ROI inventory and 11 native before/after ROI crops are in the same folder. The final operation is a tight 1–2 px bright-bone-connected local inpaint ring; unrelated floor/wall/bush/prop pixels are outside the mask.
- Prop gate: 28 hand-traced barrel/stump approach/contact/diagonal cases passed; independent grid-plus-prop collision sweep passed 226,008 cases plus 17,040 boundary cases.
- Rendered stills: normal 844×390 barrel/stump/bush/exit/adjacent frames, debug-only follow-camera overlay, fit-to-map full-world collider overlay, and 576×1280 phone stage screenshot are in the Directive 004 evidence folder.
- Motion: `v44-phone-route-final.webm` is the clean (no debug overlay) trimmed held-key route; its sequential OpenCV decode, labelled START/WALK/BUSH/EXIT/RE-ENTRY/CAMERA contact sheet and frame-count report are beside it. Raw recording is preserved as `v44-phone-route-raw.webm`; debug telemetry remains separately in `v44-motion-console.txt`.
- Dedicated prop motion: clean held-input barrel and stump routes are `v44-prop-barrel-route-final.webm` and `v44-prop-stump-route-final.webm`; `v44-prop-routes-final-contact-sheet.jpg`, both per-route decode reports, and `v44-prop-motion-console.txt` provide the paired visual/console evidence.
- Regression: **ALL 13 suites passed**, including the focused bush oracle (14 assertions), props oracle, and complete collision sweep. `git diff --check` is clean.
- Console/phone telemetry: `v44-console.txt`, `v44-motion-console.txt`, and `v44-phone-stage-geometry.json` record zero page-origin errors and actual transformed-stage bounds/mappings.
- Publication is complete at `62b5aca`; no generation or Gemini spend occurred. Directive spend remains $0. Physical-phone feel remains the final device judge.

## Directive 003C — public release deployment (24-07-2026)

- **Curated history:** public `main` was intentionally rebuilt from the approved root-to-tip nine-commit product candidate, followed only by concise public release receipts. Previous v30 tip `8c6667b` is preserved remotely as branch `archive/public-main-v30-2026-07-24` and tag `archive-public-v30-2026-07-24`, plus the verified full-history bundle outside the repository.
- **Published build:** release-content SHA `0cbc27f` and verified deployment receipt `cac5af7`; GitHub Pages serves the repository root at [tessa-kerk.github.io/brawl-and-seek](https://tessa-kerk.github.io/brawl-and-seek/) and reported successful builds from `main`.
- **Public-browser checks:** system Chrome verified `V43 · STEP 1 ENV`, persistent `CONCEPT`, zero page-origin errors, desktop 1280×720, landscape 844×390 and 740×360, and the approved portrait rotated-stage behavior. Public keyboard movement works; bush walkability/translucency, paint-in, and movement break were exercised. The v43 candidate full regression passed: 12 suites / 103 assertions.
- **Repository metadata:** homepage points to the playable URL; topics are `brawl-stars`, `browser-game`, `camouflage`, `fan-content`, `fan-game`, `game-design`, `game-prototype`, `map-maker`, `playwright`, `supercell`, and `vanilla-javascript`.
- **Device note:** phone touch behavior remains for Tessa’s physical-device feel test; no gameplay or bush-smoothing change was made during release hygiene.
## ⚡ CURRENT STATE — v43 · Step 1 environment complete

The public playable build is a browser-based hide-and-seek prototype with a footage-grounded Acid Lakes environment, 50 × 27 arena, follow camera, hider/seeker round loop, Tag interactions, Map Maker sandbox, landscape touch controls, and independent browser regression coverage.

> Historical v43 snapshot below is retained for audit only; the active CURRENT STATE is the published v44 record at the top of this file.

### Approved gameplay surfaces

- Hold still on a valid surface to paint into camouflage; move to break it.
- Walls and lakes are solid; bushes are walkable cover.
- Moving through bushes makes the local brawler translucent while retaining readable UI and lower foliage occlusion.
- Local bush foliage responds to movement and settles after release; the existing one-second paint-in behavior remains unchanged.
- Event view uses the approved source-grounded follow camera. Map Maker retains a fit-to-map editing view.

### Verification

- Build stamp: `v43 · STEP 1 ENV`; all runtime cache tokens agree.
- Independent browser suite: 12 suites, 103 assertions passing in system Chrome.
- The focused bush-interaction oracle additionally passed five consecutive 13-assertion runs.
- Runtime registry contains only the approved world plate, wall/bush masks, and live UI assets.

### Next

Step 1 is frozen. Future work begins only with the next approved product directive.

## Public release notes

- v43 restores the approved Step 1 playable build: real environment collision, source-grounded camera/map composition, and polished bush interaction feedback.
- The project remains an unofficial fan concept. See the README for play instructions and the Fan Content disclaimer.
