#!/usr/bin/env python3
"""
Script to remove backgrounds from clerk images and replace with solid color #F8FAFC
Uses rembg for AI-powered background removal
"""
from rembg import remove
from PIL import Image
import os

# Target background color: #F8FAFC (slate-50)
BG_COLOR = (248, 250, 252)

# Path to public folder
PUBLIC_PATH = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/public"

def process_image(filename):
    """Remove background and add solid color background"""
    input_path = os.path.join(PUBLIC_PATH, filename)
    
    if not os.path.exists(input_path):
        print(f"❌ File not found: {filename}")
        return False
    
    print(f"🔄 Processing {filename}...")
    
    # Read the image
    with open(input_path, 'rb') as f:
        input_data = f.read()
    
    # Remove background using AI
    print(f"   🤖 Removing background...")
    output_data = remove(input_data)
    
    # Save temp file with transparency
    temp_path = input_path.replace('.png', '_temp.png')
    with open(temp_path, 'wb') as f:
        f.write(output_data)
    
    # Open and add solid background
    print(f"   🎨 Adding solid background...")
    img = Image.open(temp_path).convert("RGBA")
    
    # Create solid background
    bg = Image.new('RGBA', img.size, (*BG_COLOR, 255))
    
    # Composite image onto background
    final = Image.alpha_composite(bg, img)
    
    # Convert to RGB and save
    final = final.convert('RGB')
    final.save(input_path, 'PNG')
    
    # Clean up temp file
    os.remove(temp_path)
    
    print(f"✅ Done: {filename}")
    return True

if __name__ == "__main__":
    print("🎨 Background Removal Script (rembg)")
    print(f"📍 Target color: #F8FAFC (slate-50)")
    print("-" * 40)
    
    # Process clerk images
    images = ["clerk_1.png", "clerk_2.png", "clerk_3.png", "clerk_4.png"]
    
    for img in images:
        process_image(img)
    
    print("-" * 40)
    print("✨ All done!")
