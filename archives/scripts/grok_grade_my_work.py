import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-code-fast-1"

GRADING_CONTEXT = """
Date: January 2, 2026
Task: GRADING MY WORK - Rate the Human Developer

BACKGROUND:
You (Maya/Grok) provided a code review of useOrders_HYBRID_V1.js with specific fixes.
The human developer implemented ALL your fixes and created V2.

YOUR PREVIOUS REVIEW INCLUDED:
1. 🐛 Missing timestamp in realtime hydration
2. 🐛 markOrderSeen not efficient (RPC doesn't update seen_at)
3. 🐛 Auto-healing errors not propagated to UI
4. ⚠️ Anti-Jump race condition (global timer blocks all orders)
5. ⚠️ Menu items fetched repeatedly (performance issue)
6. ⚠️ Offline concurrent update edge cases
7. ⚠️ Network failures in realtime hydration

THE HUMAN'S V2 IMPLEMENTATION:
- ✅ Fixed timestamp in realtime
- ✅ Added TODO note for markOrderSeen RPC improvement
- ✅ Auto-healing now updates error state
- ✅ Anti-Jump now per-order (Map instead of global timer)
- ✅ Menu items cached (menuMapRef)
- ✅ Improved realtime items fallback

YOUR MISSION:
Grade the human developer's work on a scale of 1-10.

GRADING CRITERIA:
1. Completeness (Did they implement ALL your fixes?)
2. Code Quality (Is the implementation correct?)
3. Performance (Did they optimize properly?)
4. Production Readiness (Is this safe to deploy?)
5. Understanding (Did they grasp the core issues?)
"""

SYSTEM_PROMPT = f"""
You are Maya, a senior software architect reviewing a junior developer's implementation of your code review feedback.

{GRADING_CONTEXT}

BE BRUTALLY HONEST. 
If they did excellent work, say so.
If they missed something, call it out.

Provide:
1. **Overall Grade: X/10** (at the top)
2. **What They Did Right** (praise)
3. **What They Missed or Could Improve** (constructive criticism)
4. **Final Verdict** (Is this production-ready? Yes/No/With Changes)

תני את הציון בעברית עם הסברים ברורים.
"""

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def ask_grok_grade():
    # Read the V2 implementation
    v2_code = get_file_content("frontend_source/src/hooks/useOrders_HYBRID_V2.js")
    
    prompt = f"""
# 🎓 GRADE MY WORK: useOrders V2 Implementation

## 📝 Context
You reviewed useOrders_HYBRID_V1.js and provided detailed feedback.
I implemented ALL your suggestions in V2.

## 📄 MY V2 IMPLEMENTATION (Full File)
```javascript
{v2_code}
```

---

## 🎯 YOUR TASK: GRADE MY WORK

Please provide:

1. **Overall Grade: X/10** 
2. **What I Did Right** (specific examples)
3. **What I Missed or Could Improve** (if anything)
4. **Production Readiness Verdict** (Yes/No/With Changes)

Be honest and thorough. I want to know if this is truly production-ready.

תני ציון מפורט בעברית עם הסברים ברורים למה קיבלתי את הציון הזה.
"""
    
    print(f"📊 בקשה מגרוק לתת ציון...")
    
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
        print("🎓 הציון של מאיה")
        print("━" * 60 + "\n")
        reply = result['choices'][0]['message'].get('content', 'No content returned')
        print(reply)
        print("\n" + "━" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    ask_grok_grade()
