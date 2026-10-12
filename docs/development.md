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

## Найденные баги прототипа

Список дополняется при переносе `prototype/v3`.
