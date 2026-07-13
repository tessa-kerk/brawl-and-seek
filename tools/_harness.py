"""Shared test harness for Brawl & Seek.

Runs the game under real system Chrome (Playwright, channel="chrome" — no
`playwright install` needed) and reads the actual runtime, per the project's
QA rule (judge real output, never numbers on their own).

STANDING RULE these tests exist to honour (see CLAUDE.md): a verification oracle
must be INDEPENDENT of the code under test. The expected values below are the
spec written by hand or derived straight from the tile grid — never from the
function being tested. A sweep that shares logic with the implementation is not
a proof; that mistake shipped the M1 collision bug to a device twice.

    pip install playwright        # once; system Chrome is used, no browser download
    python tools/run_all.py       # or any single tools/test_*.py
"""
import pathlib, sys
from contextlib import contextmanager
from playwright.sync_api import sync_playwright

# Test names carry Unicode (→, ◂). A Windows cp1252 console raises
# UnicodeEncodeError mid-print and aborts the suite — a false red on a green
# run. Force UTF-8 with a replace fallback so output can never crash the tests.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

URL = (pathlib.Path(__file__).resolve().parent.parent / "index.html").as_uri()


@contextmanager
def game(width=1000, height=700, mobile=False, query=""):
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True)
        ctx = b.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=2 if mobile else 1,
            is_mobile=mobile, has_touch=mobile,
        )
        pg = ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERR: " + str(e)))
        pg.goto(URL + query)
        pg.wait_for_function("window.Game && window.Round && window.Arena", timeout=9000)
        pg.wait_for_timeout(300)
        try:
            yield pg, errs
        finally:
            b.close()


class Tally:
    def __init__(self):
        self.p = 0
        self.f = 0

    def check(self, name, ok):
        print(f"  [{'OK ' if ok else 'FAIL'}] {name}")
        if ok:
            self.p += 1
        else:
            self.f += 1
        return ok

    def finish(self, title, errs=None):
        bad = self.f + (1 if errs else 0)
        if errs:
            print(f"  console errors: {errs[:5]}")
        print(f"{title}: {self.p} passed, {self.f} failed{' + CONSOLE ERRORS' if errs else ''}")
        sys.exit(0 if bad == 0 else 1)


# Dispatch a synthetic touch on the #stage element (not window — the hardened
# listeners live on #stage). Maintains a live TouchList so event.touches is right.
FIRE = """(([type,x,y,idn,uiSel])=>{
  const st=document.getElementById('stage');
  const tgt = uiSel ? document.querySelector(uiSel) : st;
  const t=new Touch({identifier:idn,target:tgt,clientX:x,clientY:y,pageX:x,pageY:y});
  const a=window.__T=window.__T||{};
  if(type==='touchend'||type==='touchcancel'){delete a[idn];}else{a[idn]=t;}
  const list=Object.values(a);
  tgt.dispatchEvent(new TouchEvent(type,{cancelable:true,bubbles:true,touches:list,targetTouches:list,changedTouches:[t]}));
})"""


def touch(pg, type_, x, y, idn=1, ui_sel=None):
    pg.evaluate(FIRE, [type_, x, y, idn, ui_sel])
