# 🚀 Инструкция по установке AutoGIS

## ⚠️ Требования

### Для Backend (Go):
- ✅ Go 1.21+ - **уже установлен на системе**
- ✅ PostgreSQL 14+ с PostGIS - **будет запущен через Docker**

### Для Frontend (React/TypeScript):
- ❌ Node.js 18+ - **НЕ установлен на системе** ⚠️
- ❌ npm - **НЕ установлен на системе** ⚠️

## 1️⃣ Установка Node.js (для фронтенда)

### На macOS (M1/M2/M3 - ARM64):

**Вариант 1: Через Homebrew (рекомендуется)**
```bash
brew install node
# или для последней версии:
brew install node@20
```

**Вариант 2: Через официальный установщик**
- Скачать с https://nodejs.org/ (LTS версию)
- Выбрать ARM64 версию для Mac

**Проверка установки:**
```bash
node --version   # должно показать v18.x или выше
npm --version    # должно показать 9.x или выше
```

## 2️⃣ Установка зависимостей

### Frontend:
```bash
cd /Users/user/Desktop/autogis/front
npm install
```

### Backend:
```bash
cd /Users/user/Desktop/autogis/backend
go mod download
go mod tidy
```

## 3️⃣ Запуск проекта

### Способ 1: Автоматизированный (рекомендуется)
```bash
cd /Users/user/Desktop/autogis
./quickstart.sh
```

### Способ 2: Ручной запуск

**Терминал 1 - База данных:**
```bash
cd /Users/user/Desktop/autogis/backend
docker-compose up -d
sleep 5
docker-compose exec postgres psql -U postgres -d autogis -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

**Терминал 2 - Backend:**
```bash
cd /Users/user/Desktop/autogis/backend
go run cmd/server/main.go
# или
make run
```

**Терминал 3 - Frontend:**
```bash
cd /Users/user/Desktop/autogis/front
npm run dev
```

## 🔗 Доступ к приложению

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432

## 📋 Текущий статус

| Компонент | Статус | Примечание |
|-----------|--------|-----------|
| Backend Go | ✅ Готов | Компилируется, ждет Node.js |
| Frontend | ⏳ Требует Node.js | После установки Node.js будет готов |
| Database | ⏳ Docker готов | Запустится автоматически |
| Docker | ✅ Установлен | Работает |

## 🐛 Решение проблем

### "npm: command not found"
```bash
# Убедитесь, что Node.js установлен:
brew install node

# Проверьте PATH:
echo $PATH
```

### "Cannot find module 'axios'"
```bash
# Переустановите зависимости:
cd /Users/user/Desktop/autogis/front
rm -rf node_modules package-lock.json
npm install
```

### Ошибки при подключении к БД
```bash
# Проверьте, что контейнер PostgreSQL запущен:
docker ps | grep postgres

# Если не запущен:
cd /Users/user/Desktop/autogis/backend
docker-compose up -d
```

## ✅ После установки Node.js

Все ошибки TypeScript автоматически исчезнут:
- ✅ `Cannot find module 'axios'` → исчезнет
- ✅ Все типы будут правильно разрешены
- ✅ IDE автозаполнение начнет работать

## 📞 Контакты

Если возникли проблемы:
1. Проверьте версии: `node --version`, `npm --version`, `go version`
2. Очистите кеш: `npm cache clean --force`
3. Переустановите зависимости: `npm install --force`
