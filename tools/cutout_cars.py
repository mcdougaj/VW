# Cuts each car out of its own listing hero photo (real photo, background removed) for the lot scene.
# Writes site/cars/<id>/cutout.webp (RGBA, trimmed to the car) and prints the aspect ratio.
# Needs rembg:  py -3.13 -m venv .bgvenv && .bgvenv\Scripts\pip install "rembg[cpu]"
# Usage:        .bgvenv\Scripts\python tools\cutout_cars.py
import json, re, sys
from pathlib import Path
from PIL import Image, ImageFilter
from rembg import remove, new_session

root = Path(__file__).resolve().parent.parent
cars = json.loads(re.sub(r"^window\.CARS = |;\s*$", "", (root / "site/data/cars.js").read_text(encoding="utf8")))["cars"]
session = new_session("birefnet-general")
only = set(sys.argv[1:])
for c in cars:
    if only and c["id"] not in only:
        continue
    src = root / "site" / c["photos"][c["hero"]]
    out = src.parent / "cutout.webp"
    im = Image.open(src).convert("RGB")
    cut = remove(im, session=session, post_process_mask=True)
    a = cut.getchannel("A").point(lambda v: 0 if v < 24 else v)   # drop faint halo
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    cut.putalpha(a)
    box = a.point(lambda v: 255 if v > 64 else 0).getbbox()
    cut = cut.crop(box)
    cut.save(out, "WEBP", quality=92, method=6)
    print(f"{c['id']:42s} {cut.size[0]}x{cut.size[1]}  aspect {cut.size[0] / cut.size[1]:.2f}")
