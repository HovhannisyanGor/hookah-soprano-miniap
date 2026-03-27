# Hookah Soprano Mini App MVP

Кликабельный MVP-прототип в духе Telegram Mini App для кальянного бизнеса.
Проект сделан на `Next.js + TypeScript + Tailwind CSS` и полностью работает локально без внешних платных сервисов.

## Что внутри

- welcome screen с CTA на бронь
- выбор филиала из 3 моковых локаций
- пошаговый сценарий бронирования
- предзаказ кальяна и доп. позиций
- экран подтверждения брони
- страница `Мои брони`
- админка на `/admin`
- локальная SQLite-база с демо-данными

## Основные маршруты

- `/` — главная и презентационный экран
- `/booking` — сценарий бронирования
- `/booking/confirmation/[id]` — подтверждение заявки
- `/my-bookings` — список броней demo-пользователя
- `/admin` — админ-панель

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Запустить dev-режим:

```bash
npm run dev
```

3. Открыть:

```bash
http://localhost:3000
```

Для production-проверки:

```bash
npm run build
npm start
```

## Как правильно добавить Mini App в Telegram

1. Подними приложение локально:

```bash
npm run dev
```

2. Получи публичный `https` URL на это приложение через туннель или деплой.

Важно:

- `http://localhost:3000` внутри Telegram Mini App не работает
- нужен именно публичный `https`

3. Запиши этот адрес в [.env](/Users/goro/Projects/HookahSoprano/.env):

```bash
MINIAPP_URL=https://your-public-domain.example
```

4. Перезапусти бота:

```bash
npm run bot:dev
```

5. После этого бот сам сможет открыть Mini App через `web_app` кнопку.

Сейчас в проекте это уже учтено:

- если `MINIAPP_URL` публичный и `https`, бот включает настоящее открытие Mini App
- если там `localhost`, бот не пытается притворяться настоящим Mini App и честно пишет, что нужен публичный адрес

Дополнительно в BotFather обычно нужно проверить:

1. `@BotFather` → ` /mybots `
2. выбрать нужного бота
3. `Bot Settings`
4. `Menu Button`
5. указать тот же публичный `https` URL

Telegram docs:

- https://core.telegram.org/bots/webapps
- https://core.telegram.org/bots/api#setchatmenubutton

## Структура проекта

- [app](/Users/goro/Projects/HookahSoprano/app) — страницы App Router и локальные API routes
- [components](/Users/goro/Projects/HookahSoprano/components) — интерфейс и клиентские экраны
- [lib](/Users/goro/Projects/HookahSoprano/lib) — типы, моковые данные, форматтеры, storage
- [data/miniapp.sqlite](/Users/goro/Projects/HookahSoprano/data/miniapp.sqlite) — локальная SQLite-база для MVP
- [data/miniapp-db.json](/Users/goro/Projects/HookahSoprano/data/miniapp-db.json) — legacy JSON-слепок для первого импорта демо-данных

## Архитектура

Проект построен как локальный full-stack demo:

- интерфейс рендерится через `Next.js App Router`
- состояние брони на клиенте живёт в wizard-компоненте
- данные сохраняются в локальный SQLite через route handlers
- `/admin` работает на тех же данных, что и пользовательская часть
- таблицы, филиалы и меню — моковые, но реалистичные

## Что замокано

- логика доступности столов
- подтверждение брони заведением
- пользовательская идентификация
- hookah pre-order без реальной кухни/склада
- админское управление без реальной CRM
- телефон и имя без реальной проверки через Telegram

## Что заменить для production

- локальный SQLite на PostgreSQL с нормальными миграциями и бэкапами
- demo user на Telegram auth или `initData` от Mini App
- route handlers на реальный backend или server actions с нормальной валидацией
- mock availability на live-таблицы и расписание
- ручные статусы на интеграцию с CRM / POS / админ-панелью
- локальные уведомления на Telegram bot API и push-сценарии

## Где менять демо-контент

- филиалы, столы, меню: [lib/mock-data.ts](/Users/goro/Projects/HookahSoprano/lib/mock-data.ts)
- доменные типы: [lib/types.ts](/Users/goro/Projects/HookahSoprano/lib/types.ts)
- локальное хранение, импорт из legacy JSON и seed: [lib/store.ts](/Users/goro/Projects/HookahSoprano/lib/store.ts)
- сценарий брони: [components/booking-flow.tsx](/Users/goro/Projects/HookahSoprano/components/booking-flow.tsx)
- админка: [components/admin-dashboard.tsx](/Users/goro/Projects/HookahSoprano/components/admin-dashboard.tsx)

## Демо-данные

После запуска сразу видны:

- 3 филиала
- 10 столов
- 6 дополнительных позиций меню
- 3 демо-брони в админке
- 1 демо-бронь на странице `Мои брони`

## Дальше можно докрутить

- Telegram Mini App SDK
- реальный Telegram бот и deeplink в Mini App
- депозит и предоплату
- push-уведомления менеджеру и клиенту
- аналитику по слотам и филиалам
- drag-and-drop по столам в админке
