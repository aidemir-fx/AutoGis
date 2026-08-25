## Masters Frontend

React + Vite + TypeScript + MUI + Yandex Maps + React Query

### Запуск

1. Установите зависимости
```bash
npm i
```

2. Создайте `.env` в `front/` и укажите ключ Яндекс Карт и/или базовый URL API
```bash
VITE_YMAPS_API_KEY=your_yandex_maps_api_key
# Optional:
# VITE_API_URL=http://localhost:3001
# VITE_WS_URL=ws://localhost:3001
```

3. Запустите бэкенд (порт 3001) и фронтенд
```bash
npm run dev
```

Фронт доступен на `http://localhost:5173`.

Запросы к API:
- По умолчанию — через прокси (`/api` → `http://localhost:3001`, `/ws` → `ws://localhost:3001`).
- Если указан `VITE_API_URL`, запросы идут напрямую на это значение.

### Архитектура
- `app` — корневые обвязки
- `screens` — страницы (в т.ч. карта с фильтрами)
- `modules/masters` — домен мастеров: api, типы и UI-фичи
- `common` — переиспользуемые хелперы, типы, http-клиент

### API
Используются эндпоинты из бэкенда:
- `GET /masters?status=&tags=` — список мастеров

Фильтры по `status` и множественным `tags`.

