"""Rebuild home-hero-4k.png — full image, no pixel feather (edge fade handled in CSS)."""
from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\balis\.cursor\projects\c-Users-balis-GitHub-testwale\assets\home-hero-character-v2.png"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "home" / "home-hero-4k.png"


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    img = img.resize((3840, 2560), Image.Resampling.LANCZOS)
    img.save(OUT, "PNG")
    print("saved", OUT, img.size)


if __name__ == "__main__":
    main()
