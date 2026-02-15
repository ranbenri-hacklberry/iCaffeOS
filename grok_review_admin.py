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

def run_review():
    admin_index_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/src/pages/dexie-admin/index.jsx"
    
    admin_index_code = get_file_content(admin_index_path)
    
    system_prompt = """
You are Maya, a senior software architect. You are reviewing the updated Dexie Admin Panel (Advanced Data Dashboard).
The panel has undergone a major overhaul to improve data integrity, loyalty management, and search UX.

KEY FEATURES REVIEWED:
1. 🏁 STICKY HEADERS OVERHAUL: Refactored flat lists into grouped object structures (label + items) to enable perfectly synchronized, "floating/pushing" sticky headers across Customers, Transactions, and Orders.
2. 🏁 LOYALTY DATA INTEGRITY: Implemented strict filtering to display only valid '05' phone numbers and customers with points_balance > 0. Added cleanup logic for "Anonymous" customers.
3. 🏁 ADVANCED SEARCH UX: Added "Exact Match" functionality (Enter key). When active, the search term is displayed as a deletable chip WITHIN the search input bar with the X on the right side.
4. 🏁 DYNAMISM & AESTHETICS: Removed outdated date/alphabet bars in favor of a continuous grouped list. Improved consistency in table row styling and hover effects.
5. 🏁 STABILITY: Improved error handling (null-safety) for random data (like the funny shoe size generator) to prevent runtime crashes.

YOUR MISSION:
1. Review the implementation of nested grouping logic in useMemo for filteredContent.
2. Verify the CSS/Layout logic for sticky headers (top-20 z-20) and the floating look.
3. Evaluate the Search Input redesign (Exact Match chip inside the bar).
4. Grade the system complexity vs efficiency (React performance with large datasets).
5. Final Verdict for production.

תני את הסקירה בעברית עם הסברים טכניים ברורים. תני ציון סופי.
"""

    prompt = f"""
# 🎓 CODE REVIEW: DEXIE ADMIN PANEL (Advanced Data Management)

## 📄 FILE 1: Dexie Admin Index (The Main Overhaul)
Path: {admin_index_path}
```javascript
{admin_index_code}
```

---

## 🎯 YOUR TASK: REVIEW & GRADE
Please provide a detailed review and grade based on the system prompt.
"""

    print(f"🚀 שולח סקירה לגרוק ({MODEL})...")
    
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
                "temperature": 0.1
            }
        )
        response.raise_for_status()
        result = response.json()
        
        reply = result['choices'][0]['message'].get('content', 'No content returned')
        
        print("\n" + "━" * 60)
        print("🌸 MAYA'S DEXIE ADMIN CODE REVIEW & GRADE")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file as well
        with open("/Users/user/.gemini/antigravity/scratch/my_app/GROK_ADMIN_REVIEW.md", "w", encoding="utf-8") as f:
            f.write(f"# Grok Dexie Admin System Review\n\n{reply}")
            
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    run_review()
