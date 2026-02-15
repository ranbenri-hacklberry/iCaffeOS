#!/bin/bash

echo "🔍 Verifying System Health..."

# 1. Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is NOT running. Please open OrbStack."
else
    echo "✅ Docker is running."
    
    # 2. Check Supabase Container
    if docker ps | grep -q "supabase_db_scarlet-zodiac"; then
        echo "✅ Local Database Container is UP."
    else
        echo "❌ Local Database Container is DOWN or Missing."
    fi
fi

# 3. Check Local Supabase URL
echo "🔍 Checking Local Supabase connectivity..."
if curl -s -f http://localhost:54321/rest/v1/ > /dev/null; then
    echo "✅ Local Supabase is answering at http://localhost:54321"
else
    echo "❌ Local Supabase is NOT accessible at http://localhost:54321"
fi

# 4. Check Backend Server
echo "🔍 Checking Backend Server..."
HEALTH=$(curl -s http://localhost:8081/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Backend Server is UP: $HEALTH"
else
    echo "❌ Backend Server is DOWN or Unhealthy"
fi

# 5. Check Frontend Proxy
echo "🔍 Checking Frontend Proxy..."
PROXY=$(curl -s http://localhost:4028/health)
if [[ $PROXY == *"ok"* ]]; then
    echo "✅ Frontend Proxy is UP: $PROXY"
else
    echo "❌ Frontend Proxy is DOWN or Misconfigured (Got: $PROXY)"
fi

echo "---"
echo "👉 If Docker is down, open 'OrbStack' and ensure the containers are running."
