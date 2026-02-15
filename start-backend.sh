#!/bin/bash
# Backend Startup Script
# Keeps the backend running on port 8081

cd /sessions/eager-intelligent-euler/mnt/my_app/backend

echo "🚀 Starting iCaffe Backend on port 8081..."
export PORT=8081
node index.js
