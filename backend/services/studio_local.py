#!/usr/bin/env python3
"""
🎬 Local Studio — Background Removal & Studio Compositing Service
Runs on localhost (no GPU, no network). ~1s per image on Apple Silicon.
"""

import io
import base64
import uuid
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI(title="iCaffeOS Local Studio", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OUTPUT_DIR = Path(__file__).parent.parent / "studio_output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Serve processed images as static files
app.mount("/images", StaticFiles(directory=str(OUTPUT_DIR)), name="images")

# ── Warm-up rembg model on startup ──
print("🎬 [Local Studio] Loading rembg model...")
_warmup = remove(Image.new("RGBA", (8, 8), (0, 0, 0, 255)))
print("✅ [Local Studio] Model ready.")


def create_infinity_background(cw: int, ch: int) -> Image.Image:
    """Create a radial gradient infinity studio background."""
    bg_arr = np.ones((ch, cw, 3), dtype=np.float64) * 255.0
    cx_r, cy_r = cw / 2, ch * 0.58

    ys = np.arange(ch).reshape(-1, 1)
    xs = np.arange(cw).reshape(1, -1)
    dx = (xs - cx_r) / (cw * 0.6)
    dy = (ys - cy_r) / (ch * 0.55)
    dist = np.sqrt(dx**2 + dy**2)
    t = np.clip(dist, 0, 1) ** 0.7

    bg_arr[:, :, 0] = 236 + (255 - 236) * t  # R warm silver → white
    bg_arr[:, :, 1] = 234 + (255 - 234) * t  # G
    bg_arr[:, :, 2] = 232 + (255 - 232) * t  # B

    return Image.fromarray(bg_arr.astype(np.uint8)).convert("RGBA")


def defringe_alpha(cutout: Image.Image) -> Image.Image:
    """Erode alpha 2px + Gaussian soften to kill rembg edge fringe."""
    alpha = np.array(cutout.split()[3])
    alpha_eroded = Image.fromarray(alpha).filter(ImageFilter.MinFilter(size=5))
    alpha_soft = np.array(alpha_eroded).astype(np.float64)
    alpha_soft = np.array(Image.fromarray(alpha_soft.astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(radius=0.8)
    ))
    r, g, b, _ = cutout.split()
    return Image.merge("RGBA", (r, g, b, Image.fromarray(alpha_soft)))


def draw_contact_shadow(
    canvas_size: tuple, cutout_resized: Image.Image,
    x_offset: int, y_offset: int, new_pw: int, new_ph: int
) -> Image.Image:
    """Draw a multi-layer contact shadow anchored to the object's bottom."""
    cw, ch = canvas_size
    alpha_arr = np.array(cutout_resized.split()[3])

    # Find bottom-most opaque pixels
    bottom_search = alpha_arr[int(new_ph * 0.90):, :]
    if bottom_search.shape[0] > 0:
        cols = np.where(bottom_search.max(axis=0) > 30)[0]
        if len(cols) > 0:
            base_left, base_right = cols[0], cols[-1]
            base_width = base_right - base_left
            base_center_x = x_offset + (base_left + base_right) // 2
        else:
            base_width = new_pw // 2
            base_center_x = x_offset + new_pw // 2
    else:
        base_width = new_pw // 2
        base_center_x = x_offset + new_pw // 2

    product_bottom_y = y_offset + new_ph

    shadow = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)

    shadow_w = max(int(base_width * 0.55), int(new_pw * 0.25))
    shadow_h = max(5, int(new_ph * 0.02))
    shadow_cy = product_bottom_y - shadow_h // 2

    for i in range(5):
        expand = i * 4
        opacity = int(30 - i * 6)
        if opacity <= 0:
            break
        shadow_draw.ellipse([
            base_center_x - shadow_w // 2 - expand,
            shadow_cy - shadow_h // 2 - expand // 3,
            base_center_x + shadow_w // 2 + expand,
            shadow_cy + shadow_h // 2 + expand // 3,
        ], fill=(25, 20, 15, opacity))

    return shadow.filter(ImageFilter.GaussianBlur(radius=15))


def studio_composite(input_image: Image.Image, canvas_w=512, canvas_h=512) -> Image.Image:
    """Full pipeline: remove bg → defringe → infinity bg → contact shadow → composite."""
    # 1. Remove background
    cutout = remove(input_image.convert("RGBA"))
    bbox = cutout.getbbox()
    if bbox:
        cutout = cutout.crop(bbox)

    # 2. Defringe edges
    cutout = defringe_alpha(cutout)

    # 3. Scale to fit safe zone (for both 1:1 and 5:4 crops)
    cw, ch = canvas_w, canvas_h
    safe_top = int(ch * 0.08)
    safe_bottom = int(ch * 0.92)
    safe_height = safe_bottom - safe_top

    pw, ph = cutout.size
    scale = min((cw * 0.65) / pw, (safe_height * 0.88) / ph)
    new_pw, new_ph = int(pw * scale), int(ph * scale)
    cutout_resized = cutout.resize((new_pw, new_ph), Image.LANCZOS)

    # 4. Center on canvas
    x_offset = (cw - new_pw) // 2
    y_center = (safe_top + safe_bottom) // 2
    y_offset = y_center - new_ph // 2

    # 5. Build layers
    bg = create_infinity_background(cw, ch)
    shadow = draw_contact_shadow((cw, ch), cutout_resized, x_offset, y_offset, new_pw, new_ph)

    # 6. Composite
    result = Image.alpha_composite(bg, shadow)
    result.paste(cutout_resized, (x_offset, y_offset), cutout_resized)

    return result.convert("RGB")


# ── API Endpoints ──

@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...)):
    """Accept image upload, return studio-enhanced PNG."""
    start = time.time()

    img_bytes = await file.read()
    input_image = Image.open(io.BytesIO(img_bytes))

    result = studio_composite(input_image)

    # Save to output dir
    filename = f"studio_{uuid.uuid4().hex[:8]}.png"
    filepath = OUTPUT_DIR / filename
    result.save(filepath, "PNG")

    # Return PNG directly
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)

    elapsed = time.time() - start
    print(f"✅ [Local Studio] {filename} — {elapsed:.2f}s")

    return Response(
        content=buf.getvalue(),
        media_type="image/png",
        headers={
            "X-Processing-Time": f"{elapsed:.2f}s",
            "X-Filename": filename,
            "X-Image-Url": f"/studio/images/{filename}",
        },
    )


@app.post("/remove-bg/base64")
async def remove_background_base64(data: dict):
    """Accept base64 image, return result as base64 (for compatibility with old flow)."""
    start = time.time()

    img_bytes = base64.b64decode(data["image"])
    input_image = Image.open(io.BytesIO(img_bytes))

    result = studio_composite(input_image)

    # Encode result as base64 PNG
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    result_b64 = base64.b64encode(buf.getvalue()).decode()

    filename = f"studio_{uuid.uuid4().hex[:8]}.png"
    filepath = OUTPUT_DIR / filename
    result.save(filepath, "PNG")

    elapsed = time.time() - start
    print(f"✅ [Local Studio] {filename} — {elapsed:.2f}s")

    return JSONResponse({
        "status": "success",
        "image": result_b64,
        "filename": filename,
        "processing_time": f"{elapsed:.2f}s",
    })


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image (already processed or raw) and return a persistent local URL."""
    img_bytes = await file.read()
    ext = file.filename.rsplit('.', 1)[-1] if '.' in (file.filename or '') else 'png'
    filename = f"upload_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = OUTPUT_DIR / filename
    filepath.write_bytes(img_bytes)
    print(f"📁 [Local Studio] Stored upload: {filename} ({len(img_bytes)} bytes)")
    return JSONResponse({
        "status": "ok",
        "filename": filename,
        "url": f"/studio/images/{filename}",
        "size": len(img_bytes),
    })


@app.get("/health")
async def health():
    return {"status": "ok", "service": "local-studio", "engine": "rembg+PIL"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)
