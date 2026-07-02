from PIL import Image, ImageDraw
import os

SRC = r'C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale\assets\c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_Screenshot_2026-07-01_125244-6b359bbf-9751-4448-b790-be10bbfb1a3b.png'
OUT = r'C:\Users\balis\GitHub\testwale\public\history'
WHITE = (255, 255, 255, 255)


def trim_white(img, thresh=246):
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 10 and not (r >= thresh and g >= thresh and b >= thresh):
                found = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if not found:
        return img
    pad = 2
    return img.crop(
        (
            max(0, minx - pad),
            max(0, miny - pad),
            min(w, maxx + 1 + pad),
            min(h, maxy + 1 + pad),
        )
    )


im = Image.open(SRC).convert('RGBA')
print('source', im.size)
draw = ImageDraw.Draw(im)

for cx, cy in [(290, 42), (620, 42), (950, 42)]:
    draw.rectangle([cx - 22, cy - 22, cx + 22, cy + 22], fill=WHITE)

for box in [
    (8, 48, 338, 138),
    (8, 100, 172, 238),
    (8, 228, 128, 268),
    (338, 48, 678, 138),
    (338, 100, 502, 238),
    (338, 228, 458, 268),
    (673, 48, 1020, 138),
    (673, 100, 842, 238),
    (673, 228, 798, 268),
]:
    draw.rectangle(list(box), fill=WHITE)

for box in [
    (218, 168, 248, 198),
    (485, 168, 558, 215),
    (825, 168, 890, 215),
]:
    draw.rectangle(list(box), fill=WHITE)

crops = {
    'history-ancient.png': (218, 145, 337, 291),
    'history-medieval.png': (485, 145, 670, 291),
    'history-modern.png': (825, 145, 1010, 291),
}

os.makedirs(OUT, exist_ok=True)
for name, box in crops.items():
    c = im.crop(box)
    c = trim_white(c)
    c.save(os.path.join(OUT, name))
    print(name, c.size)
print('done')
