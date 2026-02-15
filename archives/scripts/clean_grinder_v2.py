
from rembg import remove
from PIL import Image
import os
import sys

def clean_image(image_path):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    print(f"Processing {image_path}...")
    
    with open(image_path, 'rb') as f:
        input_data = f.read()

    params = {
        "alpha_matting": True,
        "alpha_matting_foreground_threshold": 240,
        "alpha_matting_background_threshold": 10,
        "alpha_matting_erode_size": 10,
    }

    try:
        output_data = remove(input_data, **params)
        
        # Save as _no_bg.png
        output_path = image_path.replace('.png', '_no_bg.png')
        with open(output_path, 'wb') as f:
            f.write(output_data)
            
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

if __name__ == "__main__":
    images = [
        "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/grinder_on_demand_base_1767952978364.png",
        "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/grinder_single_dose_v2_1767953099914.png",
        "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/grinder_double_dose_v2_1767953116533.png"
    ]
    
    for img in images:
        clean_image(img)
