#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║           icaffeOS - Start All Servers Script                 ║
# ║                                                               ║
# ║  Starts: Ollama, Backend, Frontend, SMS Gateway, Frigate      ║
# ╚═══════════════════════════════════════════════════════════════╝

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Log directory
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}           ${MAGENTA}☕ icaffeOS Server Startup${NC}                         ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to start a service
start_service() {
    local name="$1"
    local port="$2"
    local command="$3"
    local log_file="$LOG_DIR/${name}_${TIMESTAMP}.log"

    echo -ne "${YELLOW}⏳ Starting ${name}...${NC}"

    if check_port $port; then
        echo -e "\r${GREEN}✅ ${name} already running on port ${port}${NC}     "
        return 0
    fi

    # Start the service in background
    cd "$SCRIPT_DIR"
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!

    # Wait a bit and check if it started
    sleep 2

    if check_port $port; then
        echo -e "\r${GREEN}✅ ${name} started (PID: $pid, Port: $port)${NC}     "
        return 0
    else
        # Give it more time for slower services
        sleep 3
        if check_port $port; then
            echo -e "\r${GREEN}✅ ${name} started (PID: $pid, Port: $port)${NC}     "
            return 0
        else
            echo -e "\r${RED}❌ ${name} failed to start - check $log_file${NC}     "
            return 1
        fi
    fi
}

# ════════════════════════════════════════════════════════════════
# 1. OLLAMA (Port 11434)
# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 Ollama AI Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v ollama &> /dev/null; then
    start_service "Ollama" 11434 "ollama serve"
else
    echo -e "${YELLOW}⚠️  Ollama not installed - skipping${NC}"
fi

# ════════════════════════════════════════════════════════════════
# 2. BACKEND SERVER (Port 8081)
# ════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🖥️  Backend Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "$SCRIPT_DIR/backend_server.js" ]; then
    start_service "Backend" 8081 "node backend_server.js"
else
    echo -e "${YELLOW}⚠️  backend_server.js not found - skipping${NC}"
fi

# ════════════════════════════════════════════════════════════════
# 3. SMS GATEWAY (Port 8085)
# ════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📱 SMS Gateway${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "$SCRIPT_DIR/sms-server.js" ]; then
    start_service "SMS Gateway" 8085 "node sms-server.js"
else
    echo -e "${YELLOW}⚠️  sms-server.js not found - skipping${NC}"
fi

# ════════════════════════════════════════════════════════════════
# 4. FRIGATE (Port 5050)
# ════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📹 Frigate NVR${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v docker &> /dev/null; then
    # Check if frigate container exists
    if docker ps -a --format '{{.Names}}' | grep -q '^frigate$'; then
        echo -ne "${YELLOW}⏳ Starting Frigate...${NC}"
        docker start frigate > /dev/null 2>&1
        sleep 3
        if check_port 5050; then
            echo -e "\r${GREEN}✅ Frigate started (Docker, Port: 5050)${NC}     "
        else
            echo -e "\r${YELLOW}⚠️  Frigate container started but port not ready yet${NC}     "
        fi
    else
        echo -e "${YELLOW}⚠️  Frigate container not found - skipping${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not installed - skipping Frigate${NC}"
fi

# ════════════════════════════════════════════════════════════════
# 5. FRONTEND DEV SERVER (Port 4028) - Opens in new Terminal
# ════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⚛️  Frontend Dev Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "$SCRIPT_DIR/package.json" ]; then
    if check_port 4028; then
        echo -e "${GREEN}✅ Frontend already running on port 4028${NC}"
    else
        echo -e "${YELLOW}⏳ Opening Frontend in new Terminal window...${NC}"
        osascript -e "tell application \"Terminal\"
            activate
            do script \"cd '$SCRIPT_DIR' && npm run dev\"
        end tell" 2>/dev/null

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Frontend Terminal opened - check the new window${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not open Terminal. Run manually:${NC}"
            echo -e "${CYAN}   cd $SCRIPT_DIR && npm run dev${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  package.json not found - skipping${NC}"
fi

# ════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                    ${GREEN}Server Status Summary${NC}                    ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check all ports
services=(
    "Frontend Dev|4028|http://localhost:4028"
    "Backend API|8081|http://localhost:8081"
    "SMS Gateway|8085|http://localhost:8085"
    "Ollama|11434|http://localhost:11434"
    "Frigate|5050|http://localhost:5050"
)

for service in "${services[@]}"; do
    IFS='|' read -r name port url <<< "$service"
    if check_port $port; then
        echo -e "  ${GREEN}●${NC} ${name}: ${GREEN}Online${NC} → ${CYAN}$url${NC}"
    else
        echo -e "  ${RED}●${NC} ${name}: ${RED}Offline${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📁 Logs saved to: $LOG_DIR${NC}"
echo ""
echo -e "${GREEN}🚀 Startup complete!${NC}"
echo ""
