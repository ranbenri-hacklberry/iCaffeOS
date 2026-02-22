#!/bin/bash
# iCaffeOS Starter Script
echo "Starting iCaffeOS ecosystem..."

echo "Starting Cortex Gateway (Python)..."
cd /Users/user/.gemini/antigravity/scratch/my_app/services/cortex-gateway
./start.sh > cortex_output.log 2>&1 &
CORTEX_PID=$!

echo "Starting Frontend & Electron..."
cd /Users/user/.gemini/antigravity/scratch/my_app/frontend_source
npm run dev

echo "Shutting down..."
kill $CORTEX_PID
