#!/bin/bash

# ==========================================
# 🚀 SUPABASE LOCAL SETUP SCRIPT (sfat-hamidbar)
# Optimized for: Mac N150 Node (High Reliability)
# ==========================================

echo "🌟 Starting Setup for New Local Node..."

# 1. Check for Docker
if ! docker info > /dev/null 2>&1; then
  echo '❌ Error: Docker is not running. Please start Docker Desktop first.' >&2
  exit 1
fi

# 2. Install dependencies
echo "📦 Installing project dependencies..."
npm install

# 3. Pull Environment Variables
if [ ! -f .env.local ]; then
  echo "⚠️ .env.local not found. Copying from example..."
  cp .env.example .env.local
  echo "‼️ PLEASE EDIT .env.local AND ADD CLOUD & LOCAL SERVICE KEYS BEFORE PROCEEDING."
  exit 1
fi

# 4. Start Supabase (Local)
echo "🐳 Starting local Supabase containers..."
# --upgrade ensures we get latest versions of auth/rest etc.
npx supabase start

# 5. Schema & DDL Sync (The "Boss" Setup)
echo "📐 Checking Schema... (Face Embedding & Vectors)"
# Recommendation: Before Running this on N150, run:
# 'npx supabase login' and 'npx supabase link --project-ref <PROJECT_ID>'
# followed by 'npx supabase db pull' to ensure migrations/ contains 'face_embedding'.

echo "⚠️ WARNING: Proceeding to RESET local DB to match migrations/ folder."
npx supabase db reset

# 6. Mirror Cloud Data (Config/Menu)
echo "🔄 Synchronizing initial data from cloud..."
node scripts/sync_cloud_to_local.js 222

echo "✅ SETUP COMPLETE!"
echo "------------------------------------------------"
echo "🖥️ Local Studio: http://localhost:54323"
echo "🌐 API URL: http://localhost:54321"
echo "------------------------------------------------"

echo "🛠️ CRITICAL N150 CONFIGURATION:"
echo "1. PERSISTENCE: Data is stored in Docker Volumes. It survives restarts."
echo "   DO NOT run 'supabase stop --clean' unless you want to wipe data."
echo "2. AUTO-START: Set Docker Desktop to 'Start at Login'."
echo "3. RESTART POLICY: Supabase containers default to 'unless-stopped'."
echo "   They will resume automatically after power failure/boot."
echo "4. PERFORMANCE: N150 has limited CPU. If Studio is slow, it's normal."
echo "   The API (54321) is optimized and will be fast."
echo "------------------------------------------------"
echo "Next step: Run 'npm run dev' to start the application."
