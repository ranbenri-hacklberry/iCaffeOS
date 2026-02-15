import requests
import json
import os

# API Keys
API_KEY = "xai-8AlRjQI4PBNJuGTGWnbl2S5Z5aKODCxDAaCyOqIIRv1zCIqpZo72nhEnCtrI89iuePPeCqfk4OHlAcj3"
MODEL = "grok-beta"

def get_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"File {path} not found"

def ask_grok_review():
    # Read relevant files
    kds_screen = get_file_content("frontend_source/src/pages/kds/components/KDSInventoryScreen.jsx")
    fix_sql = get_file_content("FIX_UUID_ID_MAPPING.sql")
    
    prompt = f"""
# 🚨 CRITICAL CODE REVIEW REQUEST: UUID vs INT Mismatch Fix

## 🛑 The Problem
We are encountering a critical error when users try to "Confirm Receipt" in the KDS Inventory Screen.
Error: `invalid input syntax for type integer: "1d956f97-5c64-4814-ba7e-7c5df94a226c"`

Diagnosis:
- `catalog_items.id` is a UUID (Global Catalog).
- `inventory_items.catalog_item_id` and `catalog_item_suppliers.catalog_item_id` were created as INTEGERs (expecting legacy local IDs).
- The RPC function `receive_inventory_shipment` defined parameters as INT.

## 🛠️ The Proposed Fix (FIX_UUID_ID_MAPPING.sql)
I have written a migration script to:
1. Convert `catalog_item_id` columns in `inventory_items`, `catalog_item_suppliers`, and `inventory_logs` to UUID.
2. Update the `receive_inventory_shipment` RPC function to accept UUIDs.

## 📂 The Code

### FIX_UUID_ID_MAPPING.sql (The Migration & RPC Update)
```sql
{fix_sql}
```

### KDSInventoryScreen.jsx (Frontend Usage)
```javascript
{kds_screen}
```

## 🎯 Questions for Maya
1. **Safety Check:** Is the `ALTER COLUMN ... TYPE UUID USING ...` syntax safe for production data preservation?
2. **Completeness:** Did I miss any tables or columns that likely reference `catalog_item_id` based on standard patterns?
3. **Logic:** Does the updated RPC function correctly handle the fallback logic (finding item by UUID, then falling back to creating new)?
4. **Frontend:** Does the frontend code need any changes, or will sending UUID strings to the new RPC just work?

Please provide a detailed review in Hebrew.
"""
    
    print(f"🚀 שולח את התיקון לבדיקה של מאיה...")
    
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
                    {"role": "system", "content": "You are Maya, a senior software architect. Review the provided database migration and code fix for a UUID vs Integer type mismatch assignment."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "━" * 60)
        print("🌸 תשובה ממאיה (Grok Architect)")
        print("━" * 60 + "\n")
        print(result['choices'][0]['message'].get('content', 'No content returned'))
        print("\n" + "━" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")

if __name__ == "__main__":
    ask_grok_review()
