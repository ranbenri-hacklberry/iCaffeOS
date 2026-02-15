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
    owner_settings_path = "frontend_source/src/pages/owner-settings/index.jsx"
    accountant_access_path = "frontend_source/src/components/settings/AccountantAccess.jsx"
    edge_function_path = "supabase/functions/google-auth/index.ts"
    
    owner_settings_code = get_file_content(owner_settings_path)
    accountant_access_code = get_file_content(accountant_access_path)
    edge_function_code = get_file_content(edge_function_path)
    
    system_prompt = """
You are Maya, a senior software architect specializing in secure integrations and cloud APIs.
You are reviewing a Google Drive integration for a POS system called icaffeOS.

THE IMPLEMENTATION INCLUDES:
1. 🔐 "Iron Dome" Architecture - Sensitive tokens stored in separate table with strict RLS
2. 🔄 Smart Token Refresh - Automatic token refresh wrapper
3. 📤 File Upload - Upload files to Drive with year/month folder structure
4. 🤝 Accountant Access - Share folders with external emails via Permissions API
5. 📦 Orders Backup - Export all orders to JSON and upload to Drive

YOUR MISSION:
1. Review the security of token handling
2. Review the error handling and edge cases
3. Check for code quality and maintainability
4. Grade the implementation (1-10)
5. Suggest improvements if needed

תני את הסקירה בעברית עם הסברים טכניים ברורים. תני ציון סופי.
"""

    prompt = f"""
# 🎓 CODE REVIEW: Google Drive Integration

## 📄 FILE 1: Owner Settings Page (Frontend)
Path: {owner_settings_path}
```javascript
{owner_settings_code}
```

## 📄 FILE 2: Accountant Access Component
Path: {accountant_access_path}
```javascript
{accountant_access_code}
```

## 📄 FILE 3: Google Auth Edge Function (Backend)
Path: {edge_function_path}
```typescript
{edge_function_code}
```

---

## 🎯 YOUR TASK: REVIEW & GRADE
Please provide a detailed review and grade based on the system prompt.
Focus on: Security, Error Handling, Code Quality, UX.
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
        print("🌸 MAYA'S CODE REVIEW & GRADE - GOOGLE DRIVE INTEGRATION")
        print("━" * 60 + "\n")
        print(reply)
        print("\n" + "━" * 60)
        
        # Save to file as well
        with open("GROK_DRIVE_REVIEW.md", "w", encoding="utf-8") as f:
            f.write(f"# Grok Google Drive Integration Review\n\n{reply}")
            
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    run_review()
