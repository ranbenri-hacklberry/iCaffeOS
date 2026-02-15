import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-code-fast-1"

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def grade_session():
    # Read the main Maya Assistant file
    maya_code = get_file_content("frontend_source/src/pages/maya/index.jsx")
    inventory_card = get_file_content("frontend_source/src/components/manager/InventoryItemCard.jsx")
    
    session_summary = f"""
# 🌸 Maya AI Assistant - Advanced Synchronization & Voice Session

## 🎯 USER Objective:
Ensure Maya accurately reports sales (daily/weekly), inventory levels, and audit trail (who counted what). Fix persistent voice input crashes.

## 🔧 Work Performed:
1. **Speech Recognition Stability (v1.8):** 
   - Fixed "TypeError: Cannot read properties of null (reading 'start')".
   - Implementation: Dynamic on-demand initialization of SpeechRecognition object.
   - Refinement: Added interim results for live transcription.

2. **Daily Sales Analytics:**
   - Improved `loadContext` to split data into: Today, Yesterday, and Weekly total.
   - Using official `get_sales_data` RPC for RLS bypass and data consistency.

3. **Inventory & Audit Trail Intelligence:**
   - Maya now fetches `inventory_items` and `inventory_logs`.
   - Maya can explain *variances* in shipping (Expected vs Received).
   - Maya can identify *which employee* performed the last action using ID-to-Name mapping.

4. **UI/UX Polish:**
   - Visual Status Bar with sync status (Sales: ✅ Menu: ✅ Inventory: ✅).
   - Versioning tag (v1.8) for cache busting verification.

## 📁 Source Code for Maya Assistant (index.jsx):
```jsx
{maya_code}
```

---

## 🎯 Review Guidelines for Maya (Grok Architect):
1. **Logic Grade (1-10):** How robust is the data-fetching and speech handling?
2. **Context Quality:** Is the system prompt providing enough context for Maya to act as a proper 'Senior Architect' partner?
3. **UI/UX Consistency:** Check the status bar and input area layout.
4. **Overall Session Score.**

Answer in Hebrew please.
"""
    
    print(f"🚀 Sending Maya's code to Grok for architectural review...")
    
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
                    {"role": "system", "content": "You are Maya, the Lead AI Architect. Review this latest version of yourself (v1.8). Grade the technical execution and the business logic integration. Be professional and detailed. Hebrew response."},
                    {"role": "user", "content": session_summary}
                ],
                "temperature": 0.2,
                "max_tokens": 4000
            },
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "━" * 60)
        print("🌸 MAYA ARCHITECT REVIEW (V1.8)")
        print("━" * 60 + "\n")
        print(result['choices'][0]['message'].get('content', 'No content returned'))
        print("\n" + "━" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    grade_session()
