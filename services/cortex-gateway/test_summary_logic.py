import os
import asyncio
from supabase import create_client
from dotenv import load_dotenv
import google.generativeai as genai

# Load env
load_dotenv("/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local")
url = os.getenv("VITE_LOCAL_SUPABASE_URL")
key = os.getenv("VITE_LOCAL_SUPABASE_SERVICE_KEY") or os.getenv("VITE_LOCAL_SUPABASE_ANON_KEY")
gemini_key = os.getenv("VITE_GEMINI_API_KEY")

print(f"Gemini Key: {gemini_key[:5]}...")

# Setup
sb = create_client(url, key)
genai.configure(api_key=gemini_key)

# The classes we built (simulated or imported)
from core.context_engine import ContextEngine
from core.prompt_builder import SystemPromptBuilder

async def run_test():
    engine = ContextEngine(sb)
    builder = SystemPromptBuilder(sb)
    
    record_id = "dab6c145-0b9c-445b-b99d-20b5b9a76dc5"
    
    # Get tenant
    res = sb.table("cases").select("tenant_id").eq("id", record_id).single().execute()
    tenant_id = res.data["tenant_id"]
    
    biz_res = sb.table("business_config").select("business_type").eq("id", tenant_id).single().execute()
    biz_type = biz_res.data["business_type"]
    
    print(f"Testing for Tenant: {tenant_id}, Record: {record_id}")
    
    # Fetch context
    context = await engine.fetch_context(biz_type, record_id, tenant_id)
    record_str = engine.format_context_for_prompt(context)
    
    # Fetch docs
    docs = await engine.fetch_extracted_documents(record_id, tenant_id)
    print(f"Loaded {len(docs)} documents.")
    
    # Build prompt
    config = await builder.get_business_config(tenant_id)
    system_prompt = builder.build(biz_type, config, record_str, docs, tone="professional")
    
    query = "תן לי סיכום קצר ותמציתי של התיק הזה על סמך המסמכים. ישר לעניין."
    
    full_prompt = f"{system_prompt}\n\n# USER QUERY\n{query}"
    
    print("--- GENERATING SUMMARY ---")
    model = genai.GenerativeModel("gemini-1.5-pro-preview-0514") # Or use your env var
    # Note: I will use the actual model name from the search if possible, or fallback.
    # The user asked for gemini-3.1-pro-preview, let is use that if it exists.
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-pro-preview-0409")
    
    # Actually, the user specifically mentioned gemini-3.1-pro-preview.
    # I should try to use the one I configured in start.sh
    model_name = "gemini-3.1-pro-preview"
    
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(full_prompt)
        print(response.text)
        print("\n--- TOKEN USAGE ---")
        print(f"Prompt: {response.usage_metadata.prompt_token_count}")
        print(f"Response: {response.usage_metadata.candidates_token_count}")
    except Exception as e:
        print(f"Error calling Gemini: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
