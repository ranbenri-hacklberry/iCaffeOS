import os
import requests
import json
# from dotenv import load_dotenv # Removing problematic dependency

def load_env_manual(filepath):
    """Manually parse a simple .env file"""
    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    # Removing quotes if present
                    value = value.strip('"').strip("'")
                    os.environ[key.strip()] = value
    except FileNotFoundError:
        print(f"⚠️ Warning: {filepath} not found.")

# Load environment variables manually
load_env_manual('.env.local')

# Supabase definitions
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

# We'll use the local function URL if running locally, or you can call the deployed one.
# For this test, I'll simulate calling the function logic directly via a script 
# OR call the endpoint if it was serving.
# 
# However, since I cannot easily "serve" the denon function and call it from outside 
# in this environment without complex setup, I will use a direct python script 
# that MIMICS the key logic of the typescript function to generate the icons 
# using the exact same prompt structure.

# But wait, looking at previous steps, I have `scratch/my_app/generate_menu_images.py`.
# I should just adapt that to `generate_ui_icons.py` using the NEW PROMPT.

from google import genai
from google.genai import types
import base64

API_KEY = os.getenv('VITE_GEMINI_API_KEY')
if not API_KEY:
    print("❌ Error: VITE_GEMINI_API_KEY not found in .env.local")
    exit(1)

client = genai.Client(api_key=API_KEY)

items = [
    "Cappuccino",
    "Croissant",
    "Pizza",
    "Cola"
]

def generate_icon(item_name):
    print(f"🎨 Generating icon for: {item_name}...")
    
    # EXACT LOGIC FROM THE TYPESCRIPT FILE
    base_style = "Cyberpunk / Neon UI Asset style, glowing edges, dark futuristic background"
    presentation = f"""
      Type: Mobile App Icon / UI Asset.
      Style: {base_style}. 
      Composition: Centered, clear silhouette, high contrast.
      Quality: 4k high-resolution, vector-like aesthetic, 3D render.
    """
    prompt = f"Create an icon for: {item_name}. {presentation}"
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp', # Using flash for speed/availability in test, or 'gemini-3-pro-image-preview' if known available
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["image", "text"],
            )
        )
        
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                # Save locally
                img_data = base64.b64decode(part.inline_data.data)
                filename = f"icon_test_{item_name.lower()}.png"
                with open(filename, "wb") as f:
                    f.write(img_data)
                print(f"✅ Saved: {filename}")
                return
            
        print("⚠️ No image data found in response.")
        
    except Exception as e:
        print(f"❌ Error generating {item_name}: {e}")

if __name__ == "__main__":
    print("🚀 Starting Icon Generation Test...")
    for item in items:
        generate_icon(item)
    print("🏁 Done!")
