import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
COLLECTION_ID = "collection_b1470bb9-6e71-4f10-91fa-73edd1377bc2"
MODEL = "grok-code-fast-1"

REVIEW_CONTEXT = """
Date: January 2, 2026
Task: CODE REVIEW of Hybrid useOrders.js

BACKGROUND:
You (Maya/Grok) previously provided a complete rewrite of useOrders.js to fix Kanban ↔ KDS sync issues.
Your solution included excellent fixes:
- Anti-Jump Protection (skipFetchUntilRef)
- Auto-Healing logic
- Fixed status mapping (in_prep ↔ in_progress)

HOWEVER, there were concerns about your approach:
1. Using get_kds_orders RPC creates unnecessary coupling between Kanban and KDS
2. Missing function definitions (hydrateOrdersForUI, getSmartId)
3. Function hoisting issues

THE HUMAN DEVELOPER created a HYBRID VERSION that:
✅ Takes your excellent fixes (Anti-Jump, Auto-Healing, Status Mapping)
✅ Keeps the original Dexie-first hydration approach
✅ Avoids RPC dependency

YOUR MISSION:
Review the hybrid code below with a CRITICAL EYE.
Find ANY bugs, race conditions, or improvements.
Be BRUTALLY HONEST - don't hold back!
"""

SYSTEM_PROMPT = f"""
You are Maya, a senior software architect with expertise in React, Supabase, and offline-first systems.

{REVIEW_CONTEXT}

REVIEW CRITERIA:
1. **Correctness** - Will this code actually work? Any runtime errors?
2. **Race Conditions** - Are there timing issues between Dexie, Supabase, and React state?
3. **Edge Cases** - What happens in offline mode, network failures, concurrent updates?
4. **Performance** - Any unnecessary re-renders, memory leaks, or inefficiencies?
5. **Consistency** - Does it match KDS patterns where appropriate?

BE CRITICAL. If you see a problem, explain it clearly in Hebrew and suggest a fix.
If the code is good, say so, but also suggest potential improvements.
"""

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def ask_grok_review():
    # Read the hybrid version
    hybrid_code = get_file_content("frontend_source/src/hooks/useOrders_HYBRID_V1.js")
    
    # Read original for comparison
    original_code = get_file_content("frontend_source/src/hooks/useOrders.js")
    
    prompt = f"""
# 🔍 CODE REVIEW REQUEST: useOrders HYBRID VERSION

## 📋 Context
This is a hybrid version combining YOUR fixes with the original Dexie approach.

## 🆕 HYBRID CODE (Full File)
```javascript
{hybrid_code}
```

## 📄 ORIGINAL CODE (For Reference - First 300 lines)
```javascript
{original_code[:15000]}
```

---

## 🎯 YOUR REVIEW TASK

Please provide:

1. **🐛 Bugs Found** - List any actual bugs or errors
2. **⚠️ Potential Issues** - Race conditions, edge cases, etc.
3. **✅ What Works Well** - Acknowledge good parts
4. **💡 Suggested Improvements** - How to make it better
5. **🔧 Code Fixes** - If needed, provide specific code snippets to fix issues

**Be thorough and critical. This is going to production!**

תני ביקורת מפורטת בעברית, עם דוגמאות קוד ספציפיות לתיקונים.
"""
    
    print(f"🔍 מאיה (דרך {MODEL}) מבצעת ביקורת קוד...")
    
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
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
        )
        response.raise_for_status()
        result = response.json()
        
        # Display response
        print("\n" + "━" * 60)
        print("🌸 ביקורת קוד ממאיה (Grok Code Review)")
        print("━" * 60 + "\n")
        reply = result['choices'][0]['message'].get('content', 'No content returned')
        print(reply)
        print("\n" + "━" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    ask_grok_review()
