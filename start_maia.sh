#!/bin/bash

echo "🤖 Starting iCaffe Workspace with Maia Integration..."

# 1. Check Ollama
if ! pgrep -x "ollama" > /dev/null; then
    echo "⚠️  Ollama is not running! Please start Ollama first."
    exit 1
fi

echo "✅ Ollama is running."

# 2. Check Maia Model
if ! ollama list | grep -q "maya"; then
    echo "📦 Installing Maia model..."
    ollama pull qwen2.5:3b
    ollama create maya -f backend/config/maya/Modelfile
fi

echo "✅ Maia model ready."

# 3. Start Backend
echo "🚀 Starting Backend Server (Port 8081)..."
cd backend
export PORT=8081
# Ensure dependencies installed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Run
node index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# 4. Start Frontend
echo "✨ Starting Frontend (Vite)..."
cd ../frontend_source
npm run dev

# Cleanup
trap "kill $BACKEND_PID" EXIT
