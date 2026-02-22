#!/bin/bash
set -a
source /Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local
set +a

# Map VITE_ variables to backend expected names
# SYNC Logic: Gateway should point to the same DB as the frontend
if [ "$IS_LOCAL_MODE" = "true" ]; then
    echo "🏠 Cortex Gateway: Operating in LOCAL mode"
    export SUPABASE_URL=$VITE_LOCAL_SUPABASE_URL
    # Local Supabase often uses the same key for anon and service during dev, 
    # but we search for the service key specifically.
    if [ -n "$VITE_LOCAL_SUPABASE_SERVICE_KEY" ]; then
        export SUPABASE_SERVICE_ROLE_KEY=$VITE_LOCAL_SUPABASE_SERVICE_KEY
    else
        export SUPABASE_SERVICE_ROLE_KEY=$VITE_LOCAL_SUPABASE_ANON_KEY
    fi
else
    echo "☁️ Cortex Gateway: Operating in CLOUD mode"
    export SUPABASE_URL=$VITE_SUPABASE_URL
    if [ -n "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
        export SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY
    else
        export SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
    fi
fi

export GEMINI_API_KEY=$VITE_GEMINI_API_KEY
export GEMINI_MODEL=gemini-3.1-pro-preview
export ALLOWED_ORIGINS="http://localhost:4028,http://localhost:5173,http://localhost:3000"

echo "🔗 Supabase URL: $SUPABASE_URL"

source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
