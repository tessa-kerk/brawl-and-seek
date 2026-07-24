"""Independent orientation oracle: capability context outranks window shape."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _harness import game, Tally

with game(width=1300, height=1365) as (pg, errs):
    t=Tally(); info=pg.evaluate("(()=>{const s=document.getElementById('stage'),r=s.getBoundingClientRect();return {r:{x:r.x,y:r.y,w:r.width,h:r.height},css:getComputedStyle(s).transform,coarse:matchMedia('(pointer:coarse)').matches,hover:matchMedia('(hover:hover)').matches,rot:Input.debug().rotation,overflow:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]}})()")
    ratio=25.23/13.40
    t.check('fine-pointer desktop does not rotate', info['coarse'] is False and info['hover'] is True and info['rot'] is False and info['css'].startswith('matrix(1, 0, 0, 1'))
    t.check('tall desktop stage is centred at audited landscape ratio', abs(info['r']['w']/info['r']['h']-ratio)<.01 and abs(info['r']['x'])<1 and abs(info['r']['y']-(1365-info['r']['h'])/2)<1)
    t.check('tall desktop has no document overflow', info['overflow']==[1300,1365])
    t.check('desktop stage owns upright controls', pg.evaluate("getComputedStyle(document.getElementById('hint')).display!='none' && document.querySelector('.stamp').innerText.includes('V48')"))
    t.finish('desktop orientation', errs)
