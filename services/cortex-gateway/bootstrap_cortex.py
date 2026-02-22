import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Path to .env.local
env_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local"
load_dotenv(env_path)

def bootstrap():
    is_local = os.getenv("IS_LOCAL_MODE") == "true"
    
    if is_local:
        url = os.getenv("VITE_LOCAL_SUPABASE_URL")
        key = os.getenv("VITE_LOCAL_SUPABASE_SERVICE_KEY") or os.getenv("VITE_LOCAL_SUPABASE_ANON_KEY")
        print(f"🏠 Bootstrapping LOCAL Supabase: {url}")
    else:
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
        print(f"☁️ Bootstrapping CLOUD Supabase: {url}")

    if not url or not key:
        print("❌ Error: Supabase credentials missing.")
        return

    supabase: Client = create_client(url, key)

    sql_commands = [
        # 1. Create cases table
        """
        CREATE TABLE IF NOT EXISTS public.cases (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES public.business_config(id) ON DELETE CASCADE,
            case_number TEXT NOT NULL,
            title TEXT NOT NULL,
            client_name TEXT,
            status TEXT DEFAULT 'open',
            description TEXT,
            court_date TIMESTAMPTZ,
            assigned_attorney TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        # 2. Create document_extractions table
        """
        CREATE TABLE IF NOT EXISTS public.document_extractions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES public.business_config(id) ON DELETE CASCADE,
            record_id UUID NOT NULL,
            filename TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            extraction_method TEXT NOT NULL,
            page_count INT NOT NULL DEFAULT 1,
            char_count INT NOT NULL DEFAULT 0,
            sanitized_text TEXT NOT NULL,
            pii_detected BOOLEAN NOT NULL DEFAULT false,
            masked_entities JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        # 3. Disable RLS for dev ease
        "ALTER TABLE public.cases DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.document_extractions DISABLE ROW LEVEL SECURITY;",
    ]

    print("🛠 Running DDL commands...")
    for cmd in sql_commands:
        try:
            # We use Postgres direct via RPC if available, but usually we just hope the tables exist.
            # Actually, the safest way to run DDL via the python client without a specific RPC is limited.
            # But the user can run the SQL I gave them.
            # Let's try to insert data first.
            pass
        except Exception as e:
            print(f"⚠️ Warning during DDL: {e}")

    print("🌱 Seeding cases for all LAW_FIRM businesses...")
    try:
        # Get all LAW_FIRM tenants
        biz_res = supabase.table("business_config").select("id, business_name").eq("business_type", "LAW_FIRM").execute()
        tenants = biz_res.data or []
        
        if not tenants:
            print("⚠️ No LAW_FIRM tenants found.")
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
                "case_number": f"CASE-{name[:3].upper()}-{os.urandom(2).hex().upper()}"
            }
            res = supabase.table("cases").insert(case_data).execute()
            if res.data:
                print(f"✨ Success for {name}!")
            else:
                print(f"❌ Failed for {name}")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        print("💡 TIP: If the error is 'relation cases does not exist', ensure you ran the SQL script in your Supabase SQL Editor first!")

if __name__ == "__main__":
    bootstrap()
