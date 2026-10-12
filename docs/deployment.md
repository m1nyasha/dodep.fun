# Развёртывание (Dokploy)

## 1. База данных (Timeweb Cloud)

1. Создать кластер MySQL 8.4, базу `dodep` и пользователя с полными правами на неё.
2. Проверить кодировку — на ней держится регистронезависимая уникальность ников:
   ```sql
   SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
   FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'dodep';
   ```
   Если не `utf8mb4` / `utf8mb4_0900_ai_ci` — до первого запуска API:
   ```sql
   ALTER DATABASE dodep CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```
3. Строка подключения:
   - приватная сеть Timeweb (сервер Dokploy в том же аккаунте и регионе) — предпочтительно: `mysql://USER:PASSWORD@PRIVATE_HOST:3306/dodep`;
   - публичный адрес — только с TLS. mysql2 читает JSON из параметра `ssl`, значение нужно URL-кодировать:
     `mysql://USER:PASSWORD@PUBLIC_HOST:3306/dodep?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D`
     Если подключение падает с ошибкой сертификата, значит, у Timeweb свой CA: переходите на приватную сеть — передать файл CA через URL нельзя.
     Спецсимволы в пароле тоже URL-кодировать.
4. Включить автоматические бэкапы кластера в панели Timeweb.

## 2. Образы

```bash
docker login areaweb.registry.twcstorage.ru
TAG=v1.0.0 pnpm docker:push        # все три образа
TAG=v1.0.1 pnpm docker:push app    # только один
```

Каждый образ получает тег `TAG` и `latest`. `ADMIN_SENTRY_DSN`, `ADMIN_SITE_URL` (ссылка «На dodep.fun» на экране входа админки) и `SENTRY_ENVIRONMENT` из корневого `.env` запекаются в статическую сборку admin (DSN всё равно виден браузеру).

В Dokploy: **Settings → Registry → Add** — адрес `areaweb.registry.twcstorage.ru`, логин и пароль реестра Timeweb.

## 3. Приложения

Создать в проекте три приложения, у каждого **Provider: Docker**, реестр — из шага 2, образ — с явным тегом (так откат — смена тега).

| Приложение    | Образ                                               |
| ------------- | --------------------------------------------------- |
| `dodep-api`   | `areaweb.registry.twcstorage.ru/dodep-api:v1.0.0`   |
| `dodep-app`   | `areaweb.registry.twcstorage.ru/dodep-app:v1.0.0`   |
| `dodep-admin` | `areaweb.registry.twcstorage.ru/dodep-admin:v1.0.0` |

API — ровно одна реплика (Advanced → Cluster → Replicas = 1): лента WebSocket рассылается из памяти процесса.

### Переменные окружения

`dodep-api`:

```
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/dodep
PORT=4200
COOKIE_SECURE=true
TRUST_PROXY=1
ADMIN_URL=https://admin.dodep.fun
THROTTLE_LIMIT=20
SENTRY_DSN=<DSN проекта dodep-api в Bugsink>
SENTRY_ENVIRONMENT=production
```

`TRUST_PROXY` — число прокси перед API. Только Traefik → `1`. Если перед Traefik включён проксирующий Cloudflare → `2`, иначе в лимит регистраций попадёт IP Cloudflare.

`dodep-app`:

```
NUXT_API_INTERNAL_URL=http://<App Name приложения dodep-api>:4200
NUXT_PUBLIC_SENTRY_DSN=<DSN проекта dodep-web в Bugsink>
NUXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

`App Name` — внутреннее имя сервиса API во вкладке General (обычно с суффиксом, например `dodep-api-x1y2z3`). Это имя резолвится внутри `dokploy-network`.

`dodep-admin` — переменных нет: это статика, настройки Sentry запечены при сборке.

### Домены

| Приложение    | Host              | Path   | Strip Path | Container Port | HTTPS         |
| ------------- | ----------------- | ------ | ---------- | -------------- | ------------- |
| `dodep-app`   | `dodep.fun`       | `/`    | —          | 4100           | Let's Encrypt |
| `dodep-api`   | `dodep.fun`       | `/api` | **выкл**   | 4200           | Let's Encrypt |
| `dodep-admin` | `admin.dodep.fun` | `/`    | —          | 80             | Let's Encrypt |
| `dodep-api`   | `admin.dodep.fun` | `/api` | **выкл**   | 4200           | Let's Encrypt |

Strip Path выключен, потому что API сам слушает с префиксом `/api`. Более длинный путь `/api` у Traefik приоритетнее `/`. WebSocket (`wss://dodep.fun/api/ws`) Traefik проксирует без дополнительной настройки. DNS: A-записи `dodep.fun` и `admin.dodep.fun` на сервер Dokploy.

## 4. Первый запуск

1. Задеплоить `dodep-api`: при старте контейнер применяет миграции (`node dist/db/migrate.js`), затем запускает сервер. В логах — успешные миграции, healthcheck `GET /api/health` зелёный.
2. Задеплоить `dodep-app` и `dodep-admin`.
3. Зарегистрироваться на https://dodep.fun.
4. Назначить себя админом: в Dokploy у `dodep-api` открыть **Docker Terminal** (или на сервере `docker exec -it $(docker ps -q -f name=<App Name>) sh`) и выполнить
   ```bash
   node dist/cli/admin-grant.js <ник>
   ```
5. Обновить страницу — появится кнопка перехода в админку.

## 5. Обновление и откат

- Обновление: `TAG=v1.1.0 pnpm docker:push [сервис]` → в Dokploy сменить тег образа → **Deploy**. Миграции применятся при старте нового контейнера API.
- Откат: вернуть предыдущий тег → **Deploy**. Миграции не откатываются автоматически, поэтому изменения схемы делаем совместимыми с предыдущей версией кода (сначала добавить колонку, удалять — в следующем релизе).

## 6. Локальная проверка образов

`docker/docker-compose.prod-like.yml` поднимает собранные образы и чистую MySQL без Traefik:

```bash
REGISTRY= TAG=local pnpm docker:build
docker compose -f docker/docker-compose.prod-like.yml up -d --wait
```

- API — http://localhost:4200/api, app — http://localhost:4100, admin — http://localhost:4300.
- Без Traefik браузер на :4100 не достучится до `/api`, поэтому полноценная игра здесь не проверяется. Проверяются SSR, API, статика admin и WebSocket — см. smoke-команды в плане развёртывания.
- Порты пересекаются с локальной разработкой: перед запуском остановить `pnpm dev`.

```bash
docker compose -f docker/docker-compose.prod-like.yml down
```
