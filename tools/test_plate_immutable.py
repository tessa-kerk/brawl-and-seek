from pathlib import Path
import hashlib
from _harness import Tally
plate=Path(__file__).resolve().parents[1]/'assets/world/d003-world-plate-approved.png'
expected='5f79ce04d03dab9768cff0361d1cf3f9c5adfd30'
data=plate.read_bytes(); blob=b'blob '+str(len(data)).encode()+b'\0'+data
got=hashlib.sha1(blob).hexdigest()
t=Tally(); t.check('runtime world plate remains immutable v45 blob',got==expected); t.finish('plate immutable')
