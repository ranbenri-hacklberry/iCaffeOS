import requests
import json
import os

# API Keys (Using the same key found in existing scripts)
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-code-fast-1"  

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def ask_grok_sales_debug():
    # Read the debug report we created
    debug_report = get_file_content("DEBUG_REPORT.md")
    
    # Construct the prompt
    prompt = f"""
I am working on a Supabase/React application for a kiosk system. 
We are facing a persistent issue with an RPC function `get_sales_data`.

Here is the detailed Debug Report describing the problem, symptoms, and what we've tried so far:

---
{debug_report}
---

Please analyze this failing scenario. 
Why would a `SECURITY DEFINER` function return correct `order_items` but 0 for the calculated `total` (sum of quantity * price), even though direct SQL queries show valid prices?
Is it an RLS issue on `menu_items`? Or a Type Casting issue that `::NUMERIC` didn't solve?

Please provide a corrected SQL function that is guaranteed to return the correct total.
"""
    
    print(f"🚀 Sending debug report to {MODEL}...")
    
    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": "You are a Senior Database Engineer and Supabase Expert. Analyze the SQL/RPC issue deeply and provide a working solution."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2, # Low auth for precision
                "max_tokens": 4000
            }
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "━" * 60)
        print("🤖 Grok Debug Analysis")
        print("━" * 60 + "\n")
        content = result['choices'][0]['message'].get('content', 'No content returned')
        print(content)
        print("\n" + "━" * 60)
        
        # Save to file
        with open("GROK_SALES_DEBUG_RESPONSE.md", "w", encoding="utf-8") as f:
            f.write(f"# Grok Sales Debug Analysis\n\n{content}")
        print("\n📄 Analysis saved to GROK_SALES_DEBUG_RESPONSE.md")
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    ask_grok_sales_debug()
