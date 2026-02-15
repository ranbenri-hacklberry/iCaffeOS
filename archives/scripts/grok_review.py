import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-code-fast-1"

def ask_maya_followup():
    # Note: Double curly braces for f-string escaping
    prompt = f"""
# 🆘 FOLLOW UP: IT'S STILL DOUBLE!

Hi Maya,

I implemented your exact fix (ID-based filtering in `useMemo`).
**The result: The duplicate group persists.** 😱

This means `optionsGroup` detects ONE group, but `others` still lets ANOTHER group through.
Implies: **There are TWO distinct group objects with DIFFERENT IDs.**

**Here is the SQL verification I ran on the database:**
```json
[
  {{ "group_name": "בסיס משקה", "value_count": 2 }},
  {{ "group_name": "טמפרטורה", "value_count": 2 }},
  {{ "group_name": "אפשרויות", "value_count": 2 }},
  {{ "group_name": "סוג חלב", "value_count": 3 }},
  {{ "group_name": "חוזק", "value_count": 3 }},
  {{ "group_name": "קצף", "value_count": 4 }}
]
```
The DB says there is ONLY ONE "Options" group ("אפשרויות").

**So where does the 'Ghost Group' come from?**
1. Is it possible `optionGroups` (the input prop to the modal) contains data merging from TWO sources (Local Dexie + Remote Supabase) that failed to dedup?
2. Is there a hidden character in the name?
3. Could `useLiveQuery` be returning a stale cached version + a fresh fetched version concatenated?

**Please look at the Data Fetching logic (at the start of the component) and tell me:**
How can I enforce **STRICT DEDUPLICATION by ID** on the raw `optionGroups` array *before* it even reaches the `useMemo` logic?

I need a snippet to sanitize `dexieOptions + remoteData` into a purely unique set based on `id` and `name`.
"""
    
    print(f"🚀 Sending FOLLOW-UP to Maya (Grok {MODEL})...")
    
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
                    {"role": "system", "content": "You are Maya. You provided a fix, but it failed. Now you must dig deeper into the Data Merging strategy."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 8000
            }
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "━" * 60)
        print("🌸 MAYA'S FOLLOW-UP ANALYSIS")
        print("━" * 60 + "\n")
        content = result['choices'][0]['message'].get('content', 'No content returned')
        print(content)
        
        with open("MAYA_FOLLOWUP.md", "w", encoding="utf-8") as f:
            f.write(f"# Maya's Follow-up\n\n{content}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    ask_maya_followup()
