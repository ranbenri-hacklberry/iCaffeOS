#!/bin/bash
echo "🚀 Starting QA Dashboard..."

# Ensure we are in the root
# cd /Users/user/.gemini/antigravity/scratch/my_app

# 1. Setup Backend
echo "📦 Check/Install Backend..."
cd qa-dashboard/backend
if [ ! -d "venv" ]; then
    echo "Creating Python venv..."
    python3 -m venv venv
fi
source venv/bin/activate

echo "Installing requirements (this might take a moment)..."
pip install -r requirements.txt > /dev/null 2>&1
playwright install > /dev/null 2>&1

echo "🔥 Starting FastAPI..."
uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/qa_system.log 2>&1 &
BACKEND_PID=$!
cd ../..

# 2. Setup Frontend
echo "🎨 Starting Frontend..."
cd qa-dashboard/frontend
# echo "Installing npm deps..."
# npm install > /dev/null 2>&1 # Assuming already installed via create-next-app
npm run dev -- -p 3005 > /tmp/frontend_system.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo "------------------------------------------------"
echo "✅ SYSTEM OPERATIONAL"
echo "👉 Dashboard: http://localhost:3005"
echo "👉 Backend:   http://localhost:8000"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop. Logs saved to /tmp/qa_system.log"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
tail -f /tmp/qa_system.log

