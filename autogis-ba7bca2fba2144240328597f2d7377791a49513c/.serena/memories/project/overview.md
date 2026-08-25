# AutoGIS Project Overview

## Project Purpose
Full-stack platform for connecting customers with service providers (masters, auto wash, auto service, auto shop).

## Tech Stack
- **Backend**: Go 1.x, Gin framework, PostgreSQL + GORM, JWT auth
- **Frontend**: React 18 + TypeScript, Vite 5.4.20, Material-UI, React Router, TanStack Query
- **Database**: PostgreSQL with PostGIS extension

## 4 Activity Types (Виды деятельности)
1. **master** - Частный мастер (private master)
2. **auto_wash** - Автомойка (auto wash)
3. **auto_service** - Автосервис (auto service)
4. **auto_shop** - Автомагазин (auto shop)

## Database Entities
- User (with Role field)
- Master, AutoWash, AutoShop, AutoService (linked to User)
- UserActivityType (many-to-many)
- ActivityType, Order, Review

## Backend Structure
- `internal/domain/entities.go` - DB models
- `internal/handler/` - HTTP handlers (auth.go, order.go)
- `internal/usecase/` - Business logic (auth.go, order.go, search.go)
- `internal/repository/` - DB queries
- migrations/ - SQL migrations

## Frontend Structure  
- `src/screens/cabinet/` - User cabinet screens
- `ActivityTypesSelection` - Activity type selection
- Settings for each type: MasterSettings, AutoWashSettings, etc.
- `src/modules/` - Feature modules

## Key Dependencies
- go get github.com/gin-gonic/gin
- npm: react, react-router-dom, @tanstack/react-query, @mui/material, dayjs
