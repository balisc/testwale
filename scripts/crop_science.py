from PIL import Image
import os

SRC = r'C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale/assets/c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_ChatGPT_Image_Jun_30__2026__11_58_27_AM-870227bb-e817-4ca7-9b30-3ca2d7561675.png'
OUT = r'C:\Users\balis\GitHub\testwale\public\science'

im = Image.open(SRC).convert('RGBA')
W, H = im.size
print('source', W, H)

# whiteout the top-right arrow circles so they don't appear in crops
from PIL import ImageDraw
draw = ImageDraw.Draw(im)
arrow_centers = [
    (320, 120), (650, 120), (982, 120),   # row 1
    (320, 380), (650, 380), (982, 380),   # row 2
    (982, 565),                           # row 3 (applied)
]
for cx, cy in arrow_centers:
    draw.rectangle([cx-22, cy-22, cx+22, cy+22], fill=(255, 255, 255, 255))

# whiteout only the title text that wraps into the illustration crop area
# (kept narrow so it does NOT touch the wifi / illustration)
title_whiteout = [
    (500, 356, 672, 394),    # "5. ...nce & Astronomy"
    (834, 350, 896, 394),    # "6. ...Information" (left text only, not wifi)
]
for box in title_whiteout:
    draw.rectangle(list(box), fill=(255, 255, 255, 255))

# crop boxes (left, top, right, bottom) in 1024x683 space
crops = {
    'science-physics.png':   (196, 118, 340, 322),
    'science-chemistry.png': (518, 120, 672, 325),
    'science-biology.png':   (846, 118, 1006, 322),
    'science-general.png':   (202, 354, 342, 514),
    'science-space.png':     (508, 386, 672, 532),
    'science-computer.png':  (836, 362, 992, 530),
    'science-applied.png':   (574, 556, 1008, 662),
}

def trim_white(img, thresh=246):
    # find bounding box of non-near-white pixels
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 10 and not (r >= thresh and g >= thresh and b >= thresh):
                found = True
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if not found:
        return img
    pad = 2
    minx = max(0, minx - pad); miny = max(0, miny - pad)
    maxx = min(w, maxx + 1 + pad); maxy = min(h, maxy + 1 + pad)
    return img.crop((minx, miny, maxx, maxy))

os.makedirs(OUT, exist_ok=True)
for name, box in crops.items():
    c = im.crop(box)
    c = trim_white(c)
    c.save(os.path.join(OUT, name))
    print(name, c.size)
print('done')
