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
    onboarding_path = f"{base_path}/pages/onboarding"
    components_path = f"{onboarding_path}/components"
    tabs_path = f"{components_path}/menu-editor/editor/tabs"
    
    files_to_review = {
        "MenuDashboard.tsx": f"{components_path}/MenuReviewDashboard.tsx",
        "EditModal.tsx": f"{components_path}/menu-editor/editor/MenuItemEditModal.tsx",
        "TabProduction.tsx": f"{tabs_path}/TabProductionInventory.tsx",
        "TabVisuals.tsx": f"{tabs_path}/TabVisualsAI.tsx",
        "OnboardingStore.ts": f"{onboarding_path}/store/useOnboardingStore.ts"
    }
    
    system_prompt = """
You are Maya (מאיה), a senior software architect specializing in React, Modular Design, and AI Integration.
You are reviewing the REFACTORED "AI Menu Editor & Production System" module.

## RECENT ARCHITECTURAL CHANGES:
1. ✅ MODULARITY: The monolithic "Step3" was split into a Dashboard and a multi-tab Modal system.
2. ✅ TABS: Logic for Production, Visuals, and Modifiers now lives in dedicated tab components.
3. ✅ PRODUCTION LOGIC: Implemented a 3-way shift picker (Opening/Prep/Closing) and Daily Pars for inventory forecasting.
4. ✅ AI VISUALS: Added a 3D flip card effect for toggling between AI preview and visual source seeds.

## YOUR MISSION:
1. Audit the new Modular Architecture:
   - Does the split into tabs make sense?
   - Is state being passed efficiently between the Modal and the Tabs?
2. Deep Dive - Production Tab (`TabProductionInventory.tsx`):
   - Validate the daily par mapping and shift selection.
   - Check the Food Cost / Profitability calculations.
3. Deep Dive - AI Visuals Tab (`TabVisualsAI.tsx`):
   - Review the interaction model for Atmosphere Seeds and Container uploads.
   - Is the 3D flip implementation bug-free?
4. Store Consistency (`useOnboardingStore.ts`):
   - Review the `updateItem` and `setCategorySeed` logic.
   - Ensure the AI generation queue is robust.

תני את הסקירה בעברית עם הסברים טכניים ברורים.
ציין בעיות פוטנציאליות שעדיין קיימות.
תני ציון סופי מ-1 עד 10.
"""

    prompt = "# 🎨 CODE REVIEW: REFACTORED AI MENU EDITOR (MODULAR VERSION)\n\n"
    
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
1. Impact of the Refactoring (Readability, Maintainability).
2. Robustness of the new Production & Inventory features.
3. Quality of the AI Visuals integration.
4. UI/UX and RTL (Hebrew) integrity.
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
        print("🌸 MAYA'S NEW MENU EDITOR REVIEW")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file as well
        output_path = "/Users/user/.gemini/antigravity/scratch/my_app/GROK_MENU_EDITOR_NEW_REVIEW.md"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"# Grok New Menu Editor Review\n\n{reply}")
        
        print(f"\n📄 נשמר ב: {output_path}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    run_review()
