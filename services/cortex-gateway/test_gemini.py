import os
import google.generativeai as genai
from dotenv import load_dotenv

# Path to the .env.local file as used in start.sh
env_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local"

def test_gemini():
    # Load env manually since it's not a standard .env name
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if "=" in line:
                    key, val = line.strip().split("=", 1)
                    os.environ[key] = val.strip('"')

    api_key = os.getenv("VITE_GEMINI_API_KEY")
    model_name = "gemini-3-flash-preview"

    print(f"--- Gemini API Test ---")
    print(f"Model: {model_name}")
    print(f"API Key (masked): {api_key[:8]}...{api_key[-4:] if api_key else ''}")

    if not api_key:
        print("❌ Error: VITE_GEMINI_API_KEY not found in env.")
        return

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        
        print(f"Sending test query: 'Say hello'...")
        response = model.generate_content("Say hello")
        
        print(f"✅ SUCCESS! Response:")
        print(f"----------------------")
        print(response.text)
        print(f"----------------------")
        
    except Exception as e:
        print(f"❌ FAILED!")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")

if __name__ == "__main__":
    test_gemini()
