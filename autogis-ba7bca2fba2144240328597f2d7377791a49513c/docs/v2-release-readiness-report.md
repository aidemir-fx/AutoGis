# Аудит готовности AutoGIS к релизу v2

Дата: 2026-04-19 (первый аудит), 2026-04-20 (второй аудит, см. раздел "Дополнение")

## Вердикт

Проект пока не готов к полноценному публичному релизу v2. Для внутреннего тестирования и закрытого бета-запуска база уже хорошая, но для реальных пользователей у вас остаются блокеры в четырёх зонах: регистрация/активация бизнеса, auth/security, неполная реализация ролей `auto_wash` / `auto_shop`, и несоответствие CRM-логики целевому scope.

## Критичные проблемы

1. Бизнес-активацию сейчас можно обойти.

Любой авторизованный пользователь может сам включить себе `isProfessional` через [backend/internal/handler/auth.go](/Users/user/Desktop/autogis/backend/internal/handler/auth.go:314) и [backend/internal/usecase/auth.go](/Users/user/Desktop/autogis/backend/internal/usecase/auth.go:313), а маршрут выбора деятельности защищён только наличием токена в [front/src/common/components/ProtectedRoute.tsx](/Users/user/Desktop/autogis/front/src/common/components/ProtectedRoute.tsx:7) и [front/src/app/App.tsx](/Users/user/Desktop/autogis/front/src/app/App.tsx:155). Если вы хотите ручную модерацию через заявку, сейчас она не enforce'ится.

2. Продовая auth-модель ещё не готова.

В API есть только `register/login/refresh` в [backend/cmd/server/main.go](/Users/user/Desktop/autogis/backend/cmd/server/main.go:595), без восстановления доступа, подтверждения телефона и без защиты от brute-force. Refresh token stateless и не хранится в БД, то есть его нельзя нормально отозвать или привязать к устройству в [backend/internal/usecase/auth.go](/Users/user/Desktop/autogis/backend/internal/usecase/auth.go:162). На фронте access/refresh лежат в `localStorage` в [front/src/common/lib/http.ts](/Users/user/Desktop/autogis/front/src/common/lib/http.ts:42), что повышает риск компрометации при XSS.

3. Заказ можно создать на любого существующего пользователя, а не только на валидного провайдера.

В [backend/internal/usecase/order.go](/Users/user/Desktop/autogis/backend/internal/usecase/order.go:49) проверяется только существование `ProviderID` и `ActivityTypeID`, но не то, что этот пользователь действительно оказывает выбранную услугу. Для CRM это прямой риск мусорных и неконсистентных заявок.

4. В media/storage есть серьёзные пробелы по доступу.

Ownership проверяется только для `account` в [backend/internal/usecase/media.go](/Users/user/Desktop/autogis/backend/internal/usecase/media.go:75), но не для `work/object`, а `GetAsset` в [backend/internal/usecase/media.go](/Users/user/Desktop/autogis/backend/internal/usecase/media.go:276) вообще не делает проверку прав на конкретный asset. Для хранения пользовательских фотографий это нельзя выпускать как есть.

## Высокий приоритет

5. Реализация бизнес-ролей неполная.

`auto_shop` прямо остаётся legacy-only в [backend/internal/usecase/master.go](/Users/user/Desktop/autogis/backend/internal/usecase/master.go:106) и [backend/internal/usecase/master.go](/Users/user/Desktop/autogis/backend/internal/usecase/master.go:487). Во фронте автомагазин и автомойка уже отправляют расширенные поля в [front/src/screens/cabinet/AutoShopSettings/AutoShopSettings.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/AutoShopSettings/AutoShopSettings.tsx:135) и [front/src/screens/cabinet/AutoWashSettings/AutoWashSettings.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/AutoWashSettings/AutoWashSettings.tsx:134), но backend DTO эти поля не принимает в [backend/internal/domain/dto.go](/Users/user/Desktop/autogis/backend/internal/domain/dto.go:275) и [backend/internal/domain/dto.go](/Users/user/Desktop/autogis/backend/internal/domain/dto.go:310). То есть часть настроек пользователь заполнит, но система их не сохранит.

6. Дополнительные услуги для автомойки и автомагазина пока заглушки.

Эндпоинты в [backend/internal/handler/master.go](/Users/user/Desktop/autogis/backend/internal/handler/master.go:285) и [backend/internal/handler/master.go](/Users/user/Desktop/autogis/backend/internal/handler/master.go:345) возвращают пустые массивы. Для живого бизнеса это означает незавершённую настройку карточек.

7. Текущая mini-CRM доступна всем professional-пользователям, а не только частным исполнителям.

Это видно по [front/src/screens/cabinet/ProfessionalCabinet/ProfessionalCabinet.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/ProfessionalCabinet/ProfessionalCabinet.tsx:153), [front/src/screens/cabinet/Applications/Applications.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/Applications/Applications.tsx:122), [front/src/screens/cabinet/Calendar/Calendar.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/Calendar/Calendar.tsx:110) и [front/src/screens/cabinet/Chats/Chats.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/Chats/Chats.tsx:51). По вашему продуктному плану это неверно: в v2 CRM должна быть только у частного исполнителя.

8. Публичная выдача светит auth-phone пользователя.

В поиске и карточках провайдеров используется `user.Phone` в [backend/internal/usecase/search.go](/Users/user/Desktop/autogis/backend/internal/usecase/search.go:376), [backend/internal/usecase/search.go](/Users/user/Desktop/autogis/backend/internal/usecase/search.go:413), [backend/internal/usecase/search.go](/Users/user/Desktop/autogis/backend/internal/usecase/search.go:439), [backend/internal/usecase/search.go](/Users/user/Desktop/autogis/backend/internal/usecase/search.go:469). То же самое уходит в ответы заказов и чатов в [backend/internal/usecase/order.go](/Users/user/Desktop/autogis/backend/internal/usecase/order.go:268) и [backend/internal/usecase/chat.go](/Users/user/Desktop/autogis/backend/internal/usecase/chat.go:157). Для прода лучше отдавать только `workingPhone`/`contactNumber`, а не логин-номер.

9. Неполные бизнес-профили могут стать публичными сразу после добавления типа деятельности.

Фронт создаёт активность почти без данных в [front/src/screens/cabinet/ActivityTypesSelection/ActivityTypesSelection.tsx](/Users/user/Desktop/autogis/front/src/screens/cabinet/ActivityTypesSelection/ActivityTypesSelection.tsx:123), backend создаёт `available` профиль с минимальным набором полей в [backend/internal/usecase/master.go](/Users/user/Desktop/autogis/backend/internal/usecase/master.go:419) и [backend/internal/usecase/master.go](/Users/user/Desktop/autogis/backend/internal/usecase/master.go:499), а поиск читает все профили без фильтра по полноте/модерации в [backend/internal/usecase/search.go](/Users/user/Desktop/autogis/backend/internal/usecase/search.go:85). Это значит, что на карте и в списке могут появиться пустые карточки бизнеса.

## Средний приоритет

10. "Номер для связи" сейчас сохраняется некорректно.

Фронт шлёт `phone` вместо `contactNumber` в [front/src/common/hooks/useUserProfile.ts](/Users/user/Desktop/autogis/front/src/common/hooks/useUserProfile.ts:73), а backend намеренно обновляет только `contactNumber` в [backend/internal/usecase/auth.go](/Users/user/Desktop/autogis/backend/internal/usecase/auth.go:262). Для пользователя это выглядит как "сохранил, но не сохранилось".

11. Поиск пока плохо масштабируется.

Для каждого типа провайдера сначала грузится весь список, потом считается distance в коде в [backend/internal/usecase/search.go](/Users/user/Desktop/autogis/backend/internal/usecase/search.go:85). На старте это переживётся, но на живой базе быстро станет bottleneck.

12. Миграции выполняются прямо на старте приложения.

Это происходит в [backend/cmd/server/main.go](/Users/user/Desktop/autogis/backend/cmd/server/main.go:136), а в примере env это ещё и включено в [backend/.env.example](/Users/user/Desktop/autogis/backend/.env.example:19). Для прода лучше вынести миграции в отдельный controlled pipeline, а не делать schema-change на boot.

13. Справочники пока частично захардкожены.

Профессии и марки берутся из frontend-констант, а `fetchAllServices` вообще TODO в [front/src/modules/masters/domain/api/index.ts](/Users/user/Desktop/autogis/front/src/modules/masters/domain/api/index.ts:168) и [front/src/modules/masters/domain/api/index.ts](/Users/user/Desktop/autogis/front/src/modules/masters/domain/api/index.ts:196). Это нормально для прототипа, но плохо для продовой версии с реальным бизнес-контентом.

## Что уже выглядит хорошо

Фундамент у проекта сильный. `go test ./...` проходит, `npm run typecheck` и `npm run build` тоже проходят. Бэкенд структурирован аккуратно, есть нормальная база под роли, заявки, чат, календарь и S3-media pipeline. Плюсами можно считать bcrypt с нормальной стоимостью, защиту от timing-атаки при login и то, что media-процессор уже делает MIME-проверку и чистит EXIF.

## Что ещё нужно до релиза v2

1. Закрыть auth/security: password reset, подтверждение телефона, rate limit на auth, refresh-token store с revoke/rotation, нормальную сессию вместо `localStorage` либо жёсткую XSS-модель.
2. Выбрать один продуктовый сценарий онбординга: либо прямой self-service onboarding бизнеса, либо реальная модерация. Сейчас в проекте одновременно есть оба пути, и они конфликтуют.
3. Довести бизнес-роли до конца: полноценные настройки для `auto_wash` и `auto_shop`, published/moderation flag, фильтрацию пустых профилей из поиска и карты.
4. Ограничить mini-CRM только `private_executor`, если это ваш целевой scope v2.
5. Закрыть privacy/data handling: не отдавать auth-phone публично, починить media ACL, прописать retention/backup/S3 lifecycle.
6. Добрать quality gate: минимум smoke/e2e на register/login/add activity/create order/provider workflow. По факту в проекте сейчас только 2 собственных backend-теста и нет frontend-тестов.

## Короткий вывод

Для закрытой беты проект уже близко, для полноценного публичного релиза v2 ещё рано. Самые важные блокеры лучше закрывать в таком порядке:

1. `auth/security`
2. enforce onboarding flow
3. business roles completeness
4. privacy/media
5. тесты и publish-фильтры

---

# Дополнение после второго аудита (2026-04-20)

Первый аудит верно идентифицировал **продуктовые и авторизационные пробелы**, но недооценил **инфраструктурную готовность** (HTTPS, observability, бэкапы) и **legal-слой** (152-ФЗ, Capacitor для сторов). Ниже — результат повторной верификации и дополнения.

## Верификация findings первого аудита

Из 12 пунктов 10 подтверждены в коде, 2 требуют уточнения:

| # | Пункт | Статус | Уточнение |
|---|-------|--------|-----------|
| 1 | Активация профессионала | ✅ верно | [internal/usecase/auth.go:313](/Users/user/Desktop/autogis/backend/internal/usecase/auth.go) — `ActivateProfessional()` ставит `user.IsProfessional = true` без проверок |
| 2 | Recovery/phone verify | ✅ верно, но глубже | Нет не просто фичи "восстановление доступа" — **система в принципе не имеет верифицированного канала связи с пользователем**: телефон не подтверждён OTP, email отсутствует как поле. Это блокирует реализацию recovery как таковую |
| 3 | Refresh token store | ✅ верно | JWT stateless, таблицы `refresh_tokens` нет. Невозможен logout "со всех устройств", нельзя revoke при компрометации |
| 4 | Rate-limit на auth | ⚠ уточнение | **Пакет `internal/pkg/ratelimit` уже реализован**, но подключён только к media upload. На `/auth/login` и `/auth/register` — не подключён. Быстрый фикс (5 строк в `main.go`) |
| 5 | Order без проверки activity | ✅ верно | [internal/usecase/order.go:49](/Users/user/Desktop/autogis/backend/internal/usecase/order.go) проверяет только существование userID, не связь user↔activity_type |
| 6 | Media ACL | ⚠ частично устарел | `GetAssetsByEntity` уже получил ownership-проверку для `object` во втором раунде правок. **Дыра осталась в `GetAsset(assetID)`** — [media.go:270](/Users/user/Desktop/autogis/backend/internal/usecase/media.go): любой авторизованный юзер по известному assetID получит URL чужого файла |
| 7 | auto_shop/auto_wash | ✅ верно | `resolveActivity()` для `auto_shop` возвращает legacy-nil; DTO `UpdateAutoWashRequest`/`UpdateAutoShopRequest` не содержат `HasParking`/`LiftCount`/`Warranty` |
| 8 | CRM для всех professional | ✅ верно | `ProfessionalCabinet.tsx:153` условие — `profile?.isProfessional === true`, без проверки `activityType === 'master'` |
| 9 | Публичный phone | ✅ верно | `search.go:376,413,439,469` — `Phone: master.User.Phone` вместо `WorkingPhone` |
| 10 | contactNumber | ⚠ требует перепроверки | Возможно устарело, зафиксировать E2E-тестом |
| 11 | AutoMigrate на старте | ✅ верно + риск | Добавить: при scale-out (2+ инстансы) **GORM AutoMigrate даёт race в DDL**. Для v2 обязательно выносить в отдельный `migrate up` step |
| 12 | Тесты | ✅ верно | Backend: 2 test-файла (`jwt_test.go`, `order_test.go`). Frontend: 0 тестов |

## Критичные упущения (не покрытые первым аудитом)

### A. Auth и регистрация — блокер для РФ

| Зона | Статус | Комментарий |
|------|--------|-------------|
| SMS-OTP сервис | ❌ нет | Grep по `twilio`/`smsc`/`smsaero`/`exolve`/`otp` — ноль. Регистрация через телефон без OTP бессмысленна: нельзя подтвердить владение номером, нельзя реализовать recovery. Интеграция с SMSC.ru или Exolve — 1-2 дня |
| Captcha на registration/login | ❌ нет | Recaptcha/hcaptcha/Turnstile/SmartCaptcha — не найдено. Открытая регистрация без captcha + без rate-limit = вектор для массовых регистраций и брутфорса |
| Password reset flow | ❌ нет | Нет endpoints `/auth/forgot-password`, `/auth/reset-password` — прямое следствие отсутствия SMS |
| Email как канал | ❌ нет | В модели `domain.User` даже поля `email` нет. Рекомендую добавить сразу — второй канал для recovery и нотификаций |
| Revokable refresh tokens | ❌ нет | Нет таблицы `refresh_tokens` с `revoked_at`/`device_id`/`user_agent`. Нельзя разлогинить юзера удалённо, нельзя сделать "выйти на всех устройствах" |

### B. 152-ФЗ / Compliance (РФ)

| Зона | Статус | Комментарий |
|------|--------|-------------|
| Privacy Policy страница | ❌ нет | Роут `/privacy` ссылается в `RegisterScreen`, но **контента нет**. 152-ФЗ обязывает |
| Пользовательское соглашение/оферта | ❌ нет | Страницы `/terms`, `/offer` не существуют |
| Cookie banner | ❌ нет | Для РФ и EU-трафика обязательно |
| Delete account endpoint | ❌ нет | Право на удаление данных (ст.14 152-ФЗ). Юзер не может удалить аккаунт |
| Export data | ❌ нет | Не обязательно для 152-ФЗ, но полезно для GDPR-совместимости |
| Регистрация оператора ПДн в Роскомнадзоре | ⚠ вне кода | Юридически нужно подать уведомление **до** начала обработки ПДн реальных пользователей |

### C. Capacitor / мобильное приложение — шоу-стоппер для сторов

[front/capacitor.config.ts](/Users/user/Desktop/autogis/front/capacitor.config.ts) содержит:
```
appId: "com.example.myapp"
appName: "My React App"
```
С такими значениями приложение **невозможно загрузить в App Store / Google Play**. Дополнительно отсутствуют:
- iOS privacy manifest (требование iOS 17+ с мая 2024)
- Deep links / universal links не настроены в native-манифестах
- Push-уведомления (FCM/APNS) — инфраструктуры нет
- Иконки в `icon-previews-*` есть, но в `front/ios` / `front/android` native-проектах не привязаны

### D. Production infrastructure

| Зона | Статус | Комментарий |
|------|--------|-------------|
| HTTPS / reverse proxy | ❌ нет | В `docker-compose.yml` нет nginx/caddy/traefik. `.env.example` содержит `http://` в S3_ENDPOINT и CDN_BASE_URL. Без HTTPS обработка ПДн = нарушение 152-ФЗ |
| `/health` endpoint | ❌ нет | K8s/ELB/compose healthcheck не смогут проверять живость |
| Graceful shutdown | ⚠ частично | `mediaWorker.Shutdown()` есть, но нет `signal.NotifyContext(SIGTERM)` и `http.Server.Shutdown(ctx)` для в-полёте HTTP-запросов |
| Structured logging | ❌ нет | `fmt.Printf`/`log.Printf` по коду. Для прода — `slog` или `zap` с JSON-форматом, чтобы ELK/Loki/Datadog парсили |
| Sentry / error tracking | ❌ нет | Без этого вы не узнаёте о крашах клиентов, пока не пожалуются |
| Prometheus / metrics | ❌ нет | Нельзя алертить на p95, на всплески 5xx, на очередь media worker'а |
| Backups | ❌ нет | Ни `pg_dump` в cron, ни S3 versioning/lifecycle. При падении БД — полная потеря данных |
| Secrets | ⚠ риск | `backend/.env.example` закоммичен с `JWT_SECRET=your-super-secret-key-change-in-production`. Проверить `git log -p backend/.env*` — не засветился ли реальный секрет. Если да — ротировать |

### E. Продукт и UX

| Зона | Статус | Комментарий |
|------|--------|-------------|
| Уведомления о новых заказах/сообщениях | ❌ нет | Сейчас только WebSocket с открытым табом. Юзер закрыл приложение → ничего не узнал. Для маркетплейса это **продуктовый блокер** — провайдеры не успеют взять заказ. Нужен push (FCM) или email |
| Admin panel | ❌ нет | Нет модерации бизнес-заявок, нет бана нарушителей, нет просмотра чатов/заказов саппортом |
| Модерация reviews | ❌ нет | Отзывы публикуются сразу. Первый же конкурент набросает 1-звёздочных |
| Report / жалобы | ❌ нет | Нет модели Report/Complaint и UI для подачи |
| Pagination | ❌ нет | `GetCustomerOrders`, `GetMasters`, `GetReviewsByToID` возвращают массивы целиком. На 10k заказов клиент ляжет |
| Error pages 404/500 | ❌ нет | `ErrorState.tsx` есть (общий), но route-level `/*` fallback нет |
| Support / feedback форма | ❌ нет | Юзеру некуда написать о проблеме |
| Аналитика | ❌ нет | Ни Яндекс.Метрика, ни GA, ни Mixpanel. Запускаться без воронки конверсии — управлять продуктом вслепую |

## Скрытые мины

1. **`appId = "com.example.myapp"`** — моментальный отказ в App Store при первой попытке публикации. Починить до первого билда для store.
2. **Phone-based auth без SMS** — юзер может зарегистрироваться на номер реального автосервиса конкурента и занять его. **Юридический риск**: реальный владелец номера может подать жалобу за неправомерное использование его номера.
3. **Публичная выдача с auth-phone** (пункт 8 первого аудита) — юзер регался личным номером, ожидая что клиенты по нему звонить не будут. Сейчас его телефон светится в открытой выдаче. **Это жалоба в Роскомнадзор в первую же неделю.**
4. **`JWT_SECRET` в `.env.example`** — проверить через `git log -p backend/.env.example | head -200`, не засветился ли реальный секрет. Если был закоммичен — немедленно ротировать, старые JWT-токены сделать невалидными.
5. **Отсутствие Moderator role** — при первом инциденте (фейковый мастер, спам, мошенничество) придётся делать SQL hot-fix в БД вручную.
6. **AutoMigrate в `cmd/server/main.go`** при деплое в несколько реплик (Kubernetes/docker-swarm) — две реплики одновременно запустят DDL, получите дедлоки или частичные изменения схемы.

## Обновлённый roadmap для v2

### 🔴 MUST — блокеры для запуска на реальных пользователей

В дополнение к findings 1–12 первого аудита:

1. SMS-OTP (SMSC.ru / Exolve) — регистрация + recovery
2. Rate-limit подключить к `/auth/*` (уже есть пакет, 5 строк кода)
3. Captcha на регистрации — Yandex SmartCaptcha или Turnstile
4. Revokable refresh tokens — таблица `refresh_tokens`, `/auth/logout`
5. Fix `GetAsset` ACL — проверка `created_by` / entity access
6. Delete account + soft-delete cascade
7. Privacy + Terms страницы с реальным текстом (юрист под 152-ФЗ)
8. Capacitor: реальный bundle id, иконки, privacy manifest
9. HTTPS в compose (Nginx/Caddy + Let's Encrypt)
10. `/health` endpoint + graceful shutdown + Sentry
11. Автобэкап PostgreSQL (хотя бы `pg_dump` в S3 через cron)
12. Push или email уведомления о новых заказах/сообщениях — иначе маркетплейс не функционален
13. Email-поле в модели User — второй канал recovery

### 🟡 SHOULD — желательно в v2.0

14. Admin panel (минимум): смена статуса business_applications, бан юзера, список чатов/заказов для саппорта
15. Pagination на всех листовых endpoint'ах
16. Модерация reviews (pending → approved)
17. Structured logging (slog) + Prometheus metrics
18. E2E smoke-тесты: register → verify phone → add activity → create order → chat → review
19. Яндекс.Метрика + Sentry user-context

### 🟢 CAN WAIT — v2.1 и позже

- Платежи/эскроу (Yookassa/Tinkoff)
- i18n (русского достаточно для v2)
- PostGIS + CDN оптимизации
- Admin full (метрики, модерация контента, отчётность)
- CRM для business-ролей (по плану первого аудита — уже отложено)

## Реалистичный timeline

Для команды 2–3 человека до "v2 в проде с реальными пользователями" — **4–6 недель**:

| Неделя | Основной блок |
|--------|---------------|
| 1 | Auth: SMS-OTP, captcha, recovery, rate-limit, revokable refresh |
| 2 | Compliance: privacy/terms pages, delete account, подача уведомления в Роскомнадзор, email в user-модели |
| 3 | Infrastructure: HTTPS-прокси, Sentry, /health, graceful shutdown, cron-бэкапы |
| 4 | Продукт: DTO для auto_wash/shop, CRM scope, фильтрация неполных профилей, pagination |
| 5 | Admin minimal + модерация reviews + push/email уведомления |
| 6 | QA + Capacitor + публикация в stores + E2E smoke-тесты |

## Итоговая оценка

Первый аудит корректно диагностировал **фичевую готовность**. Второй аудит добавляет **инфраструктурную и юридическую** готовность.

Объединённый вердикт: **для закрытой беты (~10–50 приглашённых юзеров) проект готов за 1-2 недели**, для **публичного релиза v2 — 4–6 недель**, при условии что параллельно с разработкой идёт подача оператора ПДн в Роскомнадзор и юридическая проверка текстов соглашений.
