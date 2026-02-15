#!/usr/bin/env python3
"""
Remove background from logo images using rembg.
Usage: python remove_background.py input.png output.png
Or import and use: remove_bg_base64(base64_string)
"""

import sys
import base64
from io import BytesIO

try:
    from rembg import remove
    from PIL import Image
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("Warning: rembg not installed. Run: pip install rembg", file=sys.stderr)


def remove_background(input_path: str, output_path: str) -> bool:
    """Remove background from image file."""
    if not REMBG_AVAILABLE:
        print("rembg not available", file=sys.stderr)
        return False

    try:
        with open(input_path, 'rb') as f:
            input_data = f.read()

        output_data = remove(input_data)

        with open(output_path, 'wb') as f:
            f.write(output_data)

        print(f"✅ Background removed: {output_path}")
        return True
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_bg_base64(base64_input: str) -> str:
    """
    Remove background from base64 encoded image.
    Returns base64 encoded PNG with transparent background.
    """
    if not REMBG_AVAILABLE:
        raise ImportError("rembg not installed. Run: pip install rembg")

    # Decode base64
    image_data = base64.b64decode(base64_input)

    # Remove background
    output_data = remove(image_data)

    # Encode back to base64
    return base64.b64encode(output_data).decode('utf-8')


def remove_bg_from_url(image_url: str) -> bytes:
    """
    Download image from URL and remove background.
    Returns PNG bytes with transparent background.
    """
    import requests

    if not REMBG_AVAILABLE:
        raise ImportError("rembg not installed. Run: pip install rembg")

    # Download image
    response = requests.get(image_url)
    response.raise_for_status()

    # Remove background
    return remove(response.content)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_background.py input.png output.png")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    success = remove_background(input_file, output_file)
    sys.exit(0 if success else 1)
