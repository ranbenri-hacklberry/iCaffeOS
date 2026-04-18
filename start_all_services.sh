#!/bin/bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# iCaffeOS Auto-Start Script
# This script starts all necessary services for iCaffeOS

echo "🚀 Starting iCaffeOS Services..."

# Change to project directory
cd /Users/icaffeos/icaffeos

# 1. Start Ollama (if not running)
if ! pgrep -x "ollama" > /dev/null; then
    echo "🧠 Starting Ollama..."
    nohup ollama serve > /dev/null 2>&1 &
    sleep 5
fi

# 2. Start MCP Qwen Server
echo "🤖 Starting MCP Qwen Server..."
cd mcp-qwen-server
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi
nohup node server.js > ../mcp-qwen-server.log 2>&1 &
cd ..

# 3. Start Backend
echo "⚙️ Starting Backend Server..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi
nohup npm start > ../backend.log 2>&1 &
cd ..

# 4. Start Frontend Development Server
echo "🌐 Starting Frontend Dev Server..."
cd frontend_source
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi
nohup npm run dev > ../frontend-dev.log 2>&1 &
cd ..

# 5. Wait a bit for services to start
sleep 10

# 6. Start Electron App
echo "🖥️ Starting Electron App..."
cd frontend_source
# disabled by user request: # DISABLED: npx electron . > ../electron.log 2>&1 &
cd ..

echo "✅ All services started!"
echo "📊 Check logs in project directory for any issues"