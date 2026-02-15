import requests
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-3-fast-beta"

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def run_review():
    sales_path = "frontend_source/src/components/manager/SalesDashboard.jsx"
    
    sales_code = get_file_content(sales_path)
    
    system_prompt = """
You are Maya, a senior software architect and UX expert reviewing a Sales Dashboard component for a café management system (iCaffeOS).

The code has just been updated with:
1. ✅ SPLIT VIEW: Weekly/Monthly views now show TWO metrics side-by-side:
   - "Cumulative (Comparative)" - Sales up to the same day/hour, comparing apples-to-apples
   - "Full Period Total" - Total sales for the entire week/month
2. ✅ SMART COMPARISON: The percentage change shows fair comparison (same timeframe last week/month)
3. ✅ PIXEL-PERFECT ALIGNMENT: Fixed-height rows ensure amounts align perfectly
4. ✅ RESPONSIVE DESIGN: Works on mobile and desktop
5. ✅ HEBREW RTL: Full Hebrew support with proper RTL layout
6. ✅ INTERACTIVE GRAPH: Clickable bar charts filter the data
7. ✅ SWIPE NAVIGATION: Users can swipe between periods

YOUR MISSION:
1. Review the code for quality, performance, and UX
2. Identify any issues or improvements
3. Grade on a scale of 1-10
4. Provide specific recommendations

תני את הסקירה בעברית עם הסברים טכניים ברורים. תני ציון סופי.
"""

    prompt = f"""
# 🎓 CODE REVIEW: Sales Dashboard Component

## 📄 FILE: Sales Dashboard
Path: {sales_path}
Lines: ~1000

```javascript
{sales_code}
```

---

## 🎯 YOUR TASK: REVIEW & GRADE

Please provide a detailed review covering:
1. **Code Quality** - Structure, readability, maintainability
2. **Performance** - Any potential issues or optimizations
3. **UX/UI** - User experience and design implementation
4. **Business Logic** - The "apples to apples" comparison logic
5. **Accessibility & RTL** - Hebrew support and accessibility

Final Grade: X/10
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
        print("🌸 MAYA'S CODE REVIEW & GRADE - SALES DASHBOARD")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_review()
