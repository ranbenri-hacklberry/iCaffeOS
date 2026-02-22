import os
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local"
load_dotenv(env_path)

def check_docs():
    is_local = os.getenv("IS_LOCAL_MODE") == "true"
    if is_local:
        url = os.getenv("VITE_LOCAL_SUPABASE_URL")
        key = os.getenv("VITE_LOCAL_SUPABASE_SERVICE_KEY") or os.getenv("VITE_LOCAL_SUPABASE_ANON_KEY")
    else:
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

    sb: Client = create_client(url, key)
    print(f"Checking DB: {url}")
    
    docs = sb.table("document_extractions").select("*").execute()
    print(f"Total documents in extractions: {len(docs.data)}")
    for d in docs.data:
        print(f" - {d['filename']} (Size: {d['char_count']}, Record: {d['record_id']})")
    
    cases = sb.table("cases").select("*").execute()
    print(f"Total cases: {len(cases.data)}")
    for c in cases.data:
        print(f" [CASE] ID: {c['id']}, Title: {c['title']}, Client: {c['client_name']}")

if __name__ == "__main__":
    check_docs()
