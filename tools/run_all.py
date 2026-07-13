"""Run every tools/test_*.py and summarise. Exit non-zero if any fails.

    pip install playwright     # once; uses system Chrome (no browser download)
    python tools/run_all.py
"""
import subprocess, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
tests = sorted(HERE.glob("test_*.py"))
fails = []
for tst in tests:
    print(f"\n=== {tst.name} ===")
    r = subprocess.run([sys.executable, str(tst)])
    if r.returncode != 0:
        fails.append(tst.name)

print("\n" + "=" * 40)
if fails:
    print("FAILED:", ", ".join(fails))
    sys.exit(1)
print(f"ALL {len(tests)} SUITES PASSED")
