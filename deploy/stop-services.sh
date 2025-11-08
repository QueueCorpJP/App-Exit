#!/bin/bash

# Service stop script for appexit.jp

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping appexit.jp services...${NC}"
echo ""

# Stop backend
if [ -f /tmp/appexit-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/appexit-backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm /tmp/appexit-backend.pid
        echo -e "${GREEN}Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend process not running${NC}"
        rm /tmp/appexit-backend.pid
    fi
else
    echo -e "${YELLOW}Backend PID file not found${NC}"
    # Try to kill by port
    if lsof -ti:8080 >/dev/null 2>&1; then
        echo "Killing process on port 8080..."
        lsof -ti:8080 | xargs kill -9
        echo -e "${GREEN}Backend stopped${NC}"
    fi
fi

# Stop frontend
if [ -f /tmp/appexit-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/appexit-frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm /tmp/appexit-frontend.pid
        echo -e "${GREEN}Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend process not running${NC}"
        rm /tmp/appexit-frontend.pid
    fi
else
    echo -e "${YELLOW}Frontend PID file not found${NC}"
    # Try to kill by port
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "Killing process on port 3000..."
        lsof -ti:3000 | xargs kill -9
        echo -e "${GREEN}Frontend stopped${NC}"
    fi
fi

echo ""
echo -e "${GREEN}All services stopped${NC}"
echo ""
