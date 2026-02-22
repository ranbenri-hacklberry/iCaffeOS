import google.generativeai as genai

def test_gemini():
    # Key from business_secrets table
    api_key = "AIzaSyAlQdTNCeBJvCj4fmgWaEB7v7YRl8dKHyI"
    model_name = "gemini-3-flash-preview"

    print(f"--- Gemini API Test (DB Key) ---")
    print(f"Model: {model_name}")

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
