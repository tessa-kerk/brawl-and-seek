# Brawl & Seek — build status

## Directive 004 publication receipt (24-07-2026)

- Published commit: `366a17a` (v44 phone corrections), followed by this deployment receipt.
- GitHub Pages workflow `30037152661` completed successfully; public URL: [tessa-kerk.github.io/brawl-and-seek](https://tessa-kerk.github.io/brawl-and-seek/).
- System-Chrome public verification passed at 1280×720, 844×390, 740×360 and rotated 576×1280: `V44 · STEP 1 PHONE`, approved world plate present, keyboard movement works, zero page-origin errors. Raw verification is recorded in `Art/2026-07-24 - Directive 004 phone corrections/v44-public-verification.json`.

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
- No generation, publication, commit or push occurred; Directive spend remains $0. Physical-phone feel remains the final device judge.

## Directive 003C — public release deployment (24-07-2026)

- **Curated history:** public `main` was intentionally rebuilt from the approved root-to-tip nine-commit product candidate, followed only by concise public release receipts. Previous v30 tip `8c6667b` is preserved remotely as branch `archive/public-main-v30-2026-07-24` and tag `archive-public-v30-2026-07-24`, plus the verified full-history bundle outside the repository.
- **Published build:** release-content SHA `0cbc27f` and verified deployment receipt `cac5af7`; GitHub Pages serves the repository root at [tessa-kerk.github.io/brawl-and-seek](https://tessa-kerk.github.io/brawl-and-seek/) and reported successful builds from `main`.
- **Public-browser checks:** system Chrome verified `V43 · STEP 1 ENV`, persistent `CONCEPT`, zero page-origin errors, desktop 1280×720, landscape 844×390 and 740×360, and the approved portrait rotated-stage behavior. Public keyboard movement works; bush walkability/translucency, paint-in, and movement break were exercised. The v43 candidate full regression passed: 12 suites / 103 assertions.
- **Repository metadata:** homepage points to the playable URL; topics are `brawl-stars`, `browser-game`, `camouflage`, `fan-content`, `fan-game`, `game-design`, `game-prototype`, `map-maker`, `playwright`, `supercell`, and `vanilla-javascript`.
- **Device note:** phone touch behavior remains for Tessa’s physical-device feel test; no gameplay or bush-smoothing change was made during release hygiene.
## ⚡ CURRENT STATE — v43 · Step 1 environment complete

The public playable build is a browser-based hide-and-seek prototype with a footage-grounded Acid Lakes environment, 50 × 27 arena, follow camera, hider/seeker round loop, Tag interactions, Map Maker sandbox, landscape touch controls, and independent browser regression coverage.

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
