# Brawl & Seek

A playable browser prototype of a **hide-and-seek event mode** for Brawl Stars: hiders
**paint themselves into the arena** — hold still against a surface and, over one second,
you repaint to match it and vanish; move and the camouflage breaks. The same camouflage
system then ships into **Map Maker** as a tunable creator toolkit.

Fan concept and prototype by **Tessa Kerk**.

## Status

Early prototype, in active development. **Milestone 1** (the one-second paint fill + the
camo break) is in. See [PLAN.md](PLAN.md) for the live state and what's next (seeker,
score ticker, SPOTTED! reveal, then the Map Maker view).

## Running it

Plain **HTML + CSS + JavaScript, no build step.** Open `index.html` in a browser, or serve
the folder (`python -m http.server`) and visit it. Fully responsive down to phone width.

- **Move** — WASD / arrow keys, or drag anywhere on touch (a thumb-stick appears).
- **Hide** — hold still on or against a surface; the magenta paint fills you in over ~1s.
- **Break camo** — move; the paint cracks off and your name tag returns.

## Structure

- `src/` — engine: input, arena/collision, camo state machine, FX, render, boot/loop.
- `data/` — the arena tile grid + surface palette (no geometry in logic).
- `css/` — self-hosted fonts + layout.
- `assets/fonts/` — Lilita One, Nunito Sans, Caveat (woff2, SIL OFL).

## Disclaimers

**Not affiliated with or endorsed by Supercell — original fan concept by Tessa Kerk.**
No Supercell code, art, or copy is reproduced; all art is original and Brawl-adjacent.
Created in the spirit of Supercell's Fan Content Policy.
