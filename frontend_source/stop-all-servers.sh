#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║           icaffeOS - Stop All Servers Script                  ║
# ╚═══════════════════════════════════════════════════════════════╝

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}           ${RED}☕ icaffeOS Server Shutdown${NC}                        ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to stop service by port
stop_by_port() {
    local name="$1"
    local port="$2"

    local pids=$(lsof -t -i :$port 2>/dev/null)

    if [ -n "$pids" ]; then
        echo -ne "${YELLOW}⏳ Stopping ${name} (port $port)...${NC}"
        echo $pids | xargs kill -9 2>/dev/null
        sleep 1
        echo -e "\r${GREEN}✅ ${name} stopped${NC}                    "
    else
        echo -e "${YELLOW}⚠️  ${name} not running${NC}"
    fi
}

# Stop Frontend Dev Server (Port 4028)
stop_by_port "Frontend Dev Server" 4028

# Stop Backend Server (Port 8081)
stop_by_port "Backend Server" 8081

# Stop SMS Gateway (Port 8085)
stop_by_port "SMS Gateway" 8085

# Stop Ollama (Port 11434)
stop_by_port "Ollama" 11434

# Stop Frigate Docker container
echo -ne "${YELLOW}⏳ Stopping Frigate...${NC}"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^frigate$'; then
    docker stop frigate > /dev/null 2>&1
    echo -e "\r${GREEN}✅ Frigate stopped${NC}                    "
else
    echo -e "\r${YELLOW}⚠️  Frigate not running${NC}                    "
fi

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"
echo ""
