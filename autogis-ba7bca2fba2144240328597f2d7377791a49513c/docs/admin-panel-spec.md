# Спецификация: модульная админ-панель модерации

MVP-домен: заявки на доступ к профессиональному кабинету.

Дата ревизии: 2026-04-21

Детализация новой submit-формы:
- [docs/professional-application-submit-form-v2-spec.md](/Users/user/Desktop/autogis/docs/professional-application-submit-form-v2-spec.md)

---

## 1. Цель

Подготовить реализацию админ-панели, в которой администратор или модератор рассматривает заявки на доступ к профессиональному кабинету.

Ключевое требование:
- решение должно быть не одноразовой страницей под конкретную заявку, а масштабируемой модульной платформой модерации;
- первым модулем становится `professional_applications`;
- в дальнейшем в ту же платформу должны без архитектурного перелома добавляться модули `content_moderation`, `reviews_moderation`, `reports`, `support cases` и т.д.

---

## 2. Что уже есть в проекте

### 2.1 Backend

Сейчас в проекте уже есть базовая сущность заявки:
- `BusinessApplication`;
- статусы: `pending | approved | rejected | needs_revision`;
- endpoints:
  - `POST /api/business-applications`
  - `GET /api/business-applications/me`
  - `GET /api/business-applications`
  - `PATCH /api/business-applications/:id/status`

Текущая модель заявки жёстко привязана к фиксированному набору полей:
- `businessType`
- `businessName`
- `city`
- `address`
- `phone`
- `contactPerson`
- `email`
- `comment`
- `agreedToTerms`

### 2.2 Frontend

Сейчас есть только пользовательская форма отправки заявки в разделе `Для бизнеса`.
Админского интерфейса для просмотра, фильтрации, назначения, аудита и безопасного принятия решений пока нет.

### 2.3 Ограничения текущей реализации

1. Текущий контракт заявки не масштабируется под изменения формы.
2. Нет версионирования payload заявки.
3. Нет отдельной сущности кейса модерации.
4. Нет аудита действий модератора.
5. Нет назначения ответственного и рабочего статуса кейса.
6. Нет detail endpoint для карточки заявки.
7. Текущий поток можно обойти через прямую self-activation профессионального кабинета, поэтому модерация не enforced.
8. В проекте уже внедряется новая иерархия деятельности `activityGroup/activitySubtype`, а заявка всё ещё опирается на legacy-поле `businessType`.

---

## 3. Продуктовые принципы

### 3.1 Админ-панель строится как платформа модерации

Нужен не набор отдельных экранов под каждую будущую сущность, а общий каркас:
- единый shell админки;
- единая очередь кейсов;
- единый аудит;
- единая система ролей и назначения;
- domain-specific карточки и действия.

### 3.2 Заявка и кейс модерации — разные сущности

Нужно разделять:
- саму бизнес-сущность заявки пользователя;
- кейс модерации, через который администратор её обрабатывает.

Это позволит в будущем подключать к тому же moderation engine другие сущности, не дублируя инфраструктуру.

### 3.3 Структура заявки должна быть версионируемой

Требование пользователя к задаче: если форма отправки меняется, backend должен принимать именно ту структуру, которую форма реально отправляет.

Следствие:
- backend не должен быть жёстко прошит только под один плоский DTO;
- payload заявки нужно хранить как версионируемый снапшот;
- для каждой версии формы должна существовать серверная схема валидации;
- административная карточка должна уметь отрисовывать данные заявки по её собственной версии схемы.

### 3.4 Изменение формы не должно ломать историю

Когда через месяц в форме уберут одни поля и добавят другие:
- старые заявки должны оставаться читаемыми;
- старые ревизии не должны мигрироваться «на лету» в новую форму;
- новая форма должна жить как новая версия схемы, а не как destructive update старой.

---

## 4. Scope реализации

### 4.1 Входит в MVP

1. Админ-shell с модулем модерации.
2. Модуль `professional_applications`.
3. Очередь заявок с фильтрами, поиском и пагинацией.
4. Карточка заявки с полным payload, историей изменений и действиями модератора.
5. Смена статуса: `approve`, `reject`, `needs_revision`.
6. Назначение ответственного модератора.
7. Аудит действий в рамках кейса.
8. Версионируемая структура payload заявки.
9. Пользовательский сценарий повторной отправки после `needs_revision`.
10. Отключение обходного пути прямой self-activation профессионального кабинета.
11. JWT-инвалидация / принудительное обновление токена после approve.
12. In-app уведомление пользователю при изменении статуса заявки.

### 4.2 Не входит в MVP

1. Модерация контента как отдельный модуль.
2. Bulk-операции по кейсам.
3. SLA-дашборды и расширенная аналитика.
4. Автоматическая ML/AI-модерация.
5. Конструктор форм в админке.
6. Email/push-нотификации (только in-app на MVP).

---

## 5. Целевая архитектура

### 5.1 Frontend

**UI-стек:** React + существующий в проекте стек компонентов. Отдельного UI-кита для админки не вводим — используем те же базовые компоненты, что и в основном приложении, изолируя их в `AdminShell`.

Админка должна собираться из следующих частей:

1. `AdminShell`
- layout;
- sidebar;
- topbar;
- guard по ролям;
- общие таблицы, фильтры, теги статусов, audit timeline.

2. `ModerationCore`
- generic queue list;
- generic case header;
- reusable блок истории событий;
- assignment widget;
- optimistic locking / disabled-state во время mutation.

3. `ProfessionalApplicationsModule`
- список заявок на профессиональный кабинет;
- карточка конкретной заявки;
- schema-aware renderer submitted payload;
- decision panel.

4. `AuditLogModule`
- журнал действий модераторов;
- фильтры по actor, domain, action, date range.

### 5.2 Backend

Backend делится на два слоя:

1. Domain layer `professional_application`
- submit/resubmit;
- хранение ревизий;
- доменная логика approve/reject/needs_revision;
- side effects после approve (включая инвалидацию токена пользователя).

2. Generic layer `moderation`
- moderation case;
- assignment;
- audit;
- queue filters;
- shared statuses и transitions, не завязанные на конкретный домен.

### 5.3 Ключевой architectural decision

Для MVP допускается сохранить физическую таблицу `business_applications`, если это уменьшает объём миграции.

Но логическая модель, новые API и frontend должны оперировать термином:
- `professional_application`

Рекомендация:
- физический rename таблицы можно вынести в отдельную техническую миграцию;
- продуктовую и кодовую модель лучше привести к `professional_application` уже сейчас.

---

## 6. Целевая модель данных

### 6.1 `professional_applications`

Агрегат заявки как сущности.

Поля:
- `id`
- `user_id`
- `status` — `pending | needs_revision | approved | rejected`
- `current_revision_id`
- `moderation_case_id`
- `activity_group_code` nullable
- `activity_subtype_code` nullable
- `applicant_display_name`
- `contact_phone`
- `contact_email` nullable — **legacy-only**: заполнялось в старой форме (v1); в новой форме v2 `email` удалён, поле остаётся в таблице только для чтения исторических заявок
- `city` nullable
- `submitted_schema_key`
- `submitted_schema_version`
- `decision_actor_id` nullable — кто принял последнее решение (деривируется из events, денормализация для быстрого показа в карточке)
- `decision_comment` nullable — комментарий к последнему решению (для показа пользователю без JOIN в events)
- `last_submission_at`
- `created_at`
- `updated_at`

Замечание по денормализации:
- `decision_actor_id` и `decision_comment` — явно денормализованные поля для производительности списка/карточки;
- источником истины для полной истории решений остаётся `moderation_case_events`;
- отдельные поля `approved_by_user_id`, `rejected_by_user_id`, `needs_revision_by_user_id` не дублируются — достаточно одного `decision_actor_id`, актуального для последнего решения.

### 6.2 `professional_application_revisions`

Иммутабельный снапшот каждой отправки формы.

Поля:
- `id`
- `application_id`
- `revision_no`
- `schema_key`
- `schema_version`
- `payload_json` JSONB
- `summary_json` JSONB
- `submitted_by_user_id`
- `created_at`

Правила:
- initial submit создаёт `revision_no = 1`;
- resubmit после `needs_revision` создаёт новую ревизию с `revision_no = previous + 1`;
- предыдущие ревизии не перезаписываются;
- `revision_no` должен быть строго последовательным — нарушение последовательности является ошибкой.

### 6.3 `moderation_cases`

Общая таблица кейсов модерации, переиспользуемая в будущем для других доменов.

Поля:
- `id`
- `domain` — на MVP всегда `professional_application`
- `subject_id` — ссылка на `professional_applications.id`
- `queue_status` — `open | in_review | waiting_submitter | resolved`
- `decision_status` — дублирует доменный статус для быстрого списка: `pending | needs_revision | approved | rejected`
- `priority` — `normal | high`
- `assignee_user_id` nullable
- `review_taken_at` nullable — когда кейс взят `in_review` (для auto-release timeout)
- `opened_at`
- `last_activity_at`
- `resolved_at` nullable
- `created_at`
- `updated_at`

**Таблица допустимых переходов статусов:**

| queue_status \ событие | submit | take_into_review | needs_revision | resubmit | approve | reject |
|---|---|---|---|---|---|---|
| `open` | → open | → in_review | — | — | — | — |
| `in_review` | — | — | → waiting_submitter | — | → resolved | → resolved |
| `waiting_submitter` | — | — | — | → open | — | — |
| `resolved` | — | — | — | — | — | — |

### 6.4 `moderation_case_events`

Единый аудит по кейсам.

Поля:
- `id`
- `case_id`
- `domain`
- `subject_id`
- `actor_user_id`
- `event_type`
- `from_queue_status` nullable
- `to_queue_status` nullable
- `from_decision_status` nullable
- `to_decision_status` nullable
- `comment` nullable
- `payload_json` JSONB nullable
- `created_at`

Примеры `event_type`:
- `case_created`
- `assigned`
- `taken_into_review`
- `review_released` — кейс возвращён в очередь из `in_review` (auto-release или вручную)
- `decision_needs_revision`
- `decision_approved`
- `decision_rejected`
- `resubmitted`

### 6.5 `professional_application_schemas`

Schema registry — таблица зарегистрированных версий форм.

Поля:
- `id`
- `schema_key` — например `professional_cabinet.default`
- `schema_version` — целое число
- `json_schema` JSONB — серверная схема валидации payload
- `field_mappings` JSONB — правила извлечения summary-полей из payload
- `ui_schema` JSONB nullable — подсказки для рендеринга в карточке
- `is_active` boolean — только одна версия на schema_key может быть active
- `created_at`

**Seed при первом деплое:**
Обязательно добавить как минимум две стартовые версии схемы:
- `professional_cabinet.default` версии `1` — legacy-версия для миграции и чтения исторических заявок с полями старой формы;
- `professional_cabinet.default` версии `2` — активная версия новой формы, описанной в [docs/professional-application-submit-form-v2-spec.md](/Users/user/Desktop/autogis/docs/professional-application-submit-form-v2-spec.md).

Без этих seed-записей submit и чтение истории будут противоречить друг другу.

### 6.6 Индексы

Обязательные индексы:
- `professional_applications(status, last_submission_at desc)`
- `professional_applications(activity_group_code, status, last_submission_at desc)`
- `professional_applications(contact_phone)`
- `professional_applications(applicant_display_name)`
- `moderation_cases(domain, queue_status, last_activity_at desc)`
- `moderation_cases(assignee_user_id, queue_status, updated_at desc)`
- `moderation_case_events(case_id, created_at desc)`
- `professional_application_revisions(application_id, revision_no desc)`

**Уникальный partial index — один пользователь, одна активная заявка:**
```sql
CREATE UNIQUE INDEX uq_professional_applications_active_user
  ON professional_applications(user_id)
  WHERE status IN ('pending', 'needs_revision', 'in_review');
```

Это означает: пользователь может подать новую заявку только после окончательного `rejected` или после `approved`. В противном случае API возвращает `409 Conflict`.

---

## 7. Контракт формы и эволюция схемы

### 7.1 Stable envelope

Frontend отправляет не набор жёстко закодированных полей верхнего уровня, а envelope:

```json
{
  "schemaKey": "professional_cabinet.default",
  "schemaVersion": 2,
  "payload": {
    "activityGroupCode": "auto_service",
    "activitySubtypeCode": "tire_fitting",
    "businessName": "Шина 24",
    "city": "Москва",
    "phone": "+7 (999) 999-99-99",
    "address": "Москва, ...",
    "yandexMapsUrl": "https://yandex.ru/maps/org/example/1234567890",
    "comment": "Краткое описание",
    "agreedToTerms": true
  }
}
```

Для `private_executor` в payload версии `2`:
- используется `applicantName` вместо `businessName`;
- `yandexMapsUrl` отсутствует.

### 7.2 Что валидирует backend

Backend обязан валидировать:
- существование `schemaKey` в `professional_application_schemas`;
- `is_active = true` для указанной версии (фронтенд не должен слать устаревшие версии);
- соответствие `payload` `json_schema` из реестра;
- вычисление derived fields для списка и фильтров по `field_mappings`.

Backend не должен безусловно доверять клиентскому summary.
Все поля для поиска и показа в списке должны извлекаться сервером из payload по rules mapping.

### 7.3 Как меняется форма

Если поля формы меняются:
- создаётся новая запись в `professional_application_schemas` с новой `schema_version`;
- у старой версии `is_active` остаётся `true` до полного перехода frontend;
- после перехода frontend старая версия переводится в `is_active = false` (исторические ревизии продолжают читаться);
- старые заявки продолжают отображаться по своим ревизиям через соответствующую схему.

### 7.4 Что нужно изменить относительно текущей формы

- убрать legacy-поле `businessType` как основной классификатор;
- использовать `activityGroupCode` и, если уже выбран подтип, `activitySubtypeCode`;
- перестать завязывать контракт только на плоский DTO;
- хранить submitted payload целиком;
- строить список заявок по extracted summary;
- оставить возможность быстро менять набор полей без новой глубокой переделки usecase и админ-карточки.

### 7.5 fieldMappings для schema v2

Backend извлекает денормализованные поля из payload по следующим правилам:

| Поле таблицы `professional_applications` | Источник в payload v2 | Условие |
|---|---|---|
| `applicant_display_name` | `payload.businessName` | если `activityGroupCode != private_executor` |
| `applicant_display_name` | `payload.applicantName` | если `activityGroupCode = private_executor` |
| `contact_phone` | `payload.phone` | всегда |
| `contact_email` | не заполняется | в v2 `email` отсутствует |
| `city` | `payload.city` | всегда |
| `activity_group_code` | `payload.activityGroupCode` | всегда |
| `activity_subtype_code` | `payload.activitySubtypeCode` | всегда |

fieldMappings для schema v1 (legacy):

| Поле таблицы | Источник в payload v1 |
|---|---|
| `applicant_display_name` | `payload.businessName` |
| `contact_phone` | `payload.phone` |
| `contact_email` | `payload.email` (nullable) |
| `city` | `payload.city` |
| `activity_group_code` | lookup по `payload.businessType` или `null` |
| `activity_subtype_code` | `null` (в v1 подтип не фиксировался) |

### 7.6 Совместимость с activity hierarchy

Так как в проекте уже вводится иерархия:
- `activityGroupCode`
- `activitySubtypeCode`

новая заявка на профессиональный кабинет должна опираться именно на неё, а не на legacy enum `businessType`.

Переходный период допустим:
- legacy `businessType` можно принять только как backward-compatibility mapping в seed-схеме v1;
- в новой админке и новых DTO основным представлением считается именно group/subtype.

---

## 8. Бизнес-процесс

### 8.1 Submit

1. Пользователь открывает форму.
2. Frontend запрашивает актуальную схему: `GET /api/professional-application-schemas/professional_cabinet.default/active`.
3. Пользователь отправляет заявку.
4. Backend:
   - проверяет, нет ли активной заявки у пользователя (partial unique index);
   - валидирует envelope по схеме из registry;
   - создаёт `professional_application`;
   - создаёт ревизию `revision_no = 1`;
   - создаёт `moderation_case`;
   - пишет `case_created`.
5. Frontend показывает экран статуса заявки.

### 8.2 Take into review

1. Модератор открывает кейс.
2. При необходимости назначает его на себя (`assigned`).
3. `queue_status` переходит в `in_review`; фиксируется `review_taken_at`.
4. Пишется audit event `taken_into_review`.

**Auto-release:** если кейс остался в `in_review` без активности более 24 часов, фоновый job возвращает его в `open` и пишет событие `review_released`. Интервал проверки — раз в час.

### 8.3 Needs revision

1. Модератор выбирает `needs_revision`.
2. Причина обязательна (non-empty comment).
3. `professional_applications.status = needs_revision`
4. `moderation_cases.queue_status = waiting_submitter`
5. `decision_actor_id` и `decision_comment` на заявке обновляются.
6. Пользователь видит in-app уведомление и экран с замечанием.

### 8.4 Resubmit

1. Пользователь открывает форму повторно — она предзаполнена данными последней ревизии.
2. Frontend отправляет новую версию payload (envelope с той же или новой schema_version).
3. Backend создаёт новую запись в `professional_application_revisions`.
4. `current_revision_id` переключается на новую ревизию.
5. `status` возвращается в `pending`.
6. `queue_status` возвращается в `open`; `review_taken_at` сбрасывается.
7. Пишется событие `resubmitted`.
8. Пользователь видит обновлённый экран статуса.

### 8.5 Approve

1. Модератор принимает заявку.
2. Обязательные side effects в одной транзакции:
   - `professional_applications.status = approved`
   - `moderation_cases.queue_status = resolved`
   - `user.is_professional = true`
   - `decision_actor_id` и `decision_comment` (опционально) обновляются на заявке
   - пишется audit event `decision_approved`
3. После коммита транзакции: инвалидация текущего JWT пользователя (добавить `user_id` в таблицу `token_invalidations` с `invalidated_at = now()`).
4. При следующем запросе пользователя с устаревшим токеном сервер возвращает `401`, клиент делает refresh или редиректит на логин.
5. Пользователь получает in-app уведомление об одобрении.

**Требование к JWT-инвалидации:**
- Сервер при проверке токена обязан сверяться с `token_invalidations` по `user_id` и `iat` (issued at);
- если `iat < invalidated_at` — токен отклоняется;
- таблица `token_invalidations` хранит только одну последнюю запись на `user_id` (upsert).

### 8.6 Reject

1. Модератор отклоняет заявку.
2. Причина обязательна.
3. `professional_applications.status = rejected`
4. `moderation_cases.queue_status = resolved`
5. `decision_actor_id` и `decision_comment` обновляются.
6. Пишется audit event `decision_rejected`.
7. Пользователь получает in-app уведомление с причиной.

**Политика повторной подачи после rejected:**
- пользователь может подать новую заявку не ранее чем через 7 дней после `rejected_at`;
- ограничение проверяется на уровне backend при `POST /api/professional-applications`;
- при нарушении возвращается `429` с полем `retry_after` (timestamp когда можно подать снова);
- максимальное количество отказов не ограничено на MVP.

### 8.7 Критическое правило

После внедрения этой функциональности прямой обходной маршрут самостоятельной активации профессионального кабинета должен быть отключён или переведён в internal/admin-only use.

Иначе админ-панель не является source of truth.

---

## 9. API-контракт

### 9.1 Общие соглашения

- **Пагинация:** offset-based. Параметры `limit` (default 20, max 100) и `offset` (default 0). Ответ включает `total`, `limit`, `offset`, `items`.
- **Формат ошибок:**
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "User already has an active application",
      "details": {}
    }
  }
  ```
- **HTTP-коды:** `200` ok, `201` created, `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `409` conflict (дубль заявки), `422` unprocessable (schema mismatch), `429` rate limit.

### 9.2 Пользовательские endpoints

#### `GET /api/professional-application-schemas/:schemaKey/active`

Возвращает активную версию схемы формы. **Требует авторизации** (аутентифицированный пользователь).

Ответ:
- `schemaKey`
- `schemaVersion`
- `jsonSchema`
- `uiSchema` optional

`fieldMappings` из ответа клиенту не включается — только для серверной валидации.

---

#### `POST /api/professional-applications`

Создать новую заявку.

Требования:
- пользователь не имеет активной заявки (`status IN (pending, needs_revision)`) — иначе `409`;
- если `rejected`, прошло не менее 7 дней — иначе `429` с `retry_after`.

Body:
```json
{
  "schemaKey": "professional_cabinet.default",
  "schemaVersion": 2,
  "payload": { ... }
}
```

Rate limit: не более 3 попыток в час на пользователя.

---

#### `GET /api/professional-applications/me`

Возвращает текущую заявку пользователя и историю прошлых.

Ответ:
```json
{
  "current": {
    "id": "...",
    "status": "needs_revision",
    "decisionComment": "Укажите полный адрес",
    "lastSubmissionAt": "...",
    "currentRevision": { ... }
  },
  "history": [
    { "id": "...", "status": "rejected", "decisionComment": "...", "resolvedAt": "..." }
  ]
}
```

`history` — завершённые (rejected) заявки пользователя, упорядочены по `created_at desc`.

---

#### `POST /api/professional-applications/:id/resubmit`

Создаёт новую ревизию существующей заявки.
Разрешено только если `status = needs_revision` и заявка принадлежит текущему пользователю.

Body: аналогично `POST /api/professional-applications`.

Rate limit: не более 5 попыток в час на пользователя.

---

### 9.3 Админские endpoints

#### `GET /api/admin/moderation/cases`

Query:
- `domain` (default: `professional_application`)
- `queueStatus`
- `decisionStatus`
- `assigneeUserId`
- `activityGroupCode`
- `activitySubtypeCode`
- `q` — fulltext по `applicantDisplayName`, `phone`
- `dateFrom`, `dateTo` — по `last_activity_at`
- `limit`, `offset`

Доступ: `admin | moderator`.

---

#### `GET /api/admin/moderation/cases/:caseId`

Возвращает:
- case meta (включая `queue_status`, `decision_status`, `assignee`);
- subject summary (из `professional_applications`);
- full current revision payload (рендеримый по schema);
- revision history (все ревизии с `schema_key`, `schema_version`, `created_at`);
- audit events (полный лог `moderation_case_events`);
- basic applicant info (`user_id`, `applicant_display_name`, `contact_phone`).

---

#### `POST /api/admin/moderation/cases/:caseId/assign`

Body:
```json
{ "assigneeUserId": "uuid" }
```

`assigneeUserId: null` — снять назначение.

---

#### `POST /api/admin/professional-applications/:id/decision`

Body:
```json
{
  "decision": "approve | reject | needs_revision",
  "comment": "string",
  "expectedUpdatedAt": "ISO8601"
}
```

- `comment` обязателен для `reject` и `needs_revision`; опционален для `approve`;
- `expectedUpdatedAt` — optimistic concurrency: если `professional_applications.updated_at` не совпадает, возвращается `409` с текущим состоянием заявки.

Вся логика выполняется в одной транзакции. После коммита — JWT-инвалидация (только для `approve`).

---

#### `POST /api/admin/moderation/cases/:caseId/release`

Ручной возврат кейса из `in_review` в `open` (если модератор передаёт кейс другому).

---

## 10. UI/UX админ-панели

### 10.1 Навигация

Первый релиз должен строиться так, чтобы меню уже было модульным:

1. `Модерация`
2. `Журнал действий`

Внутри `Модерация`:
- `Заявки на проф. кабинет`
- (в будущем: `Контент`, `Отзывы`, `Жалобы`)

### 10.2 Список кейсов

Обязательные функции:
- фильтр по `queueStatus`;
- фильтр по `decisionStatus`;
- фильтр по `assignee`;
- фильтр по `activityGroupCode` / `activitySubtypeCode`;
- поиск по `applicantDisplayName`, `phone` (email исключён из v2 формы, поиск по нему только в legacy-данных);
- пагинация;
- сортировка по `last_activity_at desc` по умолчанию.

Колонки:
- `Case ID`
- `Заявитель`
- `Тип деятельности`
- `Телефон`
- `Статус очереди`
- `Решение`
- `Создана`
- `Последняя активность`
- `Ответственный`
- `Действия`

Обязательные состояния UI: loading skeleton, empty state («Нет кейсов по заданным фильтрам»), error state с кнопкой «Повторить».

### 10.3 Карточка кейса

Блоки:
1. `Summary` — заявитель, контакты, тип деятельности, даты
2. `Текущая ревизия заявки` — schema-aware рендер payload
3. `История ревизий` — список всех ревизий, каждую можно открыть read-only
4. `История модерации` — timeline из `moderation_case_events`
5. `Панель решения` — кнопки action + поле комментария

Требования:
- payload рендерится schema-aware компонентом (по `schema_key` + `schema_version` из ревизии);
- старые ревизии открываются read-only с указанием версии схемы;
- кнопки disabled во время mutation;
- после решения карточка автообновляется;
- ошибки concurrency показываются явно с diff текущего состояния — без silent overwrite;
- XSS: весь payload из JSONB перед рендером проходит server-side sanitation (все строки escaping, URL-поля проверяются по allowlist протоколов).

### 10.4 UX для будущих модулей

Общие части интерфейса не должны знать деталей именно профессиональной заявки.

Нужно отделить:
- generic page shell;
- generic queue table;
- generic timeline;
- generic decision footer;
- domain-specific renderer payload.

---

## 11. Права доступа и безопасность

### 11.1 Роли

На MVP:
- `admin` — полный доступ, включая системные справочники и управление модераторами;
- `moderator` — обработка кейсов без системных настроек.

**Как добавляется роль `moderator`:**
- На MVP роль назначается через SQL или internal admin endpoint (доступен только `admin`): `PATCH /api/admin/users/:id/role`.
- UI для управления пользователями — post-MVP.

### 11.2 Правила доступа

1. Пользовательские endpoints доступны только аутентифицированному владельцу заявки.
2. Схема формы (`GET /api/professional-application-schemas/...`) — только аутентифицированному пользователю, не публично.
3. Админские moderation endpoints доступны только `admin | moderator`.
4. Audit log чтение — `admin | moderator`; удаление записей — запрещено для всех ролей.
5. Изменение системных справочников (schema registry, роли) — только `admin`.

### 11.3 Технические требования безопасности

1. Любое решение модератора пишется в одной транзакции с обновлением заявки и кейса.
2. Для `reject` и `needs_revision` comment обязателен (проверка на backend, не только на frontend).
3. Payload заявки хранится как JSONB; перед рендером в UI — server-side sanitation.
4. Rate limit на submit (3/час) и resubmit (5/час) на уровне middleware.
5. `user.is_professional` изменяется только через approve flow (не через прямой UPDATE endpoint).
6. JWT-инвалидация после approve реализуется через таблицу `token_invalidations` (upsert по `user_id`).
7. Все adminские endpoints логируют `actor_user_id` из токена.

---

## 12. Observability и аудит

### 12.1 Audit

Аудит обязателен для:
- создания кейса;
- назначения ответственного;
- взятия в работу;
- ручного release из in_review;
- любого решения;
- resubmit пользователя;
- auto-release кейса фоновым job-ом.

### 12.2 Метрики

На MVP нужны базовые counters:
- количество открытых кейсов;
- количество approve/reject/needs_revision;
- среднее время от submit до решения;
- количество resubmit.

### 12.3 Логирование

В backend логировать структурированно (JSON):
- `case_id`
- `application_id`
- `actor_user_id`
- `decision`
- `schema_key`
- `schema_version`
- `duration_ms` (для решений)

---

## 13. Миграция существующих данных

### 13.1 Стратегия

Существующие записи в `business_applications` делятся на три группы:

| Статус | Действие |
|---|---|
| `approved` | Мигрировать в `professional_applications` со статусом `approved`; создать ревизию v1 с payload из текущих полей; кейс не создавать (resolved) |
| `pending` | Мигрировать в `professional_applications` со статусом `pending`; создать ревизию v1; создать `moderation_case` со статусом `open` |
| `rejected` | Мигрировать в `professional_applications` со статусом `rejected`; создать ревизию v1; кейс не создавать (resolved) |

### 13.2 Маппинг полей

Legacy-колонки `business_applications` → payload ревизии v1 (`schema_key: professional_cabinet.default`, `schema_version: 1`).

Payload хранит поля под теми же именами, что были в старой форме — без переименования:

```
business_name     → payload.businessName
phone             → payload.phone
contact_person    → payload.contactPerson
email             → payload.email
address           → payload.address
business_type     → payload.businessType   (legacy-поле, хранится as-is)
comment           → payload.comment
city              → payload.city
agreed_to_terms   → payload.agreedToTerms
```

Извлечение summary-полей из v1 payload по fieldMappings схемы v1:

```
applicant_display_name  ← payload.businessName
contact_phone           ← payload.phone
contact_email           ← payload.email
city                    ← payload.city
activity_group_code     ← lookup(payload.businessType) или NULL
activity_subtype_code   ← NULL (в legacy-данных подтип не фиксировался)
```

Таблица lookup `businessType → activityGroupCode` для наилучшего приближения (не гарантирует точность):

| businessType (legacy) | activityGroupCode |
|---|---|
| `auto_service` | `auto_service` |
| `auto_wash` | `auto_wash` |
| `private_master` | `private_executor` |
| всё остальное | `NULL` |

### 13.3 Требования к скрипту миграции

- Скрипт запускается однократно, идемпотентен (повторный запуск не дублирует данные).
- Проверяет до и после: количество записей в source == количество в target.
- Старая таблица `business_applications` не удаляется до успешного прохождения приёмочных тестов.
- Физическое переименование таблицы — отдельная техническая миграция, post-MVP.

---

## 14. План внедрения

### Этап 1. Backend foundation + Schema registry (параллельно с этапом 3)

1. Создать таблицы: `professional_application_schemas`, `professional_application_revisions`, `moderation_cases`, `moderation_case_events`, `token_invalidations`.
2. Добавить индексы и partial unique index на `user_id`.
3. Создать seed: `professional_cabinet.default` v1 для legacy-истории и `professional_cabinet.default` v2 как активную схему новой формы.
4. Реализовать versioned envelope: `POST /api/professional-applications` и `POST /api/professional-applications/:id/resubmit`.
5. Реализовать schema endpoint: `GET /api/professional-application-schemas/:schemaKey/active`.
6. Реализовать `GET /api/professional-applications/me` с `current` + `history`.
7. Закрыть прямую self-activation.
8. Добавить JWT-инвалидацию после approve.

### Этап 2. Admin backend

1. Реализовать `GET /api/admin/moderation/cases` с фильтрами и пагинацией.
2. Реализовать `GET /api/admin/moderation/cases/:caseId`.
3. Реализовать `POST /api/admin/moderation/cases/:caseId/assign`.
4. Реализовать `POST /api/admin/professional-applications/:id/decision` с optimistic concurrency.
5. Реализовать `POST /api/admin/moderation/cases/:caseId/release`.
6. Добавить роль `moderator` и guard на admin endpoints.
7. Реализовать auto-release job (24ч).

### Этап 3. Пользовательский frontend (параллельно с этапом 1)

1. Перевести форму заявки на versioned envelope (запрашивать схему из `/active`).
2. Добавить экран статуса текущей заявки с отображением `decisionComment`.
3. Добавить resubmit flow (предзаполнение из последней ревизии).
4. Добавить in-app уведомления при изменении статуса.

> **Важно:** этапы 1 и 3 разрабатываются параллельно с согласованным API-контрактом. Этап 3 не блокирует этап 2, но требует завершения этапа 1.

### Этап 4. Admin frontend

1. Собрать `AdminShell` с guard по ролям.
2. Реализовать список кейсов с фильтрами.
3. Реализовать карточку кейса (schema-aware рендер, timeline, decision panel).
4. Реализовать assignment widget.

### Этап 5. Hardening + Миграция

1. Запустить скрипт миграции `business_applications` → `professional_applications` на staging.
2. Верифицировать данные (счётчики, ручная проверка выборки).
3. Запустить миграцию на prod.
4. Добавить базовые метрики и audit log UI.
5. Подготовить подключение следующего moderation domain.

---

## 15. Критерии приёмки

1. Пользователь не может получить доступ к профессиональному кабинету без approve через админ-панель.
2. Пользователь с `is_professional = true` (approve) видит профкабинет только после refresh токена или повторного входа.
3. Пользователь не может подать новую заявку, пока есть активная (`pending | needs_revision`).
4. После `rejected` пользователь может подать повторно не ранее чем через 7 дней.
5. Админка показывает единую очередь заявок с фильтрами и пагинацией.
6. Каждая заявка имеет хотя бы одну ревизию с исходным payload и schema_key/schema_version.
7. При изменении формы старая заявка остаётся читаемой и корректно отображается по своей версии схемы.
8. `needs_revision` создаёт пользовательский сценарий повторной отправки; форма предзаполнена из последней ревизии.
9. `approve` включает `is_professional = true` в одной транзакции + JWT-инвалидация.
10. `reject` и `needs_revision` не проходят без комментария (проверка на backend).
11. Любое действие модератора попадает в `moderation_case_events`.
12. Карточка заявки защищена от silent overwrite через optimistic concurrency.
13. Кейс в `in_review` без активности более 24ч автоматически возвращается в `open`.
14. Архитектура позволяет добавить второй moderation domain без переделки generic shell.
15. Скрипт миграции прошёл успешно: все `business_applications` перенесены, счётчики совпадают.

---

## 16. Риски и решения

### Риск 1. Форма будет меняться чаще, чем backend

Решение:
- schema registry в `professional_application_schemas`;
- versioned envelope;
- immutable revisions.

### Риск 2. Старые заявки перестанут читаться после изменения формы

Решение:
- хранить `schema_key` / `schema_version` на каждой ревизии;
- рендерить заявку по её собственной схеме (schema-aware компонент в карточке).

### Риск 3. Два модератора примут конфликтующие решения

Решение:
- optimistic locking через `expectedUpdatedAt`;
- при конфликте возвращается `409` с текущим состоянием — модератор видит актуальные данные перед повтором.

### Риск 4. Модерация будет формально внедрена, но поток останется обходным

Решение:
- отключить endpoint прямой self-activation;
- закрыть frontend routes и backend actions на прямое включение professional mode;
- `is_professional` меняется только через approve flow (нет прямого UPDATE endpoint).

### Риск 5. Будущая модерация контента потребует переписать всё заново

Решение:
- queue, assignment и audit — в generic moderation layer;
- доменные особенности — отдельные модули и domain-specific renderers.

### Риск 6. Пользователь не видит профкабинет после approve

Решение:
- JWT-инвалидация через `token_invalidations` после approve;
- клиент при получении `401` делает refresh / редиректит на логин;
- in-app уведомление с CTA «Войти снова» явно подсказывает действие.

### Риск 7. Данные в business_applications потеряются при миграции

Решение:
- идемпотентный скрипт с валидацией счётчиков до/после;
- старая таблица не удаляется до успешной приёмки;
- rollback: восстановление из `business_applications` (таблица остаётся read-only).
