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
    prep_path = "frontend_source/src/pages/prep/index.jsx"
    manager_path = "frontend_source/src/components/manager/TasksManager.jsx"
    task_view_path = "frontend_source/src/components/kds/TaskManagementView.jsx"
    
    prep_code = get_file_content(prep_path)
    manager_code = get_file_content(manager_path)
    task_view_code = get_file_content(task_view_path)
    
    system_prompt = """
You are Maya, a senior software architect. You are reviewing the SECOND iteration of the Task Management system.
The human developer has implemented your previous suggestions!

CHANGES MADE IN THIS ITERATION:
1. 🏁 CENTRALIZED CATEGORIES: Created `src/config/taskCategories.js` to unify all naming and aliases.
2. 🏁 IMPROVED ERROR HANDLING: Added an animated error banner in `PrepPage` to notify users if a fetch or completion fails.
3. 🏁 PERFORMANCE: Wrapped `TaskCard` in `React.memo` and simplified render logic.
4. 🏁 CODE CLEANINESS: Removed hardcoded alias lists from components, replacing them with centralized logic.
5. 🏁 MOBILE UI: Refined `TaskManagementView` layout and z-index for better overlay behavior.

FEEDBACK FROM THE USER:
"Note that there won't be hundreds of tasks per day. It's a kitchen, not a factory, so extreme virtualization isn't a priority, but cleanliness and reliability are."

YOUR MISSION:
1. Review the NEW implementation of all files.
2. Compare with your previous feedback (7/10).
3. Grade the improvements.
4. Final Verdict for production.

תני את הסקירה בעברית עם הסברים טכניים ברורים. תני ציון סופי חדש.
"""

    prompt = f"""
# 🎓 CODE REVIEW: Task Management System

## 📄 FILE 1: Prep Page (Employee View)
Path: {prep_path}
```javascript
{prep_code}
```

## 📄 FILE 2: Tasks Manager (Admin/Manager View)
Path: {manager_path}
```javascript
{manager_code}
```

## 📄 FILE 3: Task Management View (Shared UI)
Path: {task_view_path}
```javascript
{task_view_code}
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
        print("🌸 MAYA'S CODE REVIEW & GRADE")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file as well
        with open("GROK_TASK_REVIEW.md", "w", encoding="utf-8") as f:
            f.write(f"# Grok Task Management Review\n\n{reply}")
            
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    run_review()
