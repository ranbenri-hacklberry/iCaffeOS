import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-4-1-fast-reasoning"

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Truncate if too large (Grok has token limits)
            if len(content) > 100000:
                return content[:100000] + "\n\n... [TRUNCATED - FILE TOO LARGE] ..."
            return content
    return f"File {path} not found"

def run_review():
    base_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/src"
    
    files_to_review = {
        "KDS_Main.jsx": f"{base_path}/pages/kds/index.jsx",
        "OrderCard.jsx": f"{base_path}/pages/kds/components/OrderCard.jsx",
        "useOrders.js": f"{base_path}/hooks/useOrders.js",
        "KDSInventoryScreen.jsx": f"{base_path}/pages/kds/components/KDSInventoryScreen.jsx"
    }
    
    system_prompt = """
You are Maya (מאיה), a senior software architect specializing in Kitchen Display Systems (KDS) and high-concurrency React applications.
You are reviewing the "KDS & Live Production" module of iCaffeOS.

## SYSTEM CONTEXT:
1. This is a mission-critical screen run on tablets in busy kitchens.
2. Performance, reliability, and clear visual cues are paramount.
3. The system uses a Hybrid strategy (Dexie local-first + Supabase Real-time).

## YOUR MISSION:
1. Review the Main KDS logic (index.jsx): 
   - How does it handle large volumes of orders?
   - Is the state management efficient (useMemo/useCallback usage)?
2. Validate the `OrderCard.jsx` component:
   - Does it show critical info (Customer name, items, order type, payment status)?
   - Is it optimized for quick touch interactions?
3. Audit the `useOrders.js` hook (V2 - HYBRID):
   - Review the "Anti-Jump Protection" implementation.
   - Check the "Auto-Healing" logic for status mismatches.
   - Verify the "7-day cleanup" logic we just implemented.
4. Stress-test the `KDSInventoryScreen.jsx`:
   - This file is massive. Look for duplicate logic or potential memory leaks.
   - Check the Hebrew localization and RTL support.

You should be strict but fair. The user loves clean UI and robust backend sync.

תני את הסקירה בעברית עם הסברים טכניים ברורים.
ציין בעיות פוטנציאליות שעדיין קיימות.
תני ציון סופי מ-1 עד 10.
"""

    prompt = "# 👨‍🍳 CODE REVIEW: KDS & LIVE PRODUCTION SYSTEM\n\n"
    
    for name, path in files_to_review.items():
        content = get_file_content(path)
        prompt += f"""
## 📄 FILE: {name}
Path: {path}
```javascript
{content}
```

---
"""

    prompt += """
## 🎯 YOUR TASK: COMPREHENSIVE REVIEW & GRADE
Please provide a detailed review covering:
1. Architectural robustness (Dexie + Supabase Sync).
2. UI/UX for Kitchen environment (Readability, Touch targets).
3. Critical Bugs or Logic Flaws (Status jumping, Sync race conditions).
4. Hebrew / RTL Integrity.
5. Final grade (1-10)
"""

    print(f"🚀 שולח סקירה לגרוק ({MODEL})...")
    print(f"📁 קבצים לסקירה: {list(files_to_review.keys())}")
    
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
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 4000
            },
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        
        reply = result['choices'][0]['message'].get('content', 'No content returned')
        
        print("\n" + "━" * 60)
        print("🍳 MAYA'S KDS REVIEW")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file as well
        output_path = "/Users/user/.gemini/antigravity/scratch/my_app/GROK_KDS_REVIEW.md"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"# Grok KDS Review\n\n{reply}")
        
        print(f"\n📄 נשמר ב: {output_path}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    run_review()
