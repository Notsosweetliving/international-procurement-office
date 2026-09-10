from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "public" / "ipo-logo.png").convert("RGBA")
bbox = source.getchannel("A").getbbox()
if bbox:
    source = source.crop(bbox)

def icon(size: int) -> Image.Image:
    inner = max(1, round(size * 0.94))
    scaled = source.copy()
    scaled.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2))
    return canvas

outputs = {
    root / "public" / "ipo-icon-16.png": 16,
    root / "public" / "ipo-icon-32.png": 32,
    root / "app" / "apple-icon.png": 180,
    root / "public" / "ipo-icon-192.png": 192,
    root / "app" / "icon.png": 512,
    root / "public" / "ipo-icon-512.png": 512,
}
for path, size in outputs.items():
    icon(size).save(path, format="PNG", optimize=True)

icon(512).save(
    root / "app" / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32)],
)
