/* Brawl & Seek — global config.
 * Visual system v1.0 (LOCKED 07-07-2026) + gameplay constants live here so no
 * module hard-codes a colour or a tuning number. The Concept Brief wins on any
 * design fact; this file is the single place those facts become code.
 */
window.CFG = {
  // Build stamp — bump n + the ?v= token in index.html on every commit.
  BUILD: { n: 6, date: '07-07-2026', milestone: 'M2' },

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

  /* Character art — PLACEHOLDER vector tokens. Explicit light/body/dark triples
   * (not computed) so the player's signed-off M1 look stays pixel-identical.
   * These get replaced wholesale in the art pass (Fankit first, then our own
   * Brawl-style fan art) — the renderer must stay swap-friendly. */
  characters: {
    player: { name: 'YOU', body: '#FFC800', light: '#FFD84A', dark: '#E0A800' },
    dummies: [
      { name: 'PIP',  body: '#7BD389', light: '#9CE3A6', dark: '#57B267' },
      { name: 'ZED',  body: '#C08BE8', light: '#D6ABF3', dark: '#9C68C6' },
      { name: 'MOX',  body: '#FF8A5C', light: '#FFA97F', dark: '#DB6A3F' },
      { name: 'KIRA', body: '#6FC3E8', light: '#95D8F3', dark: '#4A9DC4' },
      { name: 'BOLT', body: '#E8C46F', light: '#F3D894', dark: '#C4A04A' },
    ],
    seeker: { name: 'SEEKER', body: '#FF4F6D', light: '#FF7A92', dark: '#C93450' },
  },
};
