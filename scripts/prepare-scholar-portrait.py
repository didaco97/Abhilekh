"""Prepare the generated timeline illustration without cropping its silhouette."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "output/imagegen/ambedkar-scholar-alpha-v1.png"
target = root / "public/images/timeline"
image = Image.open(source).convert("RGBA")
box = image.getchannel("A").point(lambda p: 255 if p > 20 else 0).getbbox()
if not box:
    raise ValueError("The generated portrait has no visible pixels")
image = image.crop(box)
image.thumbnail((820, 1200), Image.Resampling.LANCZOS)
padding = 32
canvas = Image.new("RGBA", (image.width + padding * 2, image.height + padding * 2))
canvas.alpha_composite(image, (padding, padding))
canvas.save(target / "ambedkar-scholar.png", optimize=True)
canvas.save(target / "ambedkar-scholar.webp", quality=90, method=6)
print(f"Prepared complete scholar silhouette: {canvas.width} x {canvas.height}")
