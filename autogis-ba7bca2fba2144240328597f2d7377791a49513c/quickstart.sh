#!/bin/bash

# AutoGIS Backend & Frontend Quick Start Script
# This script sets up and starts both backend and frontend

set -e

echo "🚀 AutoGIS Full Stack Startup"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "front" ]; then
    echo "❌ Error: Run this script from the autogis root directory"
    exit 1
fi

# Backend setup
echo -e "\n${BLUE}Setting up Backend...${NC}"

cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env created. Edit if needed for custom configuration."
fi

# Start Docker if not running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q autogis_postgres; then
    echo "📦 Starting PostgreSQL container..."
    docker-compose up -d
    sleep 5  # Wait for DB to start
fi

# Enable PostGIS
echo "🌍 Enabling PostGIS extension..."
PGPASSWORD=postgres psql -h localhost -U postgres -d auto_masters -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || true

# Check if go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.23+"
    exit 1
fi

# Download dependencies
echo "📥 Downloading Go dependencies..."
go mod download 2>/dev/null || true

echo -e "${GREEN}✅ Backend ready!${NC}"
echo -e "   Run: ${YELLOW}go run ./cmd/server${NC}"
echo -e "   Or:  ${YELLOW}make run${NC}"

# Frontend setup
echo -e "\n${BLUE}Setting up Frontend...${NC}"

cd ../front

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing npm dependencies (this may take a minute)..."
    npm install > /dev/null 2>&1
fi

echo -e "${GREEN}✅ Frontend ready!${NC}"
echo -e "   Run: ${YELLOW}npm run dev${NC}"

# Final instructions
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${BLUE}To start the full stack:${NC}"
echo ""
echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
echo -e "  cd backend"
echo -e "  go run ./cmd/server"
echo -e "  ${BLUE}(or make run)${NC}"
echo ""
echo -e "${YELLOW}Terminal 2 (Frontend):${NC}"
echo -e "  cd front"
echo -e "  npm run dev"
echo ""
echo -e "${BLUE}Access points:${NC}"
echo -e "  Frontend:  ${YELLOW}http://localhost:5173${NC}"
echo -e "  Backend:   ${YELLOW}http://localhost:3001${NC}"
echo -e "  API:       ${YELLOW}http://localhost:3001/api${NC}"
echo ""
echo -e "${BLUE}Database:${NC}"
echo -e "  Host:     ${YELLOW}localhost:5432${NC}"
echo -e "  User:     ${YELLOW}postgres${NC}"
echo -e "  Password: ${YELLOW}postgres${NC}"
echo -e "  Database: ${YELLOW}auto_masters${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  ${YELLOW}make docker-logs${NC}     - View PostgreSQL logs"
echo -e "  ${YELLOW}make psql${NC}            - Connect to database"
echo -e "  ${YELLOW}make docker-down${NC}     - Stop PostgreSQL"
echo -e "  ${YELLOW}make clean${NC}          - Clean build files"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
