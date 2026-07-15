from PIL import Image, ImageDraw
import os

SRC = r'C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale/assets/c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_ChatGPT_Image_Jun_30__2026__01_55_11_PM-8eec5c49-1780-49d2-9c09-bde1c7325714.png'
OUT = r'C:\Users\balis\GitHub\testwale\public\reasoning'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGBA')
W, H = im.size
print('source', W, H)

# whiteout the small purple arrow circles at each card's bottom-right
draw = ImageDraw.Draw(im)
arrow_centers = []
for ay in (272, 385, 490, 585, 670):
    for ax in (325, 650, 985):
        arrow_centers.append((ax, ay))
for cx, cy in arrow_centers:
    draw.rectangle([cx-20, cy-20, cx+20, cy+20], fill=(255, 255, 255, 255))

# crop boxes (left, top, right, bottom)
crops = {
    'analogy.png':        (248, 176, 345, 262),
    'series.png':         (558, 188, 662, 270),
    'coding.png':         (900, 182, 1002, 278),
    'blood-relations.png':(248, 300, 345, 392),
    'direction.png':      (556, 300, 662, 398),
    'ranking.png':        (890, 300, 1002, 398),
    'seating.png':        (246, 414, 345, 508),
    'syllogism.png':      (556, 416, 666, 504),
    'statement.png':      (900, 410, 1002, 508),
    'logical-math.png':   (244, 516, 345, 602),
    'non-verbal.png':     (552, 516, 662, 604),
    'clock-calendar.png': (888, 516, 1002, 604),
    'spatial.png':        (244, 612, 345, 680),
    'data-sufficiency.png':(574, 616, 681, 681),
}

def trim_white(img, thresh=247):
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
    return img.crop((max(0, minx-pad), max(0, miny-pad), min(w, maxx+1+pad), min(h, maxy+1+pad)))

for name, box in crops.items():
    c = trim_white(im.crop(box))
    c.save(os.path.join(OUT, name))
    print(name, c.size)
print('done')
