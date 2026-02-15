import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-code-fast-1"

def get_file_content(path):
    # Try relative path first, then absolute
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        # Try absolute path based on user home
        abs_path = os.path.join("/Users/user/.gemini/antigravity/scratch/my_app/", path)
        if os.path.exists(abs_path):
            with open(abs_path, 'r', encoding='utf-8') as f:
                return f.read()
    return f"File {path} not found"

def run_review():
    kds_index_path = "frontend_source/src/pages/kds/index.jsx"
    kds_hook_path = "frontend_source/src/pages/kds/hooks/useKDSData.js"
    kds_card_path = "frontend_source/src/pages/kds/components/OrderCard.jsx"
    
    kds_index_code = get_file_content(kds_index_path)
    kds_hook_code = get_file_content(kds_hook_path)
    kds_card_code = get_file_content(kds_card_path)
    
    system_prompt = """
You are Maya, a senior software architect specializing in performance optimization for low-end hardware.
You are reviewing the Kadense Kitchen Display System (KDS), specifically its memory and CPU efficiency on weak Android tablets.

CURRENT CONTEXT:
The application was hanging on weak tablets (2-4GB RAM, old CPUs). We have implemented a "Lite Mode" system.
1. 💡 LITE MODE DETECTION: Detects low RAM/Cores or mobile user agents and sets 'lite_mode' in localStorage.
2. 💡 DATA VOLUME REDUCTION: Reduced order lookback from 48h to 6h in Lite Mode.
3. 💡 SUPPLEMENTAL FETCHES: Skipped heavy 'rescue' and 'ready items merge' queries from Supabase in Lite Mode.
4. 💡 UI OPTIMIZATION: Disabled Framer Motion layout animations and complex shadows/glows in OrderCard for Lite Mode.
5. 💡 STORAGE CLEANUP: Implemented aggressive periodic cleanup of Dexie (IndexedDB) to keep local storage small.

YOUR MISSION:
1. Analyze the provided KDS code (index, hook, card) for performance bottlenecks that could still freeze the UI thread on weak devices.
2. Are there any infinite re-renders or heavy loops in the data processing layer?
3. Evaluate the 'Lite Mode' implementation - is it aggressive enough? What else can we trim?
4. Suggest memory-saving techniques for handling 20+ active orders without crashing the browser.
5. Final Verdict: Is this ready for stable production on weak hardware?

תני את הסקירה בעברית עם דגש חזק על ביצועים ומיטוב זיכרון. תני ציון סופי למוכנות המערכת למכשירים חלשים.
"""

    prompt = f"""
# 🎓 PERFORMANCE REVIEW: KDS Lite Mode Optimization

## 📄 FILE 1: KDS Page (Entry Point) - Lite Mode Wrapper logic
Path: {kds_index_path}
```javascript
{kds_index_code}
```

## 📄 FILE 2: useKDSData Hook (Data Layer & Sync) - Lookback & Skip logic
Path: {kds_hook_path}
```javascript
{kds_hook_code}
```

## 📄 FILE 3: OrderCard (Display Logic) - Rendering & CSS optimizations
Path: {kds_card_path}
```javascript
{kds_card_code}
```

---

## 🎯 YOUR TASK: PERFORMANCE AUDIT
Please provide a detailed performance audit focused on weak Android tablets based on the system prompt.
"""

    print(f"🚀 שולח סקירה מקצועית לגרוק למייטוב מהירות ({MODEL})...")
    
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
        print("🌸 MAYA'S KDS CODE REVIEW & GRADE")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file as well
        with open("GROK_KDS_REVIEW.md", "w", encoding="utf-8") as f:
            f.write(f"# Grok KDS System Review\n\n{reply}")
            
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    run_review()
