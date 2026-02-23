#!/bin/bash
# Backend Startup Script
# Keeps the backend running on port 8081

cd /Users/user/.gemini/antigravity/scratch/my_app/backend

echo "🚀 Starting iCaffe Backend on port 8081..."
export PORT=8081
node index.js
