import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Path to .env.local
env_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local"
load_dotenv(env_path)

def audit_data():
    is_local = os.getenv("IS_LOCAL_MODE") == "true"
    if is_local:
        url = os.getenv("VITE_LOCAL_SUPABASE_URL")
        key = os.getenv("VITE_LOCAL_SUPABASE_SERVICE_KEY") or os.getenv("VITE_LOCAL_SUPABASE_ANON_KEY")
    else:
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

    supabase: Client = create_client(url, key)
    print(f"DATABASE: {url}")

    biz_res = supabase.table("business_config").select("*").order("created_at", desc=True).limit(10).execute()
    tenants = biz_res.data or []
    
    for biz in tenants:
        tid = biz["id"]
        name = biz["business_name"]
        ts = biz["created_at"]
        btype = biz["business_type"]
        print(f"\n[{ts}] {name} ({tid}) | Type: {btype}")
        
        # Check cases
        res = supabase.table("cases").select("id, title").eq("tenant_id", tid).execute()
        recs = res.data or []
        print(f"  Cases Count: {len(recs)}")
        for r in recs:
            print(f"    - {r['title']}")

audit_data()
