from PIL import Image
import os

SRC = r'C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale\assets\c__Users_balis_AppData_Roaming_Cursor_User_workspaceStorage_767cfffbfa01d7e6b29420029136dc29_images_Screenshot_2026-07-02_122713-24ecd944-8b50-4857-9ab7-44606e81ebba.png'
OUT = r'C:\Users\balis\GitHub\testwale\public\about'

os.makedirs(OUT, exist_ok=True)
im = Image.open(SRC).convert('RGBA')
hero = im.crop((545, 18, 998, 248))
hero.save(os.path.join(OUT, 'about-hero.png'))
print('about-hero.png', hero.size)
