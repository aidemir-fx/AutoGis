# Спецификация: иерархия типов деятельности (БД + Backend)

> **Revision log (senior review, 2026-04-16):**
> - целостность `group↔subtype` переведена с триггера на композитный FK (§3.1);
> - добавлен partial UNIQUE на `user_activity_profiles(user_id) WHERE is_primary` — защита от нескольких primary (§3.1);
> - зафиксирован source of truth для `activity_subtype_id` и описана стратегия денормализации (§3.1, §4.4);
> - `payments` получил CHECK-constraint c allow-list вместо свободного `TEXT[]` (§4.1);
> - ON DELETE семантика явно прописана для всех FK;
> - формат API-ошибок, HTTP-статусы и envelope унифицированы (§10.4);
> - семантика AND/OR в поиске формализована (§7.3);
> - регистрация обёрнута в транзакцию, добавлен upsert и явный role-mapping (§7.1);
> - backfill получил батчинг, идемпотентность и пост-ран ассёрты (§8.2);
> - deprecation-план legacy-моделей формализован по фазам (§8.3);
> - добавлены partial-индексы, ETag/Cache-Control, схема `activity_audit_log`, NFR по p95 (§10);
> - описан сценарий soft-delete подтипа (§17.3);
> - i18n-поле `display_name_i18n` и версионирование `cabinet_schema_key` (§3.1).

## 1) Цель
Ввести двухуровневую модель деятельности:
- `основной тип` (например, `auto_wash`, `auto_service`, `private_executor`);
- `производный тип` (например, `auto_wash.self_service`, `auto_wash.classic`, `auto_service.tire_fitting`, `private_executor.master`).

Результат:
- при регистрации бизнеса пользователь выбирает основной тип и подтип;
- настройки личного кабинета и валидация зависят от подтипа;
- поиск и фильтрация работают и по основному типу, и по подтипу.

---

## 2) Термины и уровни модели

## 2.1 Основной тип деятельности (Activity Group)
Крупная бизнес-категория, определяющая базовый профиль:
- `auto_wash` (автомойка)
- `auto_service` (автосервис)
- `private_executor` (частный исполнитель, переименование «частного мастера»)
- (опционально позже) `auto_shop` и другие группы.

## 2.2 Производный тип (Activity Subtype)
Конкретная специализация внутри основного типа, влияющая на UX и бизнес-логику.

Примеры:
- для `auto_wash`:
  - `classic` (классическая автомойка)
  - `self_service` (самомойка)
- для `auto_service`:
  - `general_service` (общий автосервис)
  - `tire_fitting` (шиномонтаж)
  - `detailing` (детейлинг)
  - `oil_service` (замена масла)
- для `private_executor` (частный исполнитель):
  - `master` (мастер)
  - `washer` (мойщик)
  - в дальнейшем допускается расширение новыми подтипами без изменения структуры.

---

## 3) Целевая архитектура данных

Сохраняем текущий подход с отдельными профильными таблицами (`auto_washes`, `auto_services`, `masters`) и добавляем универсальный слой классификации.

## 3.1 Новые справочники

### `activity_groups`
- `id` UUID PK
- `code` VARCHAR(64) UNIQUE NOT NULL (`auto_wash`, `auto_service`, `private_executor`)
- `display_name` VARCHAR(128) NOT NULL
- `description` TEXT NULL
- `is_active` BOOLEAN DEFAULT true
- `sort_order` INT DEFAULT 100
- `created_at`, `updated_at`

### `activity_subtypes`
- `id` UUID PK
- `group_id` UUID NOT NULL FK -> `activity_groups.id` ON DELETE RESTRICT
- `code` VARCHAR(64) NOT NULL (уникален в рамках группы)
- `display_name` VARCHAR(128) NOT NULL
- `display_name_i18n` JSONB NULL — карта локалей вида `{"ru": "...", "kk": "...", "en": "..."}` для интернационализации
- `description` TEXT NULL
- `is_active` BOOLEAN DEFAULT true
- `sort_order` INT DEFAULT 100
- `cabinet_schema_key` VARCHAR(128) NOT NULL — формат `<group>.<subtype>.v<major>` (например `auto_wash.classic.v1`); смена мажорной версии обязательно сопровождается миграцией данных и документацией breaking-changes
- `settings_schema` JSONB NULL — декларативная схема полей, валидируется как **JSON Schema Draft 2020-12**
- `created_at`, `updated_at`
- UNIQUE (`group_id`, `code`)
- UNIQUE (`id`, `group_id`) — техническая уникальность для композитного FK ниже

### `user_activity_profiles` (выбор типа для пользователя)
- `id` UUID PK
- `user_id` UUID NOT NULL FK -> `users.id` ON DELETE CASCADE
- `activity_group_id` UUID NOT NULL
- `activity_subtype_id` UUID NOT NULL
- `is_primary` BOOLEAN DEFAULT false
- `created_at`, `updated_at`
- UNIQUE (`user_id`, `activity_group_id`, `activity_subtype_id`)
- **Композитный FK** `(activity_subtype_id, activity_group_id) REFERENCES activity_subtypes(id, group_id) ON DELETE RESTRICT` — гарантирует, что подтип действительно принадлежит указанной группе на уровне БД (без триггера).
- **Partial unique index** `UNIQUE (user_id) WHERE is_primary = true` — у пользователя не более одного primary-профиля.
- **Partial index** `(activity_group_id, activity_subtype_id) WHERE is_primary = true` — для быстрой выборки по основному профилю.

Правило целостности `subtype.group_id == activity_group_id` обеспечивается **композитным FK** (см. выше), а не триггером. Дополнительный backend-level guard в usecase оставляем для валидации по `code` до записи и для понятных ошибок API.

**Источник истины** для `(group, subtype)` конкретного провайдера — `user_activity_profiles`. Поля `activity_subtype_id` в `auto_washes/auto_services/masters` являются **денормализованной копией** для быстрых JOIN'ов и фильтрации; их консистентность гарантируется триггером `sync_profile_subtype` (§13.4.1) или переводом профильных таблиц в view-режим (см. альтернативу в §3.3).

---

## 4) Изменения в профильных таблицах

## 4.1 `auto_washes`
Добавить:
- `activity_subtype_id` UUID NULL FK -> `activity_subtypes.id` ON DELETE RESTRICT
- `box_count` INT NULL CHECK (`box_count >= 0 AND box_count <= 500`) — верхняя граница как sanity-check против ошибок ввода
- `washer_count` INT NULL CHECK (`washer_count >= 0 AND washer_count <= 500`)
- `has_waiting_area` BOOLEAN DEFAULT false
- `payments` TEXT[] DEFAULT '{}' CHECK (`payments <@ ARRAY['cash','card','qr','sbp','apple_pay','google_pay']::text[]`) — фиксируем enum значений, чтобы не допустить «грязных» строк; расширение — через новую миграцию.

Важно:
- колонку `wash_type` не добавлять отдельно, чтобы не дублировать подтип;
- тип автомойки берётся из `activity_subtype_id`;
- `washer_count` имеет смысл только для `auto_wash.classic` (для `self_service` оставляем NULL) — это контролируется subtype-specific валидатором (§9.2), не CHECK-constraint'ом.

## 4.2 `auto_services`
Добавить:
- `activity_subtype_id` UUID NULL FK -> `activity_subtypes.id` ON DELETE RESTRICT

Поля `has_parking`, `lift_count`, `warranty`, `hotline`, `brand_support` уже есть, оставить.

## 4.3 `masters` (частные исполнители)
Добавить:
- `activity_subtype_id` UUID NULL FK -> `activity_subtypes.id` ON DELETE RESTRICT

Важно:
- текущая таблица `masters` переиспользуется для группы `private_executor`;
- в пользовательских интерфейсах и документации термин «частный мастер» заменяется на «частный исполнитель»;
- переименование самой таблицы в `private_executors` (для чистоты модели) выделяется в отдельную задачу **после** завершения транзита; до этого имя таблицы — технический долг, фиксированный в `TECH_DEBT.md`.

## 4.4 Денормализация и консистентность
Поле `activity_subtype_id` в `auto_washes/auto_services/masters` дублирует данные из `user_activity_profiles`. Для предотвращения рассинхрона:

- **Вариант A (рекомендуемый)**: триггер `sync_profile_subtype` BEFORE INSERT/UPDATE — при изменении `activity_subtype_id` в профильной таблице валидирует, что у владельца (`user_id`) существует соответствующая запись в `user_activity_profiles` с тем же `activity_subtype_id`. При отсутствии — отказ с кодом `ACTIVITY_SUBTYPE_NOT_LINKED`.
- **Вариант B**: убрать `activity_subtype_id` из профильных таблиц и JOIN'ить через `user_activity_profiles` по `user_id`. Даёт нормализованную модель, но каждый поиск — лишний JOIN. Оставляем как fallback если Вариант A окажется дорогим.

Выбор фиксируется до начала реализации V3 (см. §12).

---

## 5) Правила применения настроек ЛК по подтипам

Backend возвращает:
- базовые поля профиля;
- `activityGroup` + `activitySubtype`;
- `cabinetSchemaKey` (или JSON schema) для динамического рендера фронтом.

Примеры:
- `auto_wash.classic`:
  - показывать поля для персонала (`washerCount`), боксов, зоны ожидания.
- `auto_wash.self_service`:
  - показывать боксы, платежи, режим работы постов; поле `washerCount` может быть скрыто или только для справки.
- `auto_service.tire_fitting`:
  - акцент на услугах шиномонтажа.
- `auto_service.detailing`:
  - акцент на детейлинг-услугах и пакетах.
- `private_executor.master`:
  - показывать профиль и настройки частного исполнителя в режиме мастера.
- `private_executor.washer`:
  - показывать профиль и настройки частного исполнителя в режиме мойщика.

---

## 6) Backend-контракты (DTO/API)

## 6.1 Новые DTO

### `ActivityGroupResponse`
- `id`, `code`, `displayName`, `description`, `isActive`, `sortOrder`

### `ActivitySubtypeResponse`
- `id`, `groupId`, `code`, `displayName`, `description`, `isActive`, `sortOrder`, `cabinetSchemaKey`

### `RegisterActivityRequest` (расширить)
- `activityGroupCode` (обяз.)
- `activitySubtypeCode` (обяз.)
- текущие поля профиля (как сейчас)

Правило нейминга API:
- во всех новых/обновленных контрактах использовать термин `private_executor` и «частный исполнитель»;
- legacy-ключи/роуты с `master` допускаются только как обратная совместимость на переходный период.

## 6.2 Обновить существующие ответы профилей
Добавить в:
- `AutoWashResponse`
- `AutoServiceResponse`
- `MasterProfileResponse` (как профиль частного исполнителя)
- (при расширении — `AutoShopResponse`)

поля:
- `activityGroup` (`code`, `displayName`)
- `activitySubtype` (`code`, `displayName`, `cabinetSchemaKey`)

## 6.3 Эндпоинты справочников
- `GET /api/activity-groups`
- `GET /api/activity-groups/:groupCode/subtypes`

Назначение: регистрация и настройки получают актуальный список подтипов с бэкенда.

---

## 7) UseCase-логика

## 7.1 Регистрация деятельности
Поток (всё выполняется в **одной БД-транзакции** с изоляцией не ниже `READ COMMITTED`, регистрация идемпотентна по `(user_id, activity_group_code, activity_subtype_code)`):
1. Проверить `activityGroupCode`, `activitySubtypeCode`; если группа/подтип неактивна (`is_active=false`) — отказ `ACTIVITY_SUBTYPE_DISABLED`.
2. Проверить принадлежность подтипа группе (уже обеспечено композитным FK, но даём понятную API-ошибку заранее).
3. Upsert профиля (`auto_washes`, `auto_services` или `masters`) с `activity_subtype_id`:
   - `INSERT ... ON CONFLICT (user_id) DO UPDATE` — гарантирует, что повторная регистрация не создаёт дубликат.
4. Upsert в `user_activity_profiles` с `ON CONFLICT (user_id, activity_group_id, activity_subtype_id) DO NOTHING`.
5. Обновить `users.role` по **таблице маппинга** (фиксируется в коде, не в БД):
   | activity_group | users.role |
   |---|---|
   | `auto_wash`, `auto_service` | `business` |
   | `private_executor` | `master` (legacy, до переименования роли) |
   Если у юзера уже активна роль более высокого приоритета (напр. `admin`) — роль не понижается.
6. Записать аудит-событие `activity_profile_created` (§10.1).

## 7.2 Обновление профиля
Если меняется подтип:
1. Проверить валидность нового подтипа для группы.
2. Обновить `activity_subtype_id` в профильной таблице.
3. Применить подтип-специфичную валидацию.

## 7.3 Поиск
Поддержать фильтры:
- `activityGroups[]` — коды групп
- `activitySubtypes[]` — коды подтипов

**Семантика комбинирования**:
- внутри одного массива — `OR` (`groups=[a,b]` → `a OR b`);
- между массивами — `AND` (`groups=[a] AND subtypes=[x]`);
- если `subtypes[]` указан и ни один не принадлежит ни одной из `groups[]` — возвращать пустой результат **без ошибки** (UI может фильтровать независимо);
- при конфликтных парах (subtype не принадлежит указанной группе) — игнорировать эту комбинацию, а не валиться с 400.

Результат поиска должен включать оба уровня (`group`, `subtype`) для корректного UI-фильтра. Во избежание N+1 — JOIN'ить справочники единым запросом с hydration в репозитории.

---

## 8) Миграция данных

## 8.1 Seed справочников
Создать группы:
- `auto_wash`, `auto_service`, `private_executor`

Создать подтипы:
- `auto_wash`: `classic`, `self_service`
- `auto_service`: `general_service`, `tire_fitting`, `detailing`, `oil_service`
- `private_executor`: `master`, `washer`

## 8.2 Backfill существующих профилей
- `auto_washes` -> подтип по умолчанию `classic`
- `auto_services` -> подтип по умолчанию `general_service`
- `masters` -> подтип по умолчанию `master`

Шаги:
1. Заполнить `activity_subtype_id` в профильных таблицах.
2. Создать `user_activity_profiles` для существующих записей.
3. Для существующих «частных мастеров» всегда проставить `private_executor.master` (не `washer`).
4. Для legacy-логики `activity_types`/`user_activity_types` оставить обратную совместимость на переходный период.

**Безопасность выполнения backfill:**
- выполнять **батчами** по 1000–5000 строк в отдельных транзакциях (`UPDATE ... WHERE id IN (SELECT ... LIMIT N)`), чтобы не брать долгих локов;
- **идемпотентность**: `UPDATE ... WHERE activity_subtype_id IS NULL`, `INSERT ... ON CONFLICT DO NOTHING`;
- для `user_activity_profiles` первичная вставка выполняется с `is_primary = true` (у legacy-профилей он единственный);
- по завершении — ran-ассёрт: `SELECT COUNT(*) FROM auto_washes WHERE activity_subtype_id IS NULL` должен быть `0`; если не `0` — блокировать переход к V5;
- выполнение миграции логировать в таблицу `schema_migrations_log` (время старта/финиша, обработанные строки).

## 8.3 Переходный период
До полного перевода клиентов:
- читать новую модель как приоритет;
- при отсутствии новой связки, использовать старый `activity_types`.

После миграции:
- задепрекейтить старые `activity_types`/`user_activity_types` или оставить только как справочник витрины.

**Deprecation timeline (конкретные фазы, не даты — даты фиксируются в ROADMAP):**
1. **Фаза 1 (dual-write)**: backend пишет И в новую, и в старую модель; читает новую с fallback на старую. Метрика: `% запросов, отданных из fallback`. Цель — снизить до 0%.
2. **Фаза 2 (new primary)**: после стабильного 0% fallback в течение минимум 2 недель — переключаем пишущий путь только на новую модель, legacy — read-only.
3. **Фаза 3 (legacy removal)**: drop legacy-таблиц отдельной миграцией. Обязательно после дампа и подтверждения отсутствия внешних потребителей (см. §17.3).
4. Каждый endpoint, отдающий legacy-поля, помечается HTTP-заголовком `Deprecation: true` и `Sunset: <date>` (RFC 8594).

---

## 9) Валидация

## 9.1 Общая
- проверка, что subtype принадлежит group;
- проверка прав на изменение профиля (владелец/админ);
- обязательные базовые поля профиля (название, телефон, адрес, координаты, график).

## 9.2 Подтип-специфичная
Рекомендация: реализовать через map-валидатор `map[subtypeCode]Validator`.

Примеры:
- `auto_wash.self_service`: `box_count >= 1` обязательно.
- `auto_wash.classic`: `washer_count >= 1` рекомендуется, но можно сделать обязательным.
- `auto_service.tire_fitting`: минимум 1 профильная услуга из шино-монтажного набора.
- `private_executor.washer`: валидировать поля, специфичные для мойщика, только для этого подтипа.

---

## 10) Нефункциональные требования

### 10.1 Индексы
- `activity_groups(code)` — UNIQUE, уже есть из §3.1
- `activity_groups(code) WHERE is_active = true` — partial, для списков на UI
- `activity_subtypes(group_id, code)` — UNIQUE
- `activity_subtypes(group_id, sort_order) WHERE is_active = true` — partial, для отсортированных выдач
- `user_activity_profiles(user_id, activity_group_id)`
- `user_activity_profiles(user_id) WHERE is_primary = true` — partial UNIQUE
- `auto_washes(activity_subtype_id)`
- `auto_services(activity_subtype_id)`
- `masters(activity_subtype_id)`

### 10.2 Кэширование справочников
- `GET /api/activity-groups` и `GET /api/activity-groups/:groupCode/subtypes` — не ходить в БД на каждый вызов;
- **ETag** на основе `MAX(updated_at)` справочников + `If-None-Match` → `304`;
- `Cache-Control: public, max-age=300, stale-while-revalidate=3600`;
- in-memory cache в process-local с TTL 60s; инвалидация при admin-мутациях справочников (в текущей задаче admin CRUD out of scope — фиксируем только контракт кэша).

### 10.3 Аудит (уточнение)
Таблица `activity_audit_log`:
- `id` UUID PK
- `actor_user_id` UUID NULL (NULL для системных действий)
- `subject_user_id` UUID NOT NULL
- `action` VARCHAR(64) NOT NULL — `activity_profile_created`, `activity_subtype_changed`, `activity_profile_primary_switched`
- `old_value` JSONB NULL
- `new_value` JSONB NULL
- `created_at` TIMESTAMP DEFAULT now()
- INDEX (`subject_user_id`, `created_at DESC`)

Запись обязательна для любых мутаций `user_activity_profiles` и `*.activity_subtype_id`. Retention — минимум 12 месяцев.

### 10.4 Формат ошибок API
Все ошибки — единый envelope:
```json
{
  "success": false,
  "error": {
    "code": "ACTIVITY_SUBTYPE_GROUP_MISMATCH",
    "message": "Subtype 'tire_fitting' does not belong to group 'auto_wash'",
    "field": "activitySubtypeCode",
    "details": { "group": "auto_wash", "subtype": "tire_fitting" }
  }
}
```
Коды + HTTP-статусы:
| code | HTTP |
|---|---|
| `ACTIVITY_GROUP_NOT_FOUND` | 404 |
| `ACTIVITY_SUBTYPE_NOT_FOUND` | 404 |
| `ACTIVITY_SUBTYPE_GROUP_MISMATCH` | 400 |
| `ACTIVITY_SUBTYPE_DISABLED` | 409 |
| `ACTIVITY_SUBTYPE_NOT_LINKED` | 409 |
| `SUBTYPE_VALIDATION_FAILED` | 422 |

### 10.5 Производительность
- `GET /api/activity-groups/:code/subtypes` — цель p95 < 50 ms (с учётом кэша);
- Регистрация деятельности — p95 < 500 ms при warm cache, включая аудит-запись.

---

## 11) Критерии приемки
1. При регистрации автомойки обязательно выбирается подтип: `classic` или `self_service`.
2. Для разных подтипов автомойки отдаются разные `cabinetSchemaKey`/настройки.
3. При регистрации автосервиса можно выбрать подтипы (минимум `general_service`, `tire_fitting`, `detailing`).
4. При регистрации частного исполнителя доступны подтипы `master` и `washer`.
5. Профили в БД имеют валидную связку `group + subtype`.
6. Поиск фильтрует по подтипам и корректно возвращает типы в выдаче.
7. Существующие профили после миграции не теряют доступность и корректно получают дефолтный подтип.
8. Все существующие записи бывших «частных мастеров» после backfill становятся `private_executor.master`.

---

## 12) План внедрения
1. Добавить новые таблицы и индексы (миграция V1).
2. Засеять группы/подтипы (миграция V2).
3. Добавить `activity_subtype_id` в профильные таблицы + backfill (миграция V3).
4. Расширить DTO/usecase/handler/repository новой моделью.
5. Включить dual-read (новая модель + fallback legacy).
6. Обновить фронтенд регистрации/настроек для выбора подтипов.
7. После стабилизации выключить fallback legacy.

---

## 13) Реализация в БД (детально)

Ниже описан целевой набор миграций. Это спецификация к реализации, не выполненная миграция.

## 13.1 Миграция V1: новые таблицы классификации
Создать:
- `activity_groups`
- `activity_subtypes`
- `user_activity_profiles`

Обязательные ограничения:
- `activity_groups.code` UNIQUE
- `activity_subtypes` UNIQUE (`group_id`, `code`)
- `user_activity_profiles` UNIQUE (`user_id`, `activity_group_id`, `activity_subtype_id`)

Обязательные индексы:
- `idx_activity_groups_code`
- `idx_activity_subtypes_group_code`
- `idx_user_activity_profiles_user_group`
- `idx_user_activity_profiles_subtype`

## 13.2 Миграция V2: seed справочников
Добавить группы:
- `auto_wash`
- `auto_service`
- `private_executor`

Добавить подтипы:
- `auto_wash`: `classic`, `self_service`
- `auto_service`: `general_service`, `tire_fitting`, `detailing`, `oil_service`
- `private_executor`: `master`, `washer`

## 13.3 Миграция V3: расширение профильных таблиц
Добавить поля:
- `auto_washes.activity_subtype_id` UUID NULL
- `auto_services.activity_subtype_id` UUID NULL
- `masters.activity_subtype_id` UUID NULL

Дополнительно для автомоек:
- `auto_washes.box_count` INT NULL CHECK (`box_count >= 0`)
- `auto_washes.washer_count` INT NULL CHECK (`washer_count >= 0`)
- `auto_washes.has_waiting_area` BOOLEAN DEFAULT false
- `auto_washes.payments` TEXT[] DEFAULT '{}'

Добавить индексы:
- `idx_auto_washes_activity_subtype_id`
- `idx_auto_services_activity_subtype_id`
- `idx_masters_activity_subtype_id`

## 13.4 Миграция V4: backfill
Правила backfill:
- все существующие `auto_washes` -> `auto_wash.classic`
- все существующие `auto_services` -> `auto_service.general_service`
- все существующие `masters` -> `private_executor.master`

После заполнения `activity_subtype_id`:
- создать записи в `user_activity_profiles` для владельцев профилей;
- исключить создание дублей (`ON CONFLICT DO NOTHING`).

Ключевое правило:
- бывшие «частные мастера» всегда остаются `master`, не `washer`.

## 13.5 Миграция V5: усиление ограничений (после стабилизации)
После успешного rollout:
- перевести `activity_subtype_id` в `NOT NULL` для `auto_washes`, `auto_services`, `masters`;
- включить триггер/constraint-проверку соответствия `group_id` и `subtype_id` в `user_activity_profiles`.

---

## 14) Реализация в Backend (детально)

## 14.1 `domain/entities.go`
Добавить сущности:
- `ActivityGroup`
- `ActivitySubtype`
- `UserActivityProfile`

Обновить существующие:
- `AutoWash` -> добавить `ActivitySubtypeID *string`
- `AutoService` -> добавить `ActivitySubtypeID *string`
- `Master` -> добавить `ActivitySubtypeID *string`

Нейминг:
- бизнес-термин в новых структурах: `private_executor` / «частный исполнитель».
- legacy-роль `master` пока не удаляется до завершения перехода.

## 14.2 `domain/dto.go`
Добавить:
- `ActivityGroupResponse`
- `ActivitySubtypeResponse`

Расширить:
- `RegisterActivityRequest`:
  - `activityGroupCode string`
  - `activitySubtypeCode string`
- `AutoWashResponse`, `AutoServiceResponse`, `MasterProfileResponse`:
  - `activityGroup`
  - `activitySubtype`

Переходная совместимость:
- старые поля/маршруты допускаются, но новые клиенты должны работать через `group+subtype`.

## 14.3 `repository/interfaces.go` и реализации
Добавить репозитории:
- `ActivityGroupRepository`
- `ActivitySubtypeRepository`
- `UserActivityProfileRepository`

Методы (минимум):
- `GetByCode`, `GetByID`, `GetActive`, `GetByGroupCode`
- `Create`, `Upsert`, `GetByUserID`

## 14.4 UseCase
Обновить регистрацию:
- валидация `activityGroupCode` и `activitySubtypeCode`;
- проверка принадлежности подтипа группе;
- запись `activity_subtype_id` в профиль;
- upsert в `user_activity_profiles`.

Обновить профильные usecase:
- изменение подтипа с валидацией;
- subtype-specific validation.

Обновить поиск:
- входные фильтры: `activityGroups[]`, `activitySubtypes[]`;
- выдача: вернуть оба уровня классификации.

## 14.5 Handler/API
Добавить эндпоинты:
- `GET /api/activity-groups`
- `GET /api/activity-groups/:groupCode/subtypes`

Обновить:
- registration endpoint (прием `activityGroupCode`, `activitySubtypeCode`);
- profile endpoints для отдачи `activityGroup`/`activitySubtype`.

---

## 15) API-контракты (минимальный целевой формат)

## 15.1 Пример регистрации
`POST /api/activities/register`

Запрос (пример):
```json
{
  "activityGroupCode": "private_executor",
  "activitySubtypeCode": "master",
  "fullName": "Иван Петров",
  "workingPhone": "+79990000000",
  "address": "Москва, ...",
  "coordinates": { "x": 55.75, "y": 37.61 }
}
```

Ответ (пример):
```json
{
  "success": true,
  "type": "private_executor",
  "data": {
    "activityGroup": { "code": "private_executor", "displayName": "Частный исполнитель" },
    "activitySubtype": { "code": "master", "displayName": "Мастер", "cabinetSchemaKey": "private_executor.master.v1" }
  }
}
```

## 15.2 Пример справочника подтипов
`GET /api/activity-groups/private_executor/subtypes`

Ответ (пример):
```json
[
  { "code": "master", "displayName": "Мастер", "cabinetSchemaKey": "private_executor.master.v1" },
  { "code": "washer", "displayName": "Мойщик", "cabinetSchemaKey": "private_executor.washer.v1" }
]
```

---

## 16) Тест-план (обязательный)

## 16.1 Unit
- валидация `group/subtype` соответствия;
- валидация запрета несоответствующих комбинаций;
- default-логика backfill для существующих `masters -> master`.

## 16.2 Integration
- регистрация для:
  - `auto_wash.classic`
  - `auto_service.tire_fitting`
  - `private_executor.master`
- обновление подтипа профиля;
- чтение профиля с корректными `activityGroup/activitySubtype`.

## 16.3 Migration tests
- идемпотентность seed;
- корректный backfill на существующих данных;
- отсутствие дублей в `user_activity_profiles`.

---

## 17) Rollout и откат

## 17.1 Rollout
1. Вкатить миграции V1-V4.
2. Выпустить backend с dual-read/dual-write.
3. Перевести фронтенд на новые поля.
4. После стабилизации включить V5 (`NOT NULL`, строгие ограничения).

## 17.2 Откат
- не удалять новые таблицы при быстром откате приложения;
- при откате backend временно читать legacy-логику;
- данные `group/subtype` сохраняются и не теряются.

## 17.3 Soft-delete подтипа (эксплуатация)
Когда подтип переводится в `is_active = false`:
- новые регистрации с этим `subtype_code` отказываются с `ACTIVITY_SUBTYPE_DISABLED` (HTTP 409);
- существующие профили **не мигрируют автоматически** — отображаются как есть, но в админ-UI показывается бейдж «Архивный подтип»;
- удалить подтип физически разрешено **только** если нет ссылок в `user_activity_profiles` и профильных таблицах (ON DELETE RESTRICT даст ошибку); иначе — выполнять ручную миграцию на актуальный подтип с аудит-записью `activity_subtype_changed`.

---

## 18) Границы текущей задачи
- В рамках этой задачи обновляется только спецификация.
- Реальные SQL-миграции, код backend и код frontend выполняются отдельной задачей после согласования этой версии спецификации.
