import os
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = "/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local"
load_dotenv(env_path)

def clear_placeholders():
    is_local = os.getenv("IS_LOCAL_MODE") == "true"
    if is_local:
        url = os.getenv("VITE_LOCAL_SUPABASE_URL")
        key = os.getenv("VITE_LOCAL_SUPABASE_SERVICE_KEY") or os.getenv("VITE_LOCAL_SUPABASE_ANON_KEY")
    else:
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

    sb: Client = create_client(url, key)
    print(f"Clearing placeholders in DB: {url}")
    
    # Update all cases titled "תביעת אבהות" to have empty client_name and description
    # This prevents the AI from being hallucinated/polluted by my previous seed data.
    res = sb.table("cases").update({
        "client_name": "", 
        "description": "תיק תביעת אבהות - נתונים ייחולצו מהמסמכים המצורפים."
    }).eq("title", "תביעת אבהות").execute()
    
    print(f"Updated {len(res.data)} cases.")

if __name__ == "__main__":
    clear_placeholders()
