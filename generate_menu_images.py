import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

api_key = os.getenv('VITE_GEMINI_API_KEY')
# If using Gemini via OpenAI-compatible endpoint, or you can use google-generativeai
# For this script, we'll assume a standard structure that can be adapted.

# Items to generate for 'עגלת קפה' - 'שתיה קרה'
items = [
    {"id": 24, "name": "אמריקנו קר", "filename": "item_24_אמריקנו_קר.png"},
    {"id": 26, "name": "בקבוק", "filename": "item_26_בקבוק.png"},
    {"id": 60, "name": "ברד ענבים", "filename": "item_60_ברד_ענבים.png"},
    {"id": 27, "name": "טרופית", "filename": "item_27_טרופית.png"},
    {"id": 58, "name": "לימונדה", "filename": "item_58_לימונדה.png"},
    {"id": 29, "name": "מילקשייק", "filename": "item_29_מילקשייק.png"},
    {"id": 25, "name": "פחית", "filename": "item_25_פחית.png"},
    {"id": 128, "name": "פחית קטנה", "filename": "item_128_פחית_קטנה.png"},
    {"id": 22, "name": "קפה קר", "filename": "item_22_קפה_קר.png"},
    {"id": 23, "name": "שוקו קר", "filename": "item_23_שוקו_קר.png"},
    {"id": 50, "name": "שייק אדום", "filename": "item_50_שייק_אדום.png"},
    {"id": 28, "name": "שייק צהוב", "filename": "item_28_שייק_צהוב.png"},
    {"id": 57, "name": "תפוזים", "filename": "item_57_תפוזים.png"},
    {"id": 113, "name": "תפוחים", "filename": "item_113_תפוחים.png"}
]

# Base prompt template
BASE_PROMPT = """A premium {display_name} in a clear plastic cup, filled with crystal clear ice cubes. 
No decorations, straw or mint leaves. {extra_logic}
The drink is placed on a rustic weathered wooden table. 
The background is a beautifully blurred lush green botanical garden with dappled natural sunlight. 
Professional food photography, high resolution, hyper-realistic, 1024x1024."""

def get_item_logic(name):
    if "שוקו" in name:
        return "Beautiful rich chocolate syrup swirls merging with the milk inside the cup."
    if "פחית" in name:
        return "A cold soda can dripping with condensation, sitting next to a glass of ice."
    if "ברד" in name:
        return "Frosty, crystalline slush texture."
    if "שייק" in name or "מילקשייק" in name:
        return "Thick, creamy texture."
    return ""

def generate_images():
    # Note: This is a template. Real image generation via Gemini API 
    # usually requires Vertex AI or the very latest SDK features.
    # Alternatively, use DALL-E 3 if available.
    
    print(f"🚀 Starting generation for {len(items)} items...")
    
    for item in items:
        name = item['name']
        filename = item['filename']
        print(f"🎨 Generating: {name}...")
        
        extra = get_item_logic(name)
        prompt = BASE_PROMPT.format(display_name=name, extra_logic=extra)
        
        # Here we would call the actual API. 
        # Since I am an agent, I will use my internal tool to perform the task for the user.
        print(f"📝 Prompt: {prompt}")
        
    print("✅ Done!")

if __name__ == "__main__":
    generate_images()
