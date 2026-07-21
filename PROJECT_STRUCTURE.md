# Структура проекта

## Текущий стек

- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS
- **Backend:** Express 5 + `better-sqlite3`
- **Дополнительно:** `react-router-dom` для роутинга, `xlsx` для Excel-экспорта, `concurrently` для параллельного запуска
- **Хранение:** SQLite для Омска, JSON-файлы для остальных городов
- **Dev-запуск:** `npm run start:win` — одновременно сервер и Vite

---

## Общая схема

```
lunch/
├── server.js                 # Точка входа Express-сервера
├── package.json
├── vite.config.ts
├── tsconfig.json
├── ecosystem.config.cjs      # PM2 конфиг для продакшена
├── index.html
├── dist/                     # Сборка фронтенда
├── data/                     # Данные для SPB/Samara/Moscow/Kazan (JSON)
└── src/
    ├── main.tsx              # Монтирование React-приложения
    ├── App.tsx                # Главный роутер + общие страницы
    ├── api.ts                 # API-клиент для общих (не-Omsk) эндпоинтов
    ├── types.ts               # Общие TypeScript-типы
    ├── constants.ts           # Общие константы (города, отделы, меню)
    ├── database.ts            # Инициализация SQLite + все Omsk DB-операции
    ├── index.css
    ├── vite-env.d.ts
    ├── theme/                 # Тема (светлая/тёмная)
    │   ├── ThemeContext.tsx
    │   └── palettes.ts
    ├── utils/
    │   └── localStorage.ts    # Обёртки над localStorage + валидация
    ├── hooks/                 # Кастомные хуки
    └── components/
        ├── ui/                # Переиспользуемые UI-кирпичи
        │   ├── Button.tsx
        │   ├── Input.tsx
        │   ├── Select.tsx
        │   ├── Skeleton.tsx
        │   └── ConfirmModal.tsx
        ├── Header.tsx
        ├── Footer.tsx
        ├── ThemeSelector.tsx
        ├── CitySelector.tsx
        ├── OrderForm.tsx      # Универсальная форма заказа (старая)
        ├── IndividualOrdersList.tsx
        ├── AggregatedOrderSummary.tsx
        ├── CategoryAsList.tsx
        ├── AdminPage.tsx
        ├── AdminAccess.tsx
        ├── AdminMenuManager.tsx
        ├── AdminOrderControl.tsx
        ├── AdminMenuConfig.tsx
        ├── OmskApp.tsx        # Omsk-специфичное приложение
        ├── OmskOrderForm.tsx  # Omsk-форма заказа
        ├── OmskAdmin.tsx      # Omsk админка
        ├── OmskAdminLogin.tsx
        ├── SpbApp.tsx         # SPB-приложение
        ├── SpbOrderForm.tsx
        ├── SpbAdmin.tsx
        ├── SpbAdminLogin.tsx
        └── ...
```

---

## Города и маршрутизация

Приложение мультигородное. Каждый город может жить своей жизнью:

| Город    | Форма заказа | Админка        | Хранилище      |
|----------|--------------|----------------|----------------|
| `omsk`   | `OmskApp`    | `OmskAdmin`    | SQLite (`data/omsk.db`) |
| `spb`    | `SpbApp`     | `SpbAdmin`     | JSON файлы     |
| `samara` | общая `OrderForm` | общая `AdminPage` | JSON файлы |
| `moscow` | общая `OrderForm` | общая `AdminPage` | JSON файлы |
| `kazan`  | общая `OrderForm` | общая `AdminPage` | JSON файлы |

Роутинг (`App.tsx`):
- `/omsk/*` → `OmskApp`
- `/spb/*` → `SpbApp`
- `/:city` → общая `OrderPage` с `OrderForm`
- `/admin` → `AdminPage`
- `/omsk/admin` → `OmskAdmin`
- `/spb/admin` → `SpbAdmin`

---

## Omsk — самая развитая ветка

### Файлы

- **`src/components/OmskOrderForm.tsx`** — основная форма заказа.
  - Выбор этажа/отдела/кофейни.
  - Меню: супы, бульоны, горячее, салаты, дополнительные блюда.
  - Гарниры и соусы бесплатно к горячему.
  - Выпечка бесплатно к супу/бульону.
  - Быстрый повтор последнего заказа.
  - **Случайный заказ на период** — коллапсируемая панель.
  - **Мульти-дата** — выбор конкретных дат через чипы.

- **`src/components/OmskApp.tsx`** — обёртка над формой.
  - Управление списком заказов за выбранную дату.
  - Фильтр по отделам.
  - Обработка уведомлений.
  - Вызов `OmskOrderForm` с каллбэками.

- **`src/database.ts`** — вся работа с SQLite:
  - Таблицы: `orders`, `week_menu_items`, `vegan_items`, `other_items`, `garnishes`, `sauces`, `pastries`, `weeks`, `settings`, `order_logs`.
  - Миграции добавляют новые колонки (`isVegan`, `noGarnish`, `grams`, `calories` и т.д.).
  - Функции для CRUD заказов, меню, недель, garnish/sauce.

- **`server.js`** — Express-сервер.
  - Публичные и админские эндпоинты для Omsk.
  - Excel-экспорт (`/api/omsk/export/excel`).
  - Логирование заказов.

### Логика заказа Omsk

```
Максимальная сумма заказа: 400₽
Цены по категориям:
  суп/бульон — 250₽ / 150₽
  горячее — 250₽
  салат — 150₽
  дополнительное — 150₽
  прочее — 100₽
  гарнир + соус — бесплатно к горячему
  выпечка — бесплатно к супу/бульону
```

---

## Общий `OrderForm` (не-Omsk города)

- Использует старую систему с `selectedSideId`.
- Работает через `/api/orders` + `/api/menu/*`.
- Агрегирует заказы по дате.

---

## Админка

- **`AdminPage`** — общая админка для меню и блюд.
- **`OmskAdmin` / `SpbAdmin`** — городские админки с управлением неделями/периодами, блюдами, garnish/sauce, выпечкой, disabled dates.
- Аутентификация через env-переменные (`OMSK_ADMIN_CODE`, `GENERIC_ADMIN_CODE`).

---

## Запуск

```bash
# Dev
npm run start:win    # Windows
npm run start        # *nix

# Production
npm run prod:build
npm run prod:start   # через PM2
```

---

## Основные约定

- **Нет ESLint-конфига** — проверка только через `tsc --noEmit`.
- **CSS:** встроенный Tailwind + инлайн-стили через `palette.colors.*`.
- **Данные:** Omsk живёт в SQLite, остальные города — в JSON файлах в `data/`.
- **localStorage:** используется для кэша последнего заказа, города, адреса, имени/отдела.
