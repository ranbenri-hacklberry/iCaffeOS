import google.generativeai as genai
import os

env_path = "../../frontend_source/.env.local"
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if "=" in line:
                key, val = line.strip().split("=", 1)
                os.environ[key] = val.strip('"')

api_key = os.getenv("VITE_GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Listing models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
