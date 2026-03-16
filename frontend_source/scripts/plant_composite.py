#!/usr/bin/env python3
"""
Plant Catalog Image Compositor v5
----------------------------------
Uses remove.bg API for professional-grade background removal.
Keeps original plant pixels, replaces background with gentle desert bokeh.

Rules:
  - Plant fills 75% of frame
  - Pot cropped - only top third visible
  - Gentle desert bokeh background
"""

import sys
import time
import requests
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
from io import BytesIO

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ARTIFACTS_DIR = Path("/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802")
DESERT_BG = PROJECT_DIR / "public" / "seeds" / "desert_bg.jpg"

# API
REMOVEBG_API_KEY = "e8m8LYcE5Y4b8Hncwn9qEN7j"

# Settings
OUTPUT_SIZE = (1024, 1024)
BOKEH_RADIUS = 3
PLANT_FILL_RATIO = 0.75
POT_CROP_FRACTION = 0.20  # Cut bottom 20% of original image (shows more pot)


def create_bokeh_background(bg_path: Path, size: tuple) -> Image.Image:
    """Load desert bg, resize to cover, center crop, apply gentle blur."""
    bg = Image.open(bg_path).convert("RGB")

    bg_ratio = bg.width / bg.height
    target_ratio = size[0] / size[1]

    if bg_ratio > target_ratio:
        new_height = size[1]
        new_width = int(new_height * bg_ratio)
    else:
        new_width = size[0]
        new_height = int(new_width / bg_ratio)

    bg = bg.resize((new_width, new_height), Image.LANCZOS)

    left = (new_width - size[0]) // 2
    top = (new_height - size[1]) // 2
    bg = bg.crop((left, top, left + size[0], top + size[1]))

    bg = bg.filter(ImageFilter.GaussianBlur(radius=BOKEH_RADIUS))

    enhancer = ImageEnhance.Brightness(bg)
    bg = enhancer.enhance(1.08)

    return bg


def remove_background_api(image: Image.Image) -> Image.Image:
    """Use remove.bg API for professional background removal. Returns RGBA image."""
    print("🌿 Removing background via remove.bg API...")

    # Convert PIL Image to bytes
    buf = BytesIO()
    image.save(buf, format="PNG")
    image_bytes = buf.getvalue()

    response = requests.post(
        "https://api.remove.bg/v1.0/removebg",
        files={"image_file": ("plant.png", image_bytes, "image/png")},
        data={"size": "auto"},
        headers={"X-Api-Key": REMOVEBG_API_KEY},
    )

    if response.status_code == 200:
        result = Image.open(BytesIO(response.content)).convert("RGBA")
        print(f"   ✅ Background removed successfully ({result.width}x{result.height})")
        return result
    else:
        print(f"   ❌ remove.bg error: {response.status_code} - {response.text}")
        sys.exit(1)


def composite(plant_path: Path, output_path: Path = None):
    """Main pipeline."""
    plant_orig = Image.open(plant_path).convert("RGB")

    # Step 1: Remove background using remove.bg on the FULL image (keeps pot intact)
    plant_rgba = remove_background_api(plant_orig)

    # Step 2: Crop bottom 30% to hide most of the pot
    crop_bottom = int(plant_rgba.height * (1.0 - POT_CROP_FRACTION))
    plant_cropped = plant_rgba.crop((0, 0, plant_rgba.width, crop_bottom))

    print(f"📐 Cropped pot: {plant_rgba.width}x{plant_rgba.height} -> {plant_cropped.width}x{plant_cropped.height}")

    # Step 3: Crop to bounding box of non-transparent pixels
    bbox = plant_cropped.getbbox()
    if bbox:
        plant_cropped = plant_cropped.crop(bbox)
        print(f"   Tight crop: {plant_cropped.width}x{plant_cropped.height}")

    # Step 4: Create blurred desert background
    print(f"🏜️  Creating bokeh desert background (blur={BOKEH_RADIUS})...")
    bg = create_bokeh_background(DESERT_BG, OUTPUT_SIZE)

    # Step 5: Scale plant to fill 75% of the output frame
    cropped_ratio = plant_cropped.width / plant_cropped.height

    target_height = int(OUTPUT_SIZE[1] * PLANT_FILL_RATIO)
    target_width = int(target_height * cropped_ratio)

    if target_width > int(OUTPUT_SIZE[0] * 0.95):
        target_width = int(OUTPUT_SIZE[0] * 0.95)
        target_height = int(target_width / cropped_ratio)

    plant_resized = plant_cropped.resize((target_width, target_height), Image.LANCZOS)

    print(f"🎨 Compositing at {int(target_height/OUTPUT_SIZE[1]*100)}% fill ({target_width}x{target_height})")

    # Step 6: Place - centered horizontally, anchored to bottom
    canvas = bg.copy().convert("RGBA")
    x_offset = (OUTPUT_SIZE[0] - target_width) // 2
    y_offset = OUTPUT_SIZE[1] - target_height  # anchor to bottom

    canvas.paste(plant_resized, (x_offset, y_offset), plant_resized)

    # Step 7: Save
    result = canvas.convert("RGB")

    if output_path is None:
        stem = plant_path.stem
        timestamp = int(time.time() * 1000)
        output_path = ARTIFACTS_DIR / f"{stem}_desert_v5_{timestamp}.png"

    result.save(output_path, quality=95)
    print(f"✅ Saved: {output_path}")
    return str(output_path)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python plant_composite.py <plant_image.jpg> [output.png]")
        sys.exit(1)

    plant_file = sys.argv[1]
    out_file = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    composite(Path(plant_file), out_file)
