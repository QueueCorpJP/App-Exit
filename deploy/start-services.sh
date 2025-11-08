#!/bin/bash

# Service startup script for appexit.jp
# Run this script to start both frontend and backend services

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the project root directory (parent of deploy/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}Starting appexit.jp services...${NC}"
echo "Project root: $PROJECT_ROOT"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing existing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Check and kill existing processes
if check_port 8080; then
    echo -e "${YELLOW}Backend already running on port 8080${NC}"
    kill_port 8080
fi

if check_port 3000; then
    echo -e "${YELLOW}Frontend already running on port 3000${NC}"
    kill_port 3000
fi

# Start Backend
echo -e "${GREEN}Starting backend...${NC}"
cd "$PROJECT_ROOT/backend"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: backend/.env file not found${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Build and start backend in background
echo "Building backend..."
go build -o bin/api ./cmd/api

echo "Starting backend on port 8080..."
nohup ./bin/api > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/appexit-backend.pid
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo ""
echo -e "${GREEN}Starting frontend...${NC}"
cd "$PROJECT_ROOT/frontend/appexit"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build frontend (for production)
echo "Building frontend..."
npm run build

# Start frontend in background
echo "Starting frontend on port 3000..."
nohup npm run start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/appexit-frontend.pid
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Services Started Successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Backend PID: $BACKEND_PID (port 8080)"
echo "Frontend PID: $FRONTEND_PID (port 3000)"
echo ""
echo "Logs:"
echo "  Backend:  tail -f $PROJECT_ROOT/backend/logs/backend.log"
echo "  Frontend: tail -f $PROJECT_ROOT/frontend/appexit/logs/frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Access your site at:"
echo "  https://appexit.jp"
echo ""
