#!/bin/bash

# AutoGIS Setup Script
# Автоматическая установка Node.js и зависимостей

set -e

echo "🚀 AutoGIS - Инициализация проекта"
echo "=================================="

PROJECT_ROOT="/Users/user/Desktop/autogis"

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo ""
    echo "❌ Node.js не найден"
    echo ""
    echo "Пожалуйста, установите Node.js одним из способов:"
    echo ""
    echo "1️⃣  Через Homebrew (рекомендуется):"
    echo "   brew install node"
    echo ""
    echo "2️⃣  Через официальный сайт:"
    echo "   https://nodejs.org/ (скачайте LTS версию для Mac ARM64)"
    echo ""
    echo "3️⃣  После установки Node.js запустите этот скрипт снова"
    exit 1
fi

echo "✅ Node.js найден: $(node --version)"
echo "✅ npm найден: $(npm --version)"

# Проверка Go
if ! command -v go &> /dev/null; then
    echo "❌ Go не установлен"
    exit 1
fi
echo "✅ Go найден: $(go version)"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker не найден (требуется для PostgreSQL)"
    echo "   Установите Docker Desktop: https://www.docker.com/products/docker-desktop"
fi

echo ""
echo "📦 Установка зависимостей..."
echo ""

# Backend
echo "→ Backend (Go)..."
cd "$PROJECT_ROOT/backend"
go mod download
go mod tidy
echo "✅ Backend зависимости установлены"

# Frontend
echo ""
echo "→ Frontend (Node.js)..."
cd "$PROJECT_ROOT/front"
npm install
echo "✅ Frontend зависимости установлены"

echo ""
echo "✨ Готово!"
echo ""
echo "🚀 Для запуска проекта используйте:"
echo ""
echo "   cd $PROJECT_ROOT"
echo "   ./quickstart.sh"
echo ""
echo "   или вручную:"
echo ""
echo "   # Терминал 1 (PostgreSQL):"
echo "   cd backend && docker-compose up -d"
echo ""
echo "   # Терминал 2 (Backend):"
echo "   cd backend && go run cmd/server/main.go"
echo ""
echo "   # Терминал 3 (Frontend):"
echo "   cd front && npm run dev"
echo ""
echo "📍 Приложение: http://localhost:5173"
