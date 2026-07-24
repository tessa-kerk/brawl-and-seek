"""Self-enforcing build-stamp ritual (PM catch, 20-07-2026, build v27): CFG.BUILD.n
in config.js and the ?v= cache-busting tokens in index.html must be bumped
TOGETHER on every commit. They drifted once already (?v= went to 27, BUILD.n
stayed at 26 -- the live stamp Tessa reads to confirm a deploy landed quietly
lied). No browser needed: this is a static check on the two source files, an
independent read of what's actually in the repo, not a re-derivation of
either file's own logic."""
import re
import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game

HERE = pathlib.Path(__file__).resolve().parent
GAME = HERE.parent

config_js = (GAME / "src" / "config.js").read_text(encoding="utf-8")
index_html = (GAME / "index.html").read_text(encoding="utf-8")

m = re.search(r"BUILD:\s*\{\s*n:\s*(\d+)", config_js)
build_n = int(m.group(1)) if m else None

tokens = [int(v) for v in re.findall(r"\?v=(\d+)", index_html)]
max_token = max(tokens) if tokens else None

ok = 0
fail = 0


def check(name, cond):
    global ok, fail
    print(f"  [{'OK ' if cond else 'FAIL'}] {name}")
    if cond:
        ok += 1
    else:
        fail += 1


check(f"CFG.BUILD.n found in config.js (got {build_n})", build_n is not None)
check(f"?v= tokens found in index.html ({len(tokens)} found, max {max_token})", tokens)
check(f"every ?v= token is the SAME value (no half-bumped file) — {sorted(set(tokens))}",
      len(set(tokens)) == 1)
check(f"CFG.BUILD.n ({build_n}) == the index.html ?v= token ({max_token})",
      build_n is not None and max_token is not None and build_n == max_token)
check("CFG.BUILD.milestone is the final playability label",
      "milestone: 'STEP 1 PLAYABILITY'" in config_js)
with game(width=844, height=390) as (pg, errs):
    stamp = pg.locator('.stamp').inner_text()
    check("fresh system-Chrome stamp is V48 · STEP 1 PLAYABILITY",
          stamp == 'V48 · STEP 1 PLAYABILITY' and not errs)

print(f"build-stamp: {ok} passed, {fail} failed")
sys.exit(0 if fail == 0 else 1)
