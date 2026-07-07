/* Brawl & Seek — global config.
 * Visual system v1.0 (LOCKED 07-07-2026) + gameplay constants live here so no
 * module hard-codes a colour or a tuning number. The Concept Brief wins on any
 * design fact; this file is the single place those facts become code.
 */
window.CFG = {
  // Build stamp — bump n + the ?v= token in index.html on every commit.
  BUILD: { n: 3, date: '07-07-2026', milestone: 'M1' },

  // Palette — the six locked roles. Never invent a colour per deliverable.
  palette: {
    navy:    '#1E2340', // background
    yellow:  '#FFC800', // primary accent / display / the player
    magenta: '#FF4FA0', // the paint (camo motif)
    teal:    '#35E0D0', // the tell (interactive / you-are-here ripple)
    chalk:   '#F6F4EF', // text on dark
    ink:     '#14172B', // text on light / outlines
  },

  // World / arena
  tile: 64,            // world px per tile (arena is a fixed world, fit-contained)

  // The mechanic (Concept Brief §"The mechanic")
  repaintTime: 1.0,    // seconds of stillness to fully paint in (M3 toggle: 0.5 / 1 / 2)
  playerSpeed: 4.2,    // tiles per second
  playerRadius: 0.34,  // as a fraction of a tile (collision half-extent)
  camoAlpha: 0.24,     // "strong, not perfect" — floor of the hidden silhouette's opacity
};
