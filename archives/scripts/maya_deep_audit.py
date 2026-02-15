import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-code-fast-1"

def get_file_content(path, max_chars=5000):
    full_path = f"frontend_source/{path}"
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if len(content) > max_chars:
                return content[:max_chars] + "\n... [TRUNCATED]"
            return content
    return f"File {path} not found"

def deep_security_review():
    # Gather critical files for the review
    files = {
        "Maya UI & Logic": "src/pages/maya/index.jsx",
        "Auth Context": "src/context/AuthContext.jsx",
        "Supabase Config": "src/lib/supabase.js",
        "Offline Sync Logic": "src/services/offlineQueue.js",
        "Inventory Management": "src/components/manager/InventoryScreen.jsx",
        "Secure RPC SQL": "../SECURE_RPC_FUNCTIONS.sql"
    }
    
    context_blocks = []
    for label, path in files.items():
        content = get_file_content(path)
        context_blocks.append(f"### {label} ({path})\n```jsx\n{content}\n```")
    
    full_context = "\n\n".join(context_blocks)
    
    review_prompt = f"""
# 🛡️ סקירת אבטחה ובאגים מקיפה - Maya Assistant & Core Infrastructure

## 🎯 המשימה:
ביצוע "Audit" מעמיק למערכת לפני עליה ל-Production. אנחנו כרגע בגרסה v1.8 ב-develop.

## 📁 הקוד לסקירה:
{full_context}

---

## 🔍 דגשי סקירה (Maya Architect):
1. **אבטחה (Security):**
   - האם יש חשיפת מפתחות API בקוד (מעבר למה שמוגדר כ-VITE_)?
   - האם יש פרצות RLS פוטנציאליות בשימוש ב-Supabase?
   - האם ה-Auth Context חשוף להתקפות?

2. **באגים ותקינות (Bugs & Reliability):**
   - האם יש Race Conditions בסנכרון ה-Offline?
   - האם הטיפול ב-Speech Recognition באמת אטום לשגיאות?
   - האם יש דליפות זיכרון (Memory Leaks) ב-useEffect?

3. **ביצועים (Performance):**
   - האם הקריאות ל-contextData.loadContext יעילות?
   - האם ה-Chat History נטען בצורה אופטימלית?

4. **אימות תיקונים (Fix Verification):**
   - האם המעטפת של `navigator.locks` ב-offlineQueue פותרת את ה-Race Condition?
   - האם ה-Speech Recognition ב-index.jsx מטפל כעת בשגיאות רשת ומיקרופון בצורה טובה?
   - האם הקריאות ל-RPC (`get_sales_data`) נקיות מ-p_business_id?

ענה בעברית מקצועית. תן ציון מעודכן ואישור אם אפשר לעלות ל-main.
"""
    
    print(f"🚀 שולח סריקת אבטחה ובדיקת באגים עמוקה למאיה (Grok Architect)...")
    
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
                    {"role": "system", "content": "You are Maya, the Senior Security Architect and Lead Developer. You are performing a final audit of the development branch. Be critical, find bugs, and ensure security is airtight. Hebrew response."},
                    {"role": "user", "content": review_prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 4000
            },
            timeout=180
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "━" * 60)
        print("🛡️ דוח אבטחה ובאגים מקיף - MAYA AUDIT (v1.8)")
        print("━" * 60 + "\n")
        print(result['choices'][0]['message'].get('content', 'No content returned'))
        print("\n" + "━" * 60)
        
    except Exception as e:
        print(f"Error during audit: {e}")

if __name__ == "__main__":
    deep_security_review()
