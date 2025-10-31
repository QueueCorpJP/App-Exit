#!/bin/bash

set -e

echo "======================================"
echo "AppExit Deployment Script"
echo "======================================"

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境を引数から取得（デフォルト: production）
ENV=${1:-production}

echo -e "${YELLOW}Environment: ${ENV}${NC}"
echo ""

# ルートディレクトリの確認
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}Error: ecosystem.config.js not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# 1. バックエンドのビルド
echo -e "${YELLOW}[1/4] Building backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo -e "${RED}Warning: backend/.env not found${NC}"
    echo "Please create .env file from .env.example"
fi

go build -o appexit-backend ./cmd/api
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend build successful${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

cd ..

# 2. フロントエンドの依存関係インストール
echo -e "${YELLOW}[2/4] Installing frontend dependencies...${NC}"
cd frontend/appexit

if [ ! -f ".env.local" ]; then
    echo -e "${RED}Warning: frontend/appexit/.env.local not found${NC}"
    echo "Please create .env.local file from .env.example"
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ npm install failed${NC}"
    exit 1
fi

# 3. フロントエンドのビルド
echo -e "${YELLOW}[3/4] Building frontend...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ../..

# 4. PM2でデプロイ
echo -e "${YELLOW}[4/4] Deploying with PM2...${NC}"

# PM2がインストールされているか確認
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}Error: PM2 is not installed${NC}"
    echo "Install PM2 with: npm install -g pm2"
    exit 1
fi

# 既存のプロセスを停止
echo "Stopping existing processes..."
pm2 stop all || true

# 新しいプロセスを起動
echo "Starting applications..."
pm2 start ecosystem.config.js --env ${ENV}

# プロセスリストを保存
pm2 save

echo ""
echo -e "${GREEN}======================================"
echo "Deployment completed successfully!"
echo "======================================${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View logs"
echo "  pm2 monit           - Monitor processes"
echo "  pm2 restart all     - Restart all applications"
echo ""
