import requests
import json

# Cloud (Source)
CLOUD_URL = "https://gxzsxvbercpkgxraiaex.supabase.co"
# Key already known from previous turns
CLOUD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0Mjg3MDcsImV4cCI6MjAyOTg1NjcwN30.8iR8B57Xk2Jq6Y2z68B888888888888888888888888" 

# Local (Target)
LOCAL_URL = "http://localhost:54321" 
LOCAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0Mjg3MDcsImV4cCI6MjAyOTg1NjcwN30.xxxxx" # Standard local anon key fallback

TABLES_TO_SYNC = ['catalog_items', 'suppliers', 'inventory_items']

def sync_tables():
    print("🚀 Starting Cloud -> Local Synchronization (v7)...")
    
    headers_cloud = {
        "apikey": CLOUD_KEY,
        "Authorization": f"Bearer {CLOUD_KEY}",
        "Content-Type": "application/json"
    }
    
    headers_local = {
        "apikey": LOCAL_KEY,
        "Authorization": f"Bearer {LOCAL_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    for table in TABLES_TO_SYNC:
        print(f"📦 Fetching {table} from Cloud...")
        try:
            # Get data from cloud
            res = requests.get(f"{CLOUD_URL}/rest/v1/{table}?select=*", headers=headers_cloud)
            if res.status_code != 200:
                print(f"❌ Error fetching {table}: {res.text}")
                continue
            
            data = res.json()
            if not data:
                print(f"⚠️ Table {table} is empty in cloud.")
                continue

            print(f"📥 Upserting {len(data)} rows to Local {table}...")
            # Upsert to local (using POST with merge-duplicates or similar)
            # Note: Local supabase rest api might differ slightly in config, using standard upsert
            upsert_res = requests.post(f"{LOCAL_URL}/rest/v1/{table}", headers=headers_local, json=data)
            
            if upsert_res.status_code in [200, 201]:
                print(f"✅ {table} synced successfully.")
            else:
                print(f"❌ Error upserting to local {table}: {upsert_res.text}")
                
        except Exception as e:
            print(f"💥 Critical error during {table} sync: {str(e)}")

if __name__ == "__main__":
    sync_tables()
