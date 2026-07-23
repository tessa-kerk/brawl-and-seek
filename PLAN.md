# Brawl & Seek — build status

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
