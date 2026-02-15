import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-4-fast-reasoning"

SYSTEM_PROMPT = """
You are Maya, a senior software architect and code reviewer.
Your task is to review the RanTunes music player codebase for bugs, issues, and overall quality.

Be thorough but fair. Look for:
1. 🐛 Critical Bugs (will cause crashes or data loss)
2. ⚠️ Potential Issues (edge cases, race conditions)
3. 📈 Performance Problems (inefficient code, memory leaks)
4. 🔒 Security Concerns (exposed keys, unsafe operations)
5. 🎨 Code Quality (readability, best practices)

Provide your response in Hebrew with:
1. **ציון כללי: X/10**
2. **באגים קריטיים** (אם יש)
3. **בעיות פוטנציאליות** 
4. **נקודות חיוביות**
5. **המלצות לשיפור**
6. **האם מוכן לפרודקשן?** (כן/לא/עם שינויים)
"""

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Limit file size to avoid token overflow
            if len(content) > 15000:
                return content[:15000] + "\n\n... [TRUNCATED - FILE TOO LONG] ..."
            return content
    return f"File {path} not found"

def review_rantunes():
    # Read key files from RanTunes (reduced set for faster review)
    files_to_review = [
        "RanTunes/client/src/pages/index.jsx",
        "RanTunes/client/src/context/MusicContext.jsx",
        "RanTunes/client/vitest.config.js",
        "RanTunes/client/src/test/setup.jsx",
    ]
    
    code_sections = []
    for file_path in files_to_review:
        content = get_file_content(file_path)
        if "not found" not in content:
            code_sections.append(f"## 📄 {file_path}\n```javascript\n{content}\n```\n")
    
    combined_code = "\n---\n\n".join(code_sections)
    
    prompt = f"""
# 🎵 RanTunes Code Review Request (v1.1.0)

## Latest Major Architectural Refactor:
- **Major Modularity**: Fully refactored `MusicContext.jsx` from 550+ lines to ~270 lines by extracting core logic into custom hooks (`useAudioPlayer`).
- **State Synchronization**: Implemented a unified playback state that seamlessly synchronizes between Local Audio and Spotify SDK.
- **Improved Stability**: Eliminated common ReferenceErrors and SyntaxErrors through cleaner code structure and better dependency management.
- **Performance**: Optimized re-renders by centralizing audio event listeners and using more efficient state updates.
- **Production Ready**: Enhanced error handling with localized toasts and fallback mechanisms for all playback scenarios.

## About RanTunes:
- React-based music player (Vite + TailwindCSS)
- Integrates with Spotify API for streaming
- Uses Supabase for authentication and database
- Supports local music files and Spotify tracks
- Hebrew RTL interface

## Files to Review:

{combined_code}

---

## 🎯 MISSION: High-Stakes Code Review

Please analyze all the code above and provide:

1. **ציון כללי: X/10** 
2. **באגים קריטיים** (אם בכלל קיימים)
3. **בעיות פוטנציאליות** (מקרי קצה, אבטחה, ביצועים)
4. **נקודות חיוביות** (מה בוצע היטב בתיקונים האחרונים)
5. **המלצות ספציפיות** לשיפור נוסף
6. **האם מוכן לפרודקשן?** כן/לא/עם שינויים

ציין בפירוט אם התיקונים המוצהרים לעיל אכן פתרו את הבעיות הקודמות.
"""
    
    print(f"🚀 שולח ל-Grok לבדיקת קוד (Iteration {MODEL})...")
    print(f"📁 בודק {len(files_to_review)} קבצים...")
    
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
                "temperature": 0.2,
                "max_tokens": 8000
            }
        )
        response.raise_for_status()
        result = response.json()
        
        # Display response
        print("\n" + "━" * 60)
        print("🎵 RANTUNES CODE REVIEW - מאיה (עדכני)")
        print("━" * 60 + "\n")
        reply = result['choices'][0]['message'].get('content', 'No content returned')
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file
        with open("RANTUNES_CODE_REVIEW.md", "w", encoding="utf-8") as f:
            f.write(f"# 🎵 RanTunes Code Review\n\n{reply}")
        print(f"\n✅ הסקירה נשמרה ב-RANTUNES_CODE_REVIEW.md")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    review_rantunes()
