# ตัดขอบขาวรอบภาพให้พอดีเนื้อหา (เว้นระยะขอบเล็กน้อย)
import sys
from PIL import Image, ImageChops

def trim(path, pad=24):
    im = Image.open(path).convert('RGB')
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bbox = ImageChops.difference(im, bg).getbbox()
    if not bbox:
        print('WARN no content:', path); return
    l, t, r, b = bbox
    l = max(0, l - pad); t = max(0, t - pad)
    r = min(im.width, r + pad); b = min(im.height, b + pad)
    im.crop((l, t, r, b)).save(path)
    print('trimmed', path, '->', (r - l, b - t))

for p in sys.argv[1:]:
    trim(p)
