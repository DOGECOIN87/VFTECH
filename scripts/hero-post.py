"""Finishes a rendered hero image (scripts/render-hero.mjs): bloom, vignette and fine grain against banding.
   Writes <out-base>.webp and .avif (the formats the designs load) and a .jpg for reference.
   python3 scripts/hero-post.py in.png out-base [bloom=0.55] [vignette=0.35] [light=0]"""
import sys, numpy as np
from PIL import Image, ImageFilter
src, base = sys.argv[1], sys.argv[2]
bloom = float(sys.argv[3]) if len(sys.argv) > 3 else 0.55
vig = float(sys.argv[4]) if len(sys.argv) > 4 else 0.35
light = len(sys.argv) > 5 and sys.argv[5] == '1'
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.float32) / 255
if bloom > 0:
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    bright = a * np.clip((lum - (0.55 if not light else 0.75)) / 0.45, 0, 1)[..., None]
    b = Image.fromarray((bright * 255).astype(np.uint8))
    g = sum(np.asarray(b.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255 * w for r, w in ((6, .5), (18, .35), (48, .25)))
    a = 1 - (1 - a) * (1 - np.clip(g * bloom, 0, 1)) if not light else np.clip(a + g * bloom * 0.3, 0, 1)
H, W = a.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H * 0.45) / (H / 2)) ** 2)
mask = 1 - vig * np.clip((d - 0.55) / 0.9, 0, 1) ** 1.5
a = a * mask[..., None] if not light else 1 - (1 - a) * (2 - mask[..., None])
rng = np.random.default_rng(3)
a = np.clip(a + rng.normal(0, 1.4 / 255, a.shape).astype(np.float32), 0, 1)
out = Image.fromarray((a * 255 + .5).astype(np.uint8))
out.save(base + '.webp', quality=74, method=6)
out.save(base + '.avif', quality=58, speed=4)
out.save(base + '.jpg', quality=80, optimize=True, progressive=True)
import os
for e in ('webp', 'avif', 'jpg'): print(base + '.' + e, os.path.getsize(base + '.' + e) // 1024, 'KB')
