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

def ask_grok_modifier_debug():
    # Read the debug report and the main file
    debug_report = get_file_content("MODIFIER_DEBUG_REPORT.md")
    modifier_modal = get_file_content("frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx")
    
    # Construct the prompt
    prompt = f"""
I am working on a Supabase/React application for a kiosk system. 
We are facing a critical issue where modifiers (option groups and values) are not loading on client devices.

Here is the detailed Debug Report:
---
{debug_report}
---

And here is the current source code of ModifierModal.jsx:
---
{modifier_modal}
---

Please analyze the situation. Why are the modifiers blank on clients? 
Identify errors in the data fetching logic, potential RLS blocks, or type mismatches.
Provide a fix that ensures reliable loading.
"""
    
    print(f"🚀 Sending modifier debug request to Maya (Grok {MODEL})...")
    
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
                    {"role": "system", "content": "את מאיה, מהנדסת Full-Stack בכירה ומומחית Supabase. נתחי את הבעיה בצורה מעמיקה ותני פתרון טכני מדויק בעברית."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 4000
            }
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "━" * 60)
        print("🌸 תשובת מאיה (Grok Audit)")
        print("━" * 60 + "\n")
        content = result['choices'][0]['message'].get('content', 'No content returned')
        print(content)
        print("\n" + "━" * 60)
        
        # Save to file
        with open("MAYA_MODIFIER_FIX_RESPONSE.md", "w", encoding="utf-8") as f:
            f.write(f"# Maya Modifier Fix Analysis\n\n{content}")
        print("\n📄 התשובה נשמרה ב-MAYA_MODIFIER_FIX_RESPONSE.md")
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    ask_grok_modifier_debug()
