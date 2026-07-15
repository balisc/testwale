from PIL import Image
import os

ASSETS = r'C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale\assets'
OUT = r'C:\Users\balis\GitHub\testwale\public\history'

SOURCES = {
    'ancient-stupa.png': os.path.join(
        ASSETS,
        'c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_Screenshot_2026-07-01_134908-11e9a339-ac17-4c65-8700-e45b903f310f.png',
    ),
    'medieval-fort.png': os.path.join(
        ASSETS,
        'c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_Screenshot_2026-07-01_134950-9c73c4b9-787d-4eeb-bff3-67ec9df140b4.png',
    ),
    'modern-gate.png': os.path.join(
        ASSETS,
        'c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_Screenshot_2026-07-01_135024-816997b1-b5b3-4ab2-b641-8345f9c2e1bd.png',
    ),
}


def remove_background(img, black_thresh=30, white_thresh=252):
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= black_thresh and g <= black_thresh and b <= black_thresh:
                px[x, y] = (0, 0, 0, 0)
            elif r >= white_thresh and g >= white_thresh and b >= white_thresh:
                px[x, y] = (0, 0, 0, 0)
    return img


def trim_transparent(img, pad=2):
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 10:
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


os.makedirs(OUT, exist_ok=True)
for name, src in SOURCES.items():
    im = Image.open(src)
    im = remove_background(im)
    im = trim_transparent(im)
    im.save(os.path.join(OUT, name))
    print(name, im.size)
print('done')
