
from PIL import Image
import os
from rembg import remove

def create_composite_and_clean():
    base_path = "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/cimbali_m28_v2_base_1767948039580.png"
    both_path = "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/cimbali_m28_v3_both_1767948401648.png"
    output_path = "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/cimbali_m28_v3_left_composite.png"
    output_no_bg_path = "/Users/user/.gemini/antigravity/brain/00e4b1d2-f941-4c17-b630-c3a464bdf7c9/cimbali_m28_v3_left_composite_no_bg.png"

    print("Loading images...")
    img_base = Image.open(base_path).convert("RGBA")
    img_both = Image.open(both_path).convert("RGBA")

    if img_base.size != img_both.size:
        print(f"Size mismatch: {img_base.size} vs {img_both.size}")
        return

    width, height = img_base.size
    
    # Create new image
    new_img = Image.new("RGBA", (width, height))
    
    # Split point (middle of the image)
    split_x = width // 2
    
    # Take Left side from 'both' (contains Left Handle)
    left_part = img_both.crop((0, 0, split_x, height))
    
    # Take Right side from 'base' (contains Empty Right Head)
    right_part = img_base.crop((split_x, 0, width, height))
    
    # Paste them together
    new_img.paste(left_part, (0, 0))
    new_img.paste(right_part, (split_x, 0))
    
    print(f"Saving composite to {output_path}...")
    new_img.save(output_path)
    
    # Now remove background
    print("Removing background...")
    with open(output_path, 'rb') as f:
        input_data = f.read()
        
    params = {
        "alpha_matting": True,
        "alpha_matting_foreground_threshold": 240,
        "alpha_matting_background_threshold": 10,
        "alpha_matting_erode_size": 10,
    }
    
    output_data = remove(input_data, **params)
    
    with open(output_no_bg_path, 'wb') as f:
        f.write(output_data)
        
    print(f"✅ Final image saved to: {output_no_bg_path}")

if __name__ == "__main__":
    create_composite_and_clean()
