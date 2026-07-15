"""Make indian-polity.png background transparent (remove outer dark/black)."""
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parents[1] / "public" / "polity" / "indian-polity.png"
OUT = SRC


def is_dark_bg(r: int, g: int, b: int, a: int, thresh: int = 52) -> bool:
    return a > 10 and r <= thresh and g <= thresh and b <= thresh


def flood_remove_dark(img: Image.Image, thresh: int = 52) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_add(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not visited[y][x]:
            r, g, b, a = px[x, y]
            if is_dark_bg(r, g, b, a, thresh):
                visited[y][x] = True
                q.append((x, y))

    for x in range(w):
        try_add(x, 0)
        try_add(x, h - 1)
    for y in range(h):
        try_add(0, y)
        try_add(w - 1, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        try_add(x + 1, y)
        try_add(x - 1, y)
        try_add(x, y + 1)
        try_add(x, y - 1)

    return rgba


def trim_transparent(img: Image.Image, pad: int = 8) -> Image.Image:
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
    out = flood_remove_dark(img, thresh=55)
    out = trim_transparent(out, pad=10)
    out.save(OUT, "PNG")
    print("saved", OUT, out.size)


if __name__ == "__main__":
    main()
