# Brawl & Seek — test suite

Rerunnable proofs of the build, so any session can confirm the mechanic still
does what the Concept Brief says. Dev-only; not referenced by the game.

```
pip install playwright        # once — uses your system Chrome, no browser download
python tools/run_all.py       # every suite; exits non-zero if any assertion fails
python tools/test_tag.py      # …or a single suite
```

## The standing rule these enforce

**A verification oracle must be independent of the code under test.** Expected
values are the spec written by hand, or derived straight from the tile grid —
never from the function being tested. A sweep that shares logic with the
implementation is not a proof; that exact mistake shipped the M1 collision bug
to a device twice (see `../PLAN.md`).

## Suites

| File | Proves | Independent oracle |
|---|---|---|
| `test_collision.py` | M1 move-and-slide: never clip a wall; a free axis always moves (5,968 cases) | pure grid overlap, not `collide()` |
| `test_movement.py` | keyboard drive, wall stop, paint timer, camo break, live repaint | spec timings |
| `test_tag.py` | projectile Tag: 2× speed, ~3-tile range, walls block, camo/running hits, 0.75s cd, miss→−30→spectator | Concept Brief v3.2 §104, by hand |
| `test_canon.py` | round rules: score decay, +100 reposition, repaint escalation, 75s round | Concept Brief tuning, by hand |
| `test_maker.py` | M3 live toggles (surfaces/repaint/tell) + Event-view fit unchanged | original fit formula, recomputed |
| `test_touch.py` | UI buttons fire on touch, joystick still drives, ghost-touchend id reuse self-heals | real taps + synthetic touches |

`_harness.py` launches the game under system Chrome and provides `game()`,
`Tally`, and a `touch()` helper. Add a suite as `test_<name>.py`; `run_all.py`
discovers it automatically.
