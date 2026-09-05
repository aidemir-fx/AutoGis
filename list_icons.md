### 1. Кастомные SVG-иконки (27 штук)
**Файлы:** `front/src/common/icons/*.svg`

| Иконка | Файл | Назначение |
|--------|------|------------|
| `LocationMarkIcon` | LocationMark.svg | Маркер локации на карте |
| `BurgerMenu` | BurgerMenu.svg | Меню-гамбургер |
| `SearchIcon` | SearchIcon.svg | Поиск |
| `ChatIcon` | Chat.svg | Чат/сообщения |
| `StarIcon` | Star.svg | Рейтинг/избранное |
| `MapPinIcon` | MapPin.svg | Точка на карте |
| `WrenchIcon` | Wrench.svg | Автосервис/ремонт |
| `EyeIcon` | Eye.svg | Показать/скрыть |
| `PhoneIcon` | Phone.svg | Телефон |
| `ArrowLeftIcon` | ArrowLeft.svg | Назад |
| `UserAddIcon` | UserAdd.svg | Добавить пользователя |
| `LoginIcon` | Login.svg | Вход |
| `UserIcon` | User.svg | Пользователь |
| `LockIcon` | Lock.svg | Блокировка/безопасность |
| `ClockIcon` | Clock.svg | Время |
| `LocationIcon` | Location.svg | Локация |
| `CameraIcon` | Camera.svg | Камера/фото |
| `FilterIcon` | Filter.svg | Фильтр |
| `RullerIcon` | Ruller.svg | Измерение |
| `CalendarIcon` | Calendar.svg | Календарь |
| `GearFillIcon` | Gear.svg | Настройки (заполненная) |
| `LogoutIcon` | Logout.svg | Выход |
| `ShopIcon` | Shop.svg | Магазин |
| `CarWashIcon` | CarWash.svg | Автомойка |
| `MasterIcon` | Master.svg | Мастер |
| `RepairIcon` | Repair.svg | Ремонт |
| `GarageIcon` | Garage.svg | Гараж/сервис |
| `OrganizationIcon` | Organization.svg | Организация |
| `PaperIcon` | Paper.svg | Документ |
| `GearIcon` | GearOutlined.svg | Настройки (контурная) |
| `CrossIcon` | Cross.svg | Закрыть |
| `DropsIcon` | Drops.svg | Капли/мойка |
| `PlusIcon` | Plus.svg | Добавить |
| `ShoppingBag` | ShoppingBag.svg | Покупки |

---

### 2. Кастомные PNG-иконки (11 штук)
**Файлы:** `front/src/common/icons/*.png`

| Иконка | Файл | Назначение |
|--------|------|------------|
| `AvailableMasterIcon` | AvailableMaster.png | Доступный мастер |
| `BusyMasterIcon` | BusyMaster.png | Занятый мастер |
| `UnavailableMasterIcon` | UnavailableMaster.png | Недоступный мастер |
| `LogoIcon` | Logo.png | Логотип |
| `AutoWashCategoryIcon` | AutoWashCategory.png | Категория: Автомойка |
| `AutoServiceCategoryIcon` | AutoServiceCategory.png | Категория: Автосервис |
| `PrivateMasterCategoryIcon` | PrivateMasterCategory.png | Категория: Частный мастер |
| `ServiceCenterCategoryIcon` | ServiceCenterCategory.png | Категория: Сервисный центр |
| `AutoShopCategoryIcon` | AutoShop.png | Категория: Магазин автозапчастей |

---

### 3. Иконки @mui/icons-material (70+ штук)

#### Навигация
- `ArrowBack`, `ArrowBackRounded` — Назад
- `ChevronRightRounded`, `KeyboardArrowRightRounded`, `KeyboardArrowDownRounded` — Стрелки
- `NavigateNext` — Следующий
- `Menu` — Меню

#### Коммуникация
- `SendRounded` — Отправить сообщение
- `ChatBubbleRounded` — Чат
- `PhoneRounded`, `PhoneOutlined`, `LocalPhoneRounded` — Телефон
- `NotificationsRounded` — Уведомления

#### Статусы и действия
- `Done`, `DoneAll` — Галочки (прочитано/выполнено)
- `CheckRounded`, `CheckCircleRounded`, `CheckCircle` — Выполнено
- `CloseRounded` — Закрыть
- `TaskAltRounded` — Задача выполнена
- `BlockRounded` — Заблокировано
- `Cancel` — Отмена
- `TouchAppRounded` — Нажать

#### Время и планирование
- `ScheduleRounded`, `AccessTimeRounded` — Время
- `HourglassTopRounded` — Ожидание
- `EventAvailableRounded`, `CalendarMonthRounded` — Календарь

#### Профиль и пользователи
- `PersonRounded`, `PersonOutline`, `Person` — Пользователь
- `PersonAdd` — Добавить пользователя
- `VerifiedRounded` — Верифицирован

#### Автомобильная тематика
- `DirectionsCarRounded` — Автомобиль
- `BuildRounded` — Ремонт/сервис
- `LocalFireDepartmentRounded` — Срочность
- `Wrench` — Ключ/ремонт

#### Медиа
- `CameraAltRounded`, `CameraAlt` — Камера

#### UI элементы
- `Search`, `SearchRounded` — Поиск
- `FilterList`, `TuneRounded` — Фильтр
- `InboxRounded` — Входящие

#### Админка
- `Assignment` — Заявки
- `History` — История
- `Home` — Главная
- `Refresh` — Обновить
- `EditNote` — Редактировать
- `AssignmentTurnedInRounded` — Выполненные заявки
- `CategoryRounded` — Категории
- `RouteRounded` — Маршруты

#### Платежи и документы
- `PaymentsRounded` — Оплата
- `DescriptionRounded` — Документ
- `PlaceRounded` — Место
- `BoltRounded` — Молния/быстро

---

### 4. Emoji-иконки (4 штуки)
**Файл:** `ApplicationsRedesign.tsx`

| Emoji | Назначение |
|-------|------------|
| 🏠 | Главная |
| 📋 | Заявки |
| 💬 | Чаты |
| 👤 | Профиль |

---

## Рекомендации по обновлению

1. **SVG-иконки** — заменять файлы в `front/src/common/icons/*.svg`
2. **PNG-иконки** — заменять файлы в `front/src/common/icons/*.png`
3. **MUI-иконки** — можно заменить на кастомные, создав SVG-файлы и добавив их в `index.ts`
4. **Emoji** — заменить на SVG или MUI-иконки для консистентности

Хотите, чтобы я подготовил структуру для новых иконок или помог с заменой конкретного типа?