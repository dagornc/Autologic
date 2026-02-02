#!/bin/bash

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/Code/Backend/Phase2-Inference/01_Reasoning"
FRONTEND_DIR="$PROJECT_ROOT/Code/Frontend"
VENV_DIR="$PROJECT_ROOT/.venv"

# ANSI Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🦖 Initializing AutoLogic...${NC}"

# Function to check command availability
check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it to proceed.${NC}"
        exit 1
    fi
}

# 1. Check Prerequisites
echo -e "${YELLOW}🔍 Checking system requirements...${NC}"
check_cmd python3
check_cmd node
check_cmd npm

# 2. Setup/Check Virtual Environment
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv "$VENV_DIR"
fi

# 3. Activate Virtual Environment & Install Dependencies
echo -e "${YELLOW}🔌 Activating virtual environment...${NC}"
source "$VENV_DIR/bin/activate"

if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
    echo -e "${YELLOW}⬇️  Checking/Installing python dependencies...${NC}"
    # Quiet install to reduce noise, remove -q to see output
    pip install -r "$PROJECT_ROOT/requirements.txt" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
         echo -e "${RED}❌ Failed to install dependencies. Check requirements.txt${NC}"
         exit 1
    fi
else
    echo -e "${RED}⚠️  requirements.txt not found!${NC}"
fi

# 4. Start Backend
echo -e "${GREEN}🚀 Starting Backend (uvicorn)...${NC}"
cd "$BACKEND_DIR" || { echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"; exit 1; }

# Start uvicorn in background
# Using standard port 8000
python3 -m uvicorn autologic.main:app --reload --host 0.0.0.0 --port 8000 --loop asyncio > "$PROJECT_ROOT/Log/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${BLUE}ℹ️  Backend PID: $BACKEND_PID${NC}"

# 5. Start Frontend
echo -e "${GREEN}🎨 Starting Frontend (vite)...${NC}"
cd "$FRONTEND_DIR" || { echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"; kill $BACKEND_PID; exit 1; }

# Install frontend deps if node_modules missing
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies (npm install)...${NC}"
    npm install > /dev/null 2>&1
fi

# Start vite in background
npm run dev > "$PROJECT_ROOT/Log/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${BLUE}ℹ️  Frontend PID: $FRONTEND_PID${NC}"

# 6. Open Browser
echo -e "${GREEN}🌍 Opening Google Chrome...${NC}"
# Sleep briefly to give servers time to spin up
sleep 3
open -a "Google Chrome" "http://localhost:5173"

echo -e "${GREEN}✅ AutoLogic is running!${NC}"
echo -e "${BLUE}   Backend: http://localhost:8000${NC}"
echo -e "${BLUE}   Frontend: http://localhost:5173${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop servers.${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down AutoLogic...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
