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

## Найденные баги прототипа

Список дополняется при переносе `prototype/v3`.
