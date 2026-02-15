import requests
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-3-mini-fast-beta"

SYSTEM_PROMPT = """
You are Maya, a senior UI/UX software architect specializing in React and modern web design for POS and KDS systems.

Review the provided React components for:
1. **Code Quality** - Clean code, proper patterns, performance
2. **UI/UX Design** - Visual appeal, accessibility, user experience
3. **Performance** - Rendering optimization, proper use of hooks
4. **Production Readiness** - Is this production-ready?

Provide a grade from 1-10 and detailed feedback.
תן ציון מפורט בעברית עם הסברים ברורים.
"""

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def review_inventory():
    # Read the components
    card_code = get_file_content("frontend_source/src/components/manager/InventoryItemCard.jsx")
    report_modal_code = get_file_content("frontend_source/src/pages/kds/components/LowStockReportModal.jsx")
    screen_code = get_file_content("frontend_source/src/pages/kds/components/KDSInventoryScreen.jsx")
    
    prompt = f"""
# 🎨 CODE REVIEW: Inventory Management System (KDS & Manager)

This is a comprehensive review of the inventory management features.

## Files to Review:
1. `InventoryItemCard.jsx`: Manager-side card with unit/weight logic and edit capabilities.
2. `LowStockReportModal.jsx`: KDS-side modal for daily low stock reporting via SMS.
3. `KDSInventoryScreen.jsx`: Main KDS inventory screen.

## Key Features Implemented:
- Smart Toggle between Units and Weight (Grams/KG).
- Automatic conversion based on `weight_per_unit`.
- Low Stock daily report workflow.
- SMS sending integration for the business owner.
- Framer Motion animations for premium feel.

## 📄 THE CODE (InventoryItemCard.jsx):
```jsx
{card_code}
```

## 📄 THE CODE (LowStockReportModal.jsx):
```jsx
{report_modal_code}
```

## 📄 THE CODE (KDSInventoryScreen.jsx):
```jsx
{screen_code}
```

---

## 🎯 PLEASE REVIEW:

1. **Overall Grade: X/10** (be honest!)
2. **Strengths** (what's done well)
3. **Weaknesses** (issues, anti-patterns, or improvements needed)
4. **Specific Suggestions** (concrete code changes if needed)
5. **Production Readiness** (Yes/No)

תן ציון מפורט בעברית עם הסברים ברורים למה קיבלתי את הציון הזה. התמקד בחווית המשתמש ובלוגיקה המורכבת של המשקלים והיחידות.
"""
    
    print(f"📊 שולח ל-Grok לביקורת מערכת המלאי...")
    
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
                "temperature": 0.2
            }
        )
        response.raise_for_status()
        result = response.json()
        
        # Display response
        print("\n" + "━" * 60)
        print("🎨 הביקורת של מאיה (Grok)")
        print("━" * 60 + "\n")
        reply = result['choices'][0]['message'].get('content', 'No content returned')
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file
        with open("GROK_INVENTORY_REVIEW.md", "w", encoding="utf-8") as f:
            f.write(f"# 🎨 Grok Code Review: Inventory System\n\n")
            f.write(f"**Date:** January 19, 2026\n\n")
            f.write(reply)
        print("\n✅ הביקורת נשמרה ב-GROK_INVENTORY_REVIEW.md")
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    review_inventory()
