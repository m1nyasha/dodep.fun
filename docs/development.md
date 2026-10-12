# Локальная разработка

## Требования

- Node 24 (`.nvmrc`), pnpm 12 (`corepack enable pnpm`)
- Docker

## Первый запуск

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm build:shared
```

## Порты

| Сервис       | Порт |
| ------------ | ---- |
| app (Nuxt)   | 4100 |
| api (NestJS) | 4200 |
| admin (Nuxt) | 4300 |
| MySQL        | 3307 |

Базы: `dodep` — разработка, `dodep_test` — e2e-тесты API.

## Команды

| Команда                             | Что делает                 |
| ----------------------------------- | -------------------------- |
| `pnpm db:up` / `pnpm db:down`       | поднять / остановить MySQL |
| `pnpm build:shared`                 | собрать `@dodep/shared`    |
| `pnpm lint`                         | ESLint во всех пакетах     |
| `pnpm format` / `pnpm format:check` | Prettier                   |
| `pnpm typecheck`                    | TypeScript во всех пакетах |
| `pnpm test`                         | unit-тесты во всех пакетах |

## API

```bash
cp api/.env.example api/.env
pnpm db:up
pnpm --filter @dodep/api db:migrate
pnpm dev
```

- API: http://localhost:4200/api
- Swagger: http://localhost:4200/api/docs
- WebSocket: ws://localhost:4200/api/ws

Проверено: прокси Nitro devProxy (`ws: true`) не проксирует `/api/ws` в дев-режиме — хендшейк падает с `404`. Обходной путь: `app/.env` с `NUXT_PUBLIC_WS_URL=ws://localhost:4200/api/ws` (подхватывается `useFeed` напрямую, без прокси), перезапустить `pnpm dev`.

Миграции: изменить `api/src/db/schema.ts` → `pnpm --filter @dodep/api db:generate --name <имя>` → `db:migrate`.

e2e-тесты пересоздают базу `dodep_test` при каждом запуске: `pnpm test:e2e` (MySQL должна быть поднята).

## Фронтенд

- `ui/` — Nuxt layer: токены (`ui/app/assets/css/tokens.css`), базовые стили, компоненты `Ui*`, `useApi`, `useToast`, форматирование. Подключается через `extends: ['../ui']`.
- `app/` — публичный сайт на Nuxt 4 (srcDir `app/app/`), порт 4100.

```bash
pnpm dev          # shared (watch) + api:4200 + app:4100
```

В dev Nuxt проксирует `/api` и WebSocket `/api/ws` на `localhost:4200`. Если WebSocket не проходит через прокси, задать `NUXT_PUBLIC_WS_URL=ws://localhost:4200/api/ws` в `app/.env`.

| Переменная              | Назначение                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| `NUXT_API_INTERNAL_URL` | адрес API для SSR-запросов (по умолчанию `http://localhost:4200`) |
| `NUXT_PUBLIC_WS_URL`    | явный адрес WebSocket (по умолчанию — тот же хост, `/api/ws`)     |

Правила кода фронтенда: компоненты — по папкам (`layout`, `auth`, `game`, `feed`, …), не больше ~300 строк; стили — `<style scoped>` на токенах; тесты — в `__tests__` рядом с кодом; состояние — `useState`, без Pinia. Stylelint проверяет `.css` и `<style>` в `.vue` (`pnpm lint`).

## Найденные баги прототипа

Список дополняется при переносе `prototype/v3`.

- Исход клика не объявлялся экранному диктору — добавлен `aria-live` в игровой консоли.
- Ползунки навигации и сегментов считались до загрузки шрифтов и только по глобальному `resize` — теперь `useResizeObserver` + `document.fonts.ready`.
- Раунд терялся при перезагрузке — восстанавливается через `GET /api/rounds/active`.
- Хэш раскладки считался асинхронно в браузере и мог отсутствовать — теперь приходит с сервера при старте раунда.
- Время в журнале и ленте форматировалось в часовом поясе браузера — теперь по Москве, без расхождений SSR и клиента.
