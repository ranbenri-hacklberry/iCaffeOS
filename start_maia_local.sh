#!/bin/bash

# --- iCaffe Maia Local Runner ---

echo "☕ Checking Maia Config..."

# 1. Check if Maia Model Exists
if start_maia_local=$(ollama list | grep "maya"); then
    echo "✅ Maia model found."
else
    echo "⚠️  Maia model NOT found. Attempting to create from existing base model..."
    # Try creating without pulling
    if ollama create maya -f backend/config/maya/Modelfile; then
        echo "✅ Maia model created successfully!"
    else
        echo "❌ Failed to create Maia. Please run manually: ollama pull qwen2.5:3b && ollama create maya -f backend/config/maya/Modelfile"
        exit 1
    fi
fi

# 2. Check Backend Dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing Backend Dependencies..."
    cd backend && npm install && cd ..
fi

# 3. Start Backend (Background)
echo "🚀 Starting Backend on Port 3001..."
cd backend
export PORT=3001
# Run backend and save PID
node index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# 4. Start Frontend
echo "✨ Starting Frontend..."
cd ../frontend_source
# Open Frontend
npm run dev

# Cleanup
trap "kill $BACKEND_PID" EXIT
