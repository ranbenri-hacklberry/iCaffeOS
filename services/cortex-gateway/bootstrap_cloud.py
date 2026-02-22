import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Path to .env.local
env_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local"
load_dotenv(env_path)

def bootstrap_cloud():
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY")
    
    print(f"☁️ Bootstrapping CLOUD Supabase: {url}")

    if not url or not key:
        print("❌ Error: Cloud credentials missing.")
        return

    supabase: Client = create_client(url, key)

    print("🌱 Seeding cases for all LAW_FIRM businesses in CLOUD...")
    try:
        biz_res = supabase.table("business_config").select("id, business_name").eq("business_type", "LAW_FIRM").execute()
        tenants = biz_res.data or []
        
        if not tenants:
            print("⚠️ No LAW_FIRM tenants found in Cloud.")
            return

        for biz in tenants:
            tid = biz["id"]
            name = biz["business_name"]
            
            # Check if case exists
            existing = supabase.table("cases").select("id").eq("tenant_id", tid).eq("title", "תביעת אבהות").execute()
            if existing.data:
                print(f"✅ Case already exists for {name} ({tid})")
                continue
            
            print(f"➕ Inserting case for {name} ({tid})...")
            case_data = {
                "tenant_id": tid,
                "title": "תביעת אבהות",
                "client_name": "משה לוי",
                "description": "ניהול תיק תביעת אבהות בבית דין",
                "status": "open",
                "case_number": f"CASE-CLD-{os.urandom(2).hex().upper()}"
            }
            res = supabase.table("cases").insert(case_data).execute()
            if res.data:
                print(f"✨ Success for {name}!")
            else:
                print(f"❌ Failed for {name}")

    except Exception as e:
        print(f"❌ Error during cloud seeding: {e}")

if __name__ == "__main__":
    bootstrap_cloud()
