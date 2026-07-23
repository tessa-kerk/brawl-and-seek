# Brawl & Seek — build status

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
