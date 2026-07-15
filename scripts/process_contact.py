from PIL import Image
from collections import deque
import os

SRC = r'C:\Users\balis\GitHub\testwale\public\contact\contact-hero.png'
# Re-process from original asset if available
ORIGINAL = r'C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale\assets\c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_Screenshot_2026-07-02_131632-ef03f96b-7725-423c-81dc-112515151a48.png'
OUT = r'C:\Users\balis\GitHub\testwale\public\contact\contact-hero.png'


def is_background(r: int, g: int, b: int, tolerance: int = 0) -> bool:
    avg = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)

    if avg >= 225 - tolerance and spread <= 22 + tolerance:
        return True

    if r >= 232 - tolerance and g >= 222 - tolerance and b >= 240 - tolerance and spread <= 28 + tolerance:
        return True

    return False


def color_close(r1, g1, b1, r2, g2, b2, tol=14) -> bool:
    return abs(r1 - r2) <= tol and abs(g1 - g2) <= tol and abs(b1 - b2) <= tol


def flood_remove_background(img: Image.Image) -> Image.Image:
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue

        r, g, b, a = px[x, y]
        if not is_background(r, g, b):
            continue

        visited[y][x] = True
        px[x, y] = (r, g, b, 0)

        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                nr, ng, nb, _ = px[nx, ny]
                if is_background(nr, ng, nb) or color_close(r, g, b, nr, ng, nb):
                    q.append((nx, ny))

    return img


def trim_transparent(img: Image.Image, pad: int = 6) -> Image.Image:
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False

    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 16:
                found = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)

    if not found:
        return img

    return img.crop(
        (
            max(0, minx - pad),
            max(0, miny - pad),
            min(w, maxx + 1 + pad),
            min(h, maxy + 1 + pad),
        )
    )


def main() -> None:
    src = ORIGINAL if os.path.exists(ORIGINAL) else SRC
    im = Image.open(src)
    im = flood_remove_background(im)
    im = trim_transparent(im)
    im.save(OUT)
    print('saved', OUT, im.size, im.mode)


if __name__ == '__main__':
    main()
