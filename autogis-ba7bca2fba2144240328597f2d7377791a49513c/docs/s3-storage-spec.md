# Спецификация S3-хранилища для медиа-контента

## 1. Цель и контекст

Нужно реализовать масштабируемое и безопасное объектное хранилище для контента сайта на базе Amazon S3 (или S3-совместимого провайдера), покрывающее:
- фотографии аккаунтов (аватары);
- фотографии работ;
- фотографии объектов.

Документ задаёт целевую архитектуру, требования к безопасности, модели хранения, API-контракты и план внедрения.

## 2. Область v1

В v1 включаем:
- хранение оригиналов и производных изображений (thumbnail/medium/webp);
- загрузку через pre-signed URL (без проксирования файлов через backend);
- выдачу через CDN;
- валидацию типа/размера файлов;
- lifecycle-политики и версионирование;
- аудит и мониторинг операций.

Вне v1:
- видео и другие тяжёлые форматы;
- realtime-редактор изображений;
- сложный AI-пайплайн обработки.

## 3. Нефункциональные требования

- Доступность: не ниже 99.9% на уровне сервиса медиа.
- Масштабируемость: линейное горизонтальное масштабирование по числу загрузок и выдач.
- Безопасность: private bucket, доступ только по минимально необходимым правам (least privilege).
- Производительность:
  - получение URL на загрузку: p95 < 200 ms;
  - загрузка изображения до 10 MB: p95 < 3 s (при стабильной сети пользователя);
  - отдача через CDN: p95 TTFB < 150 ms в целевых регионах.
- Наблюдаемость: метрики, structured logs, алерты.

## 4. Архитектура

Компоненты:
1. **S3 bucket** (private, versioning enabled).
2. **Backend API**:
   - выдаёт pre-signed PUT URL с привязкой к intent;
   - подтверждает загрузку и сохраняет метаданные в БД;
   - формирует signed/public CDN URL для чтения.
3. **Image processor** (асинхронно):
   - проверяет magic bytes и сигнатуру файла;
   - генерирует derivative-версии;
   - проверяет целостность и нормализует формат;
   - перемещает объект из staging-prefix в финальный ключ или в карантин.
4. **CDN** (CloudFront/аналог):
   - кеширует производные изображения;
   - контролирует TTL и инвалидации.
5. **Metadata DB** (PostgreSQL):
   - хранит связь сущности (account/work/object) с объектами в S3.

### 4.1 Поток загрузки

```
Клиент                   Backend                  S3                  Processor
  |                          |                     |                       |
  |-- POST /upload-intent -->|                     |                       |
  |                          |-- генерировать      |                       |
  |                          |   staging_key       |                       |
  |                          |   + final_key       |                       |
  |                          |-- сохранить intent  |                       |
  |<- uploadUrl (staging) ---|   в pending_intents |                       |
  |                          |                     |                       |
  |-- PUT (pre-signed) ----------------------->   |                       |
  |                          |                     |                       |
  |-- POST /confirm-upload ->|                     |                       |
  |                          |-- HEAD staging key->|                       |
  |                          |-- проверить intent  |                       |
  |                          |   (user_id match)   |                       |
  |                          |-- запись в media_   |                       |
  |                          |   assets (status=   |                       |
  |                          |   processing,       |                       |
  |                          |   object_key=NULL)  |                       |
  |                          |-- enqueue job ------|---------------------->|
  |<- {assetId, processing} -|                     |                       |
  |                          |                     |   HEAD final_key? --->|
  |                          |                     |   (идемпотентность)   |
  |                          |                     |                       |-- валидация magic bytes
  |                          |                     |                       |-- EXIF strip / автоповорот
  |                          |                     |                       |-- copy staging → final_key
  |                          |                     |                       |   или copy → quarantine/
  |                          |                     |                       |-- генерация variants
  |                          |                     |                       |-- delete staging key
  |                          |                     |                       |-- UPDATE media_assets
  |                          |                     |                       |   object_key=final_key
  |                          |                     |                       |   status=ready|failed
  |                          |                     |                       |
  |-- GET /media/{type}/{id} ->|                   |                       |
  |<- [{urls, status=ready}] --|                   |                       |
```

Ключевое правило: **все загрузки приземляются в staging-prefix** (`uploads/tmp/{intent_uuid}`).
Processor валидирует файл и только затем копирует в финальный ключ. CDN и клиенты получают URL только на финальные ключи — контент без прохождения валидации недоступен.
Источник задач для processor в v1 — только очередь из `confirm-upload` (single writer), чтобы исключить двойную обработку.

**Жизненный цикл `object_key`:** финальный ключ (`final_key`) генерируется в момент создания `upload-intent` и сохраняется в `pending_intents`. При создании записи `media_assets` (на шаге `confirm-upload`) `object_key` остаётся `NULL`. Processor переносит `final_key` из задачи в `media_assets.object_key` после успешного копирования объекта. Клиенты и CDN видят `object_key` только после перехода в `status = ready`.

### 4.2 Polling статуса обработки

После `confirm-upload` клиент получает `status: processing`. Узнать о готовности можно:
- **Polling** (рекомендован для v1): `GET /api/v1/media/assets/{assetId}` с интервалом 2–3 сек, до 30 сек суммарно. Если за 30 сек статус не стал `ready` — показать сообщение "обработка займёт больше времени, обновите страницу позже"; не прерывать фоновую обработку.
- **SSE / Webhook** (v2): сервер пушит событие `media.ready` по `assetId`.

## 5. Структура bucket и ключей

Рекомендуемый bucket (prod):
- `autogis-media-prod`

Среды:
- `autogis-media-dev`
- `autogis-media-stage`
- `autogis-media-prod`

### 5.1 Префиксы ключей

**Staging (временные, до прохождения валидации):**
```
uploads/tmp/{intent_uuid}
```

**Финальные оригиналы:**
```
accounts/{account_id}/avatar/{yyyy}/{mm}/{uuid}.{ext}
works/{work_id}/photos/{yyyy}/{mm}/{uuid}.{ext}
objects/{object_id}/photos/{yyyy}/{mm}/{uuid}.{ext}
```

**Производные (derivatives)** — хранятся рядом с сущностью, чтобы удаление по prefix было атомарным:
```
accounts/{account_id}/derivatives/{source_uuid}/{variant}.{ext}
works/{work_id}/derivatives/{source_uuid}/{variant}.{ext}
objects/{object_id}/derivatives/{source_uuid}/{variant}.{ext}
```

**Карантин:**
```
quarantine/{yyyy}/{mm}/{entity_type}/{entity_id}/{intent_uuid}
```

### 5.2 Требования к key naming

- Только lowercase ASCII, `-`, `_`, `/`, `.`.
- UUIDv7/ULID для уникальности и сортируемости.
- Запрет пользовательских имён файлов в ключе (исключаем path traversal и утечки PII).

## 6. Модель данных (БД)

### 6.1 Таблица `pending_intents`

Хранит активные upload-intent до подтверждения или истечения TTL.

| Колонка | Тип | Описание |
|---|---|---|
| `id` | uuid, pk | ID intent |
| `user_id` | uuid | Аутентифицированный пользователь |
| `entity_type` | `account\|work\|object` | |
| `entity_id` | uuid/bigint | |
| `category` | `avatar\|photo` | |
| `staging_key` | text | Ключ в staging-prefix (`uploads/tmp/{id}`) |
| `final_key` | text | Предгенерированный финальный ключ; processor использует его как destination при copy |
| `mime_type` | text | |
| `size_bytes` | bigint | Заявленный размер |
| `expires_at` | timestamptz | TTL intent (5 мин) |
| `created_at` | timestamptz | |

Индекс: `(user_id, staging_key)`, `(expires_at)` для cleanup.

### 6.2 Таблица `media_assets`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | uuid, pk | |
| `entity_type` | `account\|work\|object` | |
| `entity_id` | uuid/bigint | |
| `category` | `avatar\|photo` | |
| `intent_id` | uuid, unique | Идентификатор upload-intent для идемпотентности confirm |
| `storage_bucket` | text | |
| `object_key` | text, unique, **nullable** | `NULL` при `status=processing`; заполняется processor'ом после успешного копирования в финальный ключ |
| `mime_type` | text | |
| `size_bytes` | bigint | Фактический размер (из S3 metadata) |
| `checksum_sha256` | text | Считается processor после загрузки |
| `width` | int | |
| `height` | int | |
| `status` | `processing\|ready\|failed\|deleted` | |
| `created_by` | uuid | user_id |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz, nullable | Soft delete |

> Статус `uploaded` убран: запись в `media_assets` создаётся только после `confirm-upload`,
> то есть объект уже гарантированно находится в S3 на staging-prefix.

### 6.3 Таблица `media_derivatives`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | uuid, pk | |
| `asset_id` | uuid, fk → `media_assets.id` | |
| `variant` | `thumb\|medium\|large` | |
| `format` | `webp\|jpeg` | webp основной, jpeg как fallback |
| `object_key` | text, unique | |
| `mime_type` | text | |
| `size_bytes` | bigint | |
| `width` | int | |
| `height` | int | |
| `created_at` | timestamptz | |

### 6.4 Индексы

- `(entity_type, entity_id, status)` — выборка медиа сущности
- `(entity_type, entity_id, deleted_at)` — частичный по `deleted_at IS NULL`
- `(created_at)` — для retention-задач
- `unique(asset_id, variant, format)` — защита от дублей производных при retry processor
- `unique(intent_id)` в `media_assets` — идемпотентность `confirm-upload`

## 7. Правила форматов и лимитов

### 7.1 Допустимые MIME

- `image/jpeg`
- `image/png`
- `image/webp`

MIME от клиента используется только как hint. Реальный тип определяется по magic bytes processor'ом.

### 7.2 Лимиты v1

| Категория | Макс. размер | Макс. кол-во |
|---|---|---|
| avatar | 5 MB | 1 (предыдущий заменяется автоматически) |
| work photo | 15 MB | 50 на work |
| object photo | 15 MB | 50 на object |

### 7.4 Логика замены аватара

При загрузке нового аватара `upload-intent` не проверяет лимит на количество — для avatar лимит не применяется при создании intent. На шаге `confirm-upload`, **до** записи нового `media_assets`, backend атомарно:

1. Находит текущий активный аватар entity: `SELECT id FROM media_assets WHERE entity_type = $1 AND entity_id = $2 AND category = 'avatar' AND deleted_at IS NULL`.
2. Если найден — выполняет soft delete: `UPDATE media_assets SET deleted_at = now() WHERE id = $old_id`.
3. Создаёт новую запись `media_assets` для нового аватара.

Оба UPDATE выполняются в одной транзакции. Hard delete старого объекта в S3 — по общей retention-политике (7 дней grace period).

Размеры изображений:
- минимальная сторона: 256 px;
- максимальная сторона оригинала: 8000 px.

### 7.3 Нормализация (выполняется processor'ом)

- удаление EXIF/GPS метаданных;
- автоповорот по EXIF orientation;
- генерация variants:
  - `thumb` — 256 px по длинной стороне, форматы `webp` + `jpeg`;
  - `medium` — 1024 px по длинной стороне, форматы `webp` + `jpeg`;
  - `large` — 2048 px по длинной стороне, форматы `webp` + `jpeg`; генерируется **только** если `max(width, height)` оригинала > 2048 px.

## 8. Безопасность

### 8.1 Bucket policy

- Public Access Block: ON (все 4 флага).
- Любой публичный `s3:GetObject` запрещён.
- Доступ на чтение только через CDN origin access (OAC/OAI).
- Доступ на запись только для backend role и upload-role через строго ограничённые префиксы.
- Явный `Deny` на прямой доступ к `uploads/tmp/*` и `quarantine/*` из CDN.

### 8.2 IAM

Отдельные IAM роли:

| Роль | Действие | Prefix condition |
|---|---|---|
| `media-upload-signer` | `s3:PutObject` | `uploads/tmp/*` |
| `media-processor` | `s3:GetObject`, `s3:HeadObject` | `uploads/tmp/*` |
| `media-processor` | `s3:DeleteObject` | `uploads/tmp/*` |
| `media-processor` | `s3:CopyObject` (source) | `uploads/tmp/*` |
| `media-processor` | `s3:CopyObject` (destination), `s3:PutObject` | финальные ключи (`accounts/*`, `works/*`, `objects/*`) |
| `media-processor` | `s3:PutObject` | `*/derivatives/*` |
| `media-processor` | `s3:CopyObject` (destination) | `quarantine/*` |
| `media-read-api` | `s3:HeadObject` | финальные ключи (`accounts/*`, `works/*`, `objects/*`) |
| `media-cdn` (OAC) | `s3:GetObject` | финальные ключи (`accounts/*`, `works/*`, `objects/*`) |

Явный `Deny` на доступ к чужим prefix окружений и на `uploads/tmp/*` / `quarantine/*` для OAC.

### 8.3 Шифрование

- SSE-KMS (customer managed key).
- Ротация ключа ежегодно (или по политике компании).
- При генерации pre-signed URL backend включает в подпись заголовки:
  - `x-amz-server-side-encryption: aws:kms`
  - `x-amz-server-side-encryption-aws-kms-key-id: {key_arn}`

  Эти заголовки обязательно передаются клиентом в PUT-запросе (включены в поле `headers` ответа upload-intent).

### 8.4 CORS

На bucket обязательна CORS-конфигурация для прямых browser PUT:

```json
[
  {
    "AllowedOrigins": ["https://app.example.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "x-amz-server-side-encryption",
      "x-amz-server-side-encryption-aws-kms-key-id",
      "x-amz-checksum-sha256"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Для локальной разработки `AllowedOrigins` расширяется списком конкретных origin'ов, например:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`

### 8.5 Pre-signed URL безопасность

- TTL: 5 минут (совпадает с TTL pending_intent).
- Подпись включает обязательные заголовки: `Content-Type`, `x-amz-server-side-encryption`, `x-amz-server-side-encryption-aws-kms-key-id`.
- `Content-Length` не используется как обязательный signed header для browser PUT; фактический размер проверяется на `confirm-upload` через `HeadObject.ContentLength` и должен совпадать с `pending_intents.size_bytes`.
- Для клиентов, которые поддерживают checksums, рекомендуется передавать `x-amz-checksum-sha256`; при наличии backend валидирует значение на этапе processor.
- Один intent = один staging key. Повторная загрузка создаёт новый intent и новый staging key.
- Подтверждение загрузки обязательно через `confirm-upload`.
- При confirm-upload backend проверяет:
  - intent существует и не истёк;
  - `user_id` из токена совпадает с `pending_intents.user_id`;
  - `staging_key` из запроса совпадает с `pending_intents.staging_key`.
  - HEAD объекта в S3 подтверждает его существование;
  - фактический `ContentLength` совпадает с `pending_intents.size_bytes`.

### 8.6 Контроль количества загрузок

- Rate limit на `upload-intent`: не более 10 в минуту на `user_id`.
- Лимит фото на entity проверяется при создании intent: если достигнут максимум (см. 7.2), возвращается `409 Conflict`.
- Истёкшие pending_intents очищаются задачей каждые 10 минут; соответствующие объекты в staging-prefix удаляются.

### 8.7 Защита от вредоносного контента

Все проверки выполняются processor'ом **после** загрузки в staging, **до** копирования в финальный ключ:

1. **Magic bytes** — проверка сигнатуры файла независимо от MIME, заявленного клиентом.
2. **Размеры** — декодирование заголовка изображения для проверки ширины/высоты.
3. **Антивирус** (опционально, enterprise): ClamAV/Lambda-функция как шаг pipeline processor.

При провале любой проверки: объект копируется в `quarantine/`, staging key удаляется, `media_assets.status = failed`.

### 8.8 Аутентификация API

Все endpoints `/api/v1/media/*` требуют валидного Bearer JWT в заголовке `Authorization`. Backend извлекает `user_id` из токена и использует его для:
- проверки владельца entity при создании intent;
- верификации при confirm-upload (см. 8.5);
- записи `created_by` в `media_assets`.

## 9. CDN и выдача

- Все клиентские URL на чтение идут через CDN-домен, например: `https://media.example.com/...`.
- CDN имеет доступ только к финальным ключам (не к `uploads/tmp/*`, не к `quarantine/*`).
- Стратегия кеша:
  - immutable keys (новый контент = новый key);
  - TTL оригиналов: 365 дней (immutable — ключ никогда не переиспользуется);
  - TTL derivatives: 30 дней;
  - аватары: при обновлении создаётся новый key, старый key истекает по TTL — инвалидация не требуется.
- Query-string versioning не использовать; versioning через key.
- Заголовок `Content-Disposition: inline` для изображений в браузере.

## 10. API-контракты (v1)

Все endpoints: `/api/v1/media/...`
Аутентификация: `Authorization: Bearer <JWT>` (обязателен для всех endpoints)

### 10.1 Инициация загрузки

`POST /api/v1/media/upload-intent`

**Request:**
```json
{
  "entityType": "account|work|object",
  "entityId": "string",
  "category": "avatar|photo",
  "mimeType": "image/jpeg|image/png|image/webp",
  "sizeBytes": 1048576
}
```

**Валидация на backend до создания intent:**
- `mimeType` входит в допустимый список;
- `sizeBytes` не превышает лимит категории;
- Пользователь является владельцем `entityId`;
- Лимит количества фото для entity не превышен;
- Rate limit: не более 10 запросов/минуту на `user_id`.

**Response 200:**
```json
{
  "intentId": "uuid",
  "uploadUrl": "https://s3.amazonaws.com/... (pre-signed PUT)",
  "stagingKey": "uploads/tmp/{intent_uuid}",
  "expiresAt": "2026-04-15T12:05:00Z",
  "headers": {
    "Content-Type": "image/jpeg",
    "x-amz-server-side-encryption": "aws:kms",
    "x-amz-server-side-encryption-aws-kms-key-id": "arn:aws:kms:..."
  }
}
```

Клиент обязан передать все ключи из `headers` в PUT-запросе.
Клиент также обязан отправить файл с точным размером `sizeBytes` из intent; несоответствие будет отклонено на `confirm-upload`.

**Ошибки:**
- `400` — невалидный mimeType / sizeBytes превышает лимит
- `403` — нет прав на entity
- `409` — достигнут лимит кол-ва фото на entity
- `429` — rate limit

### 10.2 Подтверждение загрузки

`POST /api/v1/media/confirm-upload`

**Request:**
```json
{
  "intentId": "uuid",
  "stagingKey": "uploads/tmp/{intent_uuid}"
}
```

**Логика backend:**
1. Проверить intent в `pending_intents`: существует, не истёк, `user_id` совпадает.
2. HEAD объекта в S3 — подтвердить существование и фактический `size_bytes`.
3. Проверить `HeadObject.ContentLength == pending_intents.size_bytes`, иначе `409`.
4. Идемпотентно создать запись в `media_assets` со `status = processing` (повторный `confirm-upload` возвращает уже созданный `assetId`).
5. Поставить задачу в очередь image processor (идемпотентный dedup key = `assetId`).
6. Удалить запись из `pending_intents`.

**Response 200:**
```json
{
  "assetId": "uuid",
  "status": "processing"
}
```

> `status` всегда `processing` — `ready` возможен только после завершения processor'а.

**Ошибки:**
- `400` — stagingKey не соответствует intentId
- `403` — intentId принадлежит другому user_id
- `404` — intent не найден или истёк
- `409` — объект отсутствует в S3 (клиент не загрузил)
- `409` — фактический размер объекта не совпадает с `sizeBytes` из intent

### 10.3 Получение одного asset (для polling)

`GET /api/v1/media/assets/{assetId}`

**Response 200:** — та же структура, что один элемент из списка (10.4). Используется клиентом для polling статуса после `confirm-upload`.

**Ошибки:**
- `403` — asset принадлежит другому пользователю
- `404` — asset не найден

### 10.4 Получение изображений сущности

`GET /api/v1/media/{entityType}/{entityId}`

**Response 200:**
```json
{
  "assets": [
    {
      "assetId": "uuid",
      "category": "photo",
      "status": "ready|processing|failed",
      "width": 3000,
      "height": 2000,
      "sizeBytes": 1048576,
      "createdAt": "2026-04-15T12:00:00Z",
      "urls": {
        "original": "https://media.example.com/...",
        "thumb": {
          "webp": "https://media.example.com/.../thumb.webp",
          "jpeg": "https://media.example.com/.../thumb.jpeg"
        },
        "medium": {
          "webp": "https://media.example.com/.../medium.webp",
          "jpeg": "https://media.example.com/.../medium.jpeg"
        },
        "large": {
          "webp": "https://media.example.com/.../large.webp",
          "jpeg": "https://media.example.com/.../large.jpeg"
        }
      }
    }
  ]
}
```

Поле `urls` присутствует только если `status = ready`. Для `processing` и `failed` — только метаданные.
Если `large` не сгенерирован (оригинал <= 2048 px), ключ `large` отсутствует.

### 10.4 Удаление медиа

`DELETE /api/v1/media/assets/{assetId}`

- Проверяет, что `user_id` является владельцем.
- Soft delete: `media_assets.deleted_at = now()`.
- Hard delete в S3 (оригинал + derivatives) откладывается на 7 дней через background job.
- При стратегии immutable keys инвалидация CDN обычно не требуется; допускается точечная инвалидация только для аварийных кейсов.

**Response 204**

## 11. Lifecycle, retention, удаление

- **Versioning:** enabled.
- **Incomplete multipart uploads:** cleanup через 1 день (S3 lifecycle rule).
- **Staging prefix (`uploads/tmp/`):** lifecycle rule — удалить объекты старше 1 часа (страховка от orphaned uploads).
- **Переход оригиналов в Infrequent Access:** через 30 дней.
- **Архив/Glacier (опционально):** через 90+ дней для редко используемых оригиналов.
- **Soft delete:** `deleted_at` в БД; hard delete в S3 через 7 дней (grace period).
- **GDPR / удаление аккаунта:** отдельный workflow полного purge (оригиналы + derivatives + записи БД). SLA: не позднее 30 дней с момента запроса (в соответствии с GDPR Article 17).
- **Удаление entity:** все медиа entity удаляются каскадно через тот же soft/hard delete workflow.
- **S3 Versioning + delete markers:** lifecycle rule `ExpiredObjectDeleteMarker: true` + `NoncurrentVersionExpiration: 30 дней` — предотвращает накопление старых версий и delete markers.

## 12. Disaster Recovery и отказоустойчивость

- Включить S3 Versioning + (опционально) Cross-Region Replication для prod.
- Регулярная проверка восстановления:
  - ежемесячный drill восстановления случайного набора объектов;
  - проверка целостности checksum (сверка `media_assets.checksum_sha256` с S3 checksum; `ETag` использовать только для single-part upload и только как вспомогательный сигнал).
- Runbook инцидентов:
  - рост 4xx/5xx S3 → escalation + CDN serve stale;
  - отказ KMS → KMS key policy review, emergency rotation;
  - деградация image processor → DLQ мониторинг, manual replay.

## 13. Observability

### Метрики

- число upload-intent / confirm-upload (по entity_type);
- доля failed uploads (confirm без последующего ready);
- orphaned intents (истёкшие pending_intents без confirm);
- время обработки derivatives (p50/p95/p99);
- размер хранилища по prefix-классам;
- CDN hit ratio;
- 4xx/5xx по API и CDN;
- размер `quarantine/` (рост = аномалия).

### Логи

- audit log всех upload-intent: `{timestamp, user_id, entity_type, entity_id, intent_id, size_bytes}`;
- audit log confirm-upload: `{intent_id, asset_id, result}`;
- ошибки S3/KMS/CDN с `correlation_id`;
- processor events: `{asset_id, variant, format, duration_ms, result}`.

### Алерты

- spike ошибок загрузки > 5% за 5 минут;
- рост `status = failed` > 1% за 10 минут;
- orphaned intents > 100 за 10 минут (возможный abuse);
- рост объёма `quarantine/` > 10 объектов за 5 минут;
- аномальный рост стоимости/объёма хранилища (> 20% в сутки).

## 14. Стоимость и контроль

- Теги на объектах: `env`, `entity_type`, `category`, `owner_service`.
- Еженедельный отчёт стоимости:
  - storage by storage class;
  - egress/CDN;
  - requests (PUT/GET/LIST/COPY).
- Budget alarms на уровне аккаунта и media-сервиса.

## 15. Plan внедрения

1. **Инфраструктура:**
   - bucket с versioning, CORS, lifecycle rules;
   - KMS key + rotations policy;
   - IAM roles (upload-signer, processor, read-api, cdn-oac);
   - bucket policy (prefix conditions, deny public);
   - CDN distribution с OAC, origin path ограничен финальными ключами.

2. **Backend API:**
   - таблицы `pending_intents`, `media_assets`, `media_derivatives`;
   - endpoints: `upload-intent`, `confirm-upload`, `list media`, `delete asset`;
   - rate limiting middleware;
   - идемпотентность `confirm-upload` + unique constraints для защиты от дублей;
   - cleanup job для истёкших intents + orphaned staging objects.

3. **Image processor:**
   - очередь задач (SQS/RabbitMQ) с DLQ;
   - magic bytes validation;
   - EXIF strip + автоповорот;
   - генерация variants;
   - copy staging → final, delete staging;
   - retry: 3 попытки с exponential backoff; при провале → `status=failed` + quarantine.

4. **Frontend:**
   - прямые PUT в S3 с обязательными заголовками из `upload-intent.headers`;
   - контроль `sizeBytes` до PUT (best effort в браузере);
   - polling статуса (интервал 2–3 сек, timeout 30 сек);
   - отображение прогресс-бара и состояний: `uploading → processing → ready / failed`.

5. **Мониторинг и алерты** (см. раздел 13).

6. **Нагрузочное тестирование и security review:**
   - 500 одновременных загрузок без деградации SLA;
   - penetration test: попытка confirm чужого intent, доступ к staging/quarantine через CDN, CORS bypass.

7. **Запуск: stage → prod.**

## 16. Критерии приёмки

- [ ] Нельзя прочитать объект напрямую из S3 публично.
- [ ] CDN не отдаёт объекты из `uploads/tmp/*` и `quarantine/*`.
- [ ] Confirm-upload с чужим `intentId` возвращает `403`.
- [ ] Повторный `confirm-upload` для одного `intentId` идемпотентен (возвращает тот же `assetId`, без дублей в БД и очереди).
- [ ] Успешная загрузка и отображение фото для всех 3 сущностей.
- [ ] Derivatives создаются автоматически и доступны через CDN.
- [ ] Файл с подменённым MIME (JPEG под видом PNG) попадает в `quarantine`, не в финальный ключ.
- [ ] `confirm-upload` отклоняет объект при несовпадении фактического `ContentLength` и `sizeBytes` intent (`409`).
- [ ] Истёкший intent не подтверждается.
- [ ] Orphaned staging object удаляется lifecycle rule в течение 1 часа.
- [ ] Удаление сущности очищает связанные медиа по правилам retention.
- [ ] Нагрузочный тест: минимум 500 одновременных загрузок без деградации SLA.
- [ ] Security checklist: IAM least privilege, encryption, CORS, audit logging.
- [ ] GDPR purge workflow протестирован end-to-end.

## 17. Рекомендуемые дефолты (быстрый старт)

- AWS S3 + CloudFront + SSE-KMS.
- Single region + versioning на старте; CRR включить после выхода на стабильный прод.
- Асинхронная обработка через SQS + Lambda (или отдельный worker).
- В БД хранить только metadata и object keys, а не бинарные данные.
- Polling для статуса обработки в v1; SSE/push в v2.
