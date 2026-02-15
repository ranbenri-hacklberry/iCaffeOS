#!/usr/bin/env python3
"""
Simple script to replace transparent background with solid color #F8FAFC
Uses only PIL (no rembg needed)
"""
from PIL import Image
import os

# Target background color: #F8FAFC (slate-50)
BG_COLOR = (248, 250, 252)

# Path to public folder
PUBLIC_PATH = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/public"

def add_solid_background(filename):
    """Replace transparent background with solid color"""
    input_path = os.path.join(PUBLIC_PATH, filename)
    
    if not os.path.exists(input_path):
        print(f"❌ File not found: {filename}")
        return False
    
    print(f"🔄 Processing {filename}...")
    
    # Open image
    img = Image.open(input_path).convert("RGBA")
    
    # Create solid background
    bg = Image.new('RGBA', img.size, (*BG_COLOR, 255))
    
    # Composite image onto background (preserves transparency properly)
    final = Image.alpha_composite(bg, img)
    
    # Convert to RGB and save
    final = final.convert('RGB')
    final.save(input_path, 'PNG')
    
    print(f"✅ Done: {filename}")
    return True

if __name__ == "__main__":
    print("🎨 Add Solid Background Script")
    print(f"📍 Target color: #F8FAFC (slate-50)")
    print("-" * 40)
    
    # Process clerk images
    images = ["clerk_1.png", "clerk_2.png", "clerk_3.png", "clerk_4.png"]
    
    for img in images:
        add_solid_background(img)
    
    print("-" * 40)
    print("✨ All done!")
