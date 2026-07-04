"""Strip near-white pixels only near image edges — keeps floating UI + no flood holes."""
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale\assets\home-hero-character-v2.png")
OUT = Path(__file__).resolve().parents[1] / "public" / "home" / "home-hero-transparent.png"


def remove_edge_white(img: Image.Image, margin: int = 72, thresh: int = 246) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            dist = min(x, y, w - 1 - x, h - 1 - y)
            if dist > margin:
                continue
            r, g, b, a = px[x, y]
            if a > 10 and r >= thresh and g >= thresh and b >= thresh:
                fade = dist / margin if margin else 0
                alpha = int(a * fade)
                px[x, y] = (r, g, b, alpha)

    return rgba


def trim_transparent(img: Image.Image, pad: int = 6) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    return img.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(img.width, x1 + pad),
            min(img.height, y1 + pad),
        )
    )


def main() -> None:
    img = Image.open(SRC)
    print("source", img.size, img.mode)
    out = remove_edge_white(img, margin=110, thresh=242)
    out = trim_transparent(out, pad=10)
    out.save(OUT, "PNG")
    print("saved", OUT, "size", out.size)


if __name__ == "__main__":
    main()
