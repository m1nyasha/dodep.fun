# Развёртывание в Dokploy

Пошаговое руководство: от чистого сервера до работающих `dodep.fun` и `admin.dodep.fun`. Названия пунктов интерфейса Dokploy даны по документации https://docs.dokploy.com (на октябрь 2026); если в вашей версии подпись отличается — ищите по смыслу.

## Схема

```
Браузер ──HTTPS──► Traefik (внутри Dokploy, порты 80/443)
                     ├─ dodep.fun/            → dodep-app   :4100  (Nuxt SSR)
                     ├─ dodep.fun/api         → dodep-api   :4200  (NestJS, + WebSocket /api/ws)
                     ├─ admin.dodep.fun/      → dodep-admin :80    (статика nginx)
                     └─ admin.dodep.fun/api   → dodep-api   :4200
dodep-app (SSR) ──http://<имя сервиса api>:4200──► dodep-api   (внутренняя сеть Docker)
dodep-api ──MySQL──► Timeweb Cloud (внешняя БД)
```

- Три приложения Dokploy из готовых образов в реестре Timeweb. Dokploy ничего не собирает.
- Публичный сайт и админка ходят в API по тому же домену (`/api`), поэтому нет CORS, а cookie — first-party.
- API — **одна реплика**: лента WebSocket рассылается из памяти процесса.

## 1. Сервер и Dokploy

**Требования** (https://docs.dokploy.com/docs/core/installation): VPS с Linux x86_64 (linux/amd64 — под эту архитектуру собираются образы), от 2 ГБ RAM и 30 ГБ диска, свободные порты 80, 443 и 3000.

1. Установить:
   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```
2. Открыть `http://<IP сервера>:3000`, создать администратора.
3. Спрятать панель за домен (рекомендуется):
   1. DNS: A-запись `dokploy.dodep.fun` → IP сервера (см. шаг 2).
   2. В панели: **Settings → Server / Web Server** → домен `dokploy.dodep.fun`, HTTPS, Let's Encrypt. Убедиться, что панель открывается по https.
   3. Закрыть прямой порт 3000:
      ```bash
      docker service update --publish-rm "published=3000,target=3000,mode=host" dokploy
      ```

## 2. DNS

**До** добавления доменов в Dokploy — иначе Let's Encrypt не выпустит сертификат, и домен придётся пересоздавать (https://docs.dokploy.com/docs/core/troubleshooting/domains).

| Запись              | Тип | Значение                            |
| ------------------- | --- | ----------------------------------- |
| `dodep.fun`         | A   | IP сервера                          |
| `admin.dodep.fun`   | A   | IP сервера                          |
| `dokploy.dodep.fun` | A   | IP сервера (если панель за доменом) |

Проверить: `nslookup dodep.fun` возвращает IP сервера. Про Cloudflare — раздел 11.

## 3. База данных (Timeweb Cloud)

1. Создать кластер MySQL 8.4, базу `dodep` и пользователя с полными правами на неё. Сервер Dokploy и БД — лучше в одном аккаунте и регионе Timeweb, чтобы подключаться по приватной сети.
2. Проверить кодировку — на ней держится регистронезависимая уникальность ников:
   ```sql
   SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
   FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'dodep';
   ```
   Если не `utf8mb4` / `utf8mb4_0900_ai_ci` — до первого запуска API:
   ```sql
   ALTER DATABASE dodep CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```
3. Строка подключения (`DATABASE_URL`):
   - приватная сеть — предпочтительно: `mysql://USER:PASSWORD@PRIVATE_HOST:3306/dodep`;
   - публичный адрес — только с TLS, JSON в параметре `ssl` URL-кодируется:
     `mysql://USER:PASSWORD@PUBLIC_HOST:3306/dodep?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D`.
     Если подключение падает с ошибкой сертификата (свой CA у Timeweb) — переходите на приватную сеть: файл CA через URL не передать.
   - спецсимволы в пароле URL-кодировать (`@` → `%40` и т. д.).
4. Включить автоматические бэкапы кластера в панели Timeweb.

Миграции применяет сам API при старте контейнера — вручную ничего запускать не нужно.

## 4. Реестр и образы

### Сборка и публикация (на своей машине)

В корневом `.env` (из `.env.example`): `REGISTRY`, `IMAGE_API/APP/ADMIN`, `PLATFORM=linux/amd64`, а также значения, которые **запекаются в статическую админку**: `ADMIN_SITE_URL=https://dodep.fun`, `ADMIN_SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`.

```bash
docker login areaweb.registry.twcstorage.ru
TAG=v1.0.0 pnpm docker:push        # все три образа
TAG=v1.0.1 pnpm docker:push app    # только один
```

Каждый образ получает тег `TAG` и `latest`. Деплоим **всегда по явному тегу** — тогда откат = смена тега.

### Реестр в Dokploy

**Settings → Registry → Add Registry** (https://docs.dokploy.com/docs/core/registry):

| Поле                | Значение                         |
| ------------------- | -------------------------------- |
| Registry Name       | `timeweb`                        |
| Registry URL        | `areaweb.registry.twcstorage.ru` |
| Username / Password | доступ к реестру Timeweb         |

## 5. Проект и приложения

1. **Projects → Create Project** → `dodep`. Внутри — окружение по умолчанию (`production`).
2. Создать три сервиса **Create Service → Application**: `dodep-api`, `dodep-app`, `dodep-admin`. В диалоге в поле **App Name** вписать то же короткое имя (`dodep-api` и т. д.) — Dokploy всё равно добавит к нему случайный суффикс из 6 символов, но имя останется читаемым.
3. У каждого во вкладке **General** выбрать источник **Docker** (https://docs.dokploy.com/docs/core/Docker) и указать образ из таблицы ниже. Доступ к реестру — выбрать реестр из раздела 4 (**Advanced → Cluster Settings → Registry**) либо заполнить Registry URL / Username / Password прямо в полях Docker-источника.
4. **Не публиковать порты** (Advanced → Ports): Traefik ходит в контейнеры по внутренней сети, публикация мешает маршрутизации по доменам.
5. Запомнить **App Name** у `dodep-api` — внутреннее имя сервиса во вкладке General, вида `dodep-api-k3x9qa`. По нему `dodep-app` обращается к API внутри сети (https://docs.dokploy.com/docs/core/troubleshooting/networking). Имя постоянное: деплои и обновления его не меняют. Сменится оно только если удалить приложение и создать заново — тогда обновить `NUXT_API_INTERNAL_URL` у `dodep-app` (раздел 6).

| Приложение    | Docker Image                                        |
| ------------- | --------------------------------------------------- |
| `dodep-api`   | `areaweb.registry.twcstorage.ru/dodep-api:v1.0.0`   |
| `dodep-app`   | `areaweb.registry.twcstorage.ru/dodep-app:v1.0.0`   |
| `dodep-admin` | `areaweb.registry.twcstorage.ru/dodep-admin:v1.0.0` |

## 6. Переменные окружения

Вкладка **Environment** у каждого приложения, формат `KEY=value` (https://docs.dokploy.com/docs/core/variables). Общие для проекта значения можно вынести на уровень проекта и ссылаться как `${{project.NAME}}`.

### `dodep-api`

```
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/dodep
COOKIE_SECURE=true
TRUST_PROXY=1
ADMIN_URL=https://admin.dodep.fun
THROTTLE_LIMIT=20
SENTRY_DSN=<DSN проекта dodep-api в Bugsink>
SENTRY_ENVIRONMENT=production
```

| Переменная       | Зачем                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`   | подключение к MySQL (раздел 3)                                                                                                 |
| `COOKIE_SECURE`  | cookie `sid` / `admin_sid` только по HTTPS. В проде **обязательно `true`**                                                     |
| `TRUST_PROXY`    | сколько прокси перед API. Только Traefik → `1`. От этого зависит, какой IP попадёт в лимит регистраций и отпечатки (раздел 11) |
| `ADMIN_URL`      | куда ведёт кнопка «Админка»; пустое значение — кнопки нет                                                                      |
| `THROTTLE_LIMIT` | запросов в минуту на вход/регистрацию с одного IP                                                                              |
| `SENTRY_*`       | отчёты об ошибках 5xx; без `SENTRY_DSN` Sentry выключен                                                                        |

`PORT` (4200) и `SENTRY_RELEASE` (тег образа) уже заданы в образе.

### `dodep-app`

```
NUXT_API_INTERNAL_URL=http://<App Name приложения dodep-api>:4200
NUXT_PUBLIC_SENTRY_DSN=<DSN проекта dodep-web в Bugsink>
NUXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

`NUXT_API_INTERNAL_URL` — адрес API для серверного рендеринга внутри сети Docker. Без него SSR-страницы (рейтинг, правила, профиль) не получат данные. Браузер ходит в API по `/api` того же домена, а WebSocket — на `wss://dodep.fun/api/ws`; `NUXT_PUBLIC_WS_URL` в проде не задавать.

### `dodep-admin`

Переменных нет: это статика, Sentry DSN и ссылка на сайт запечены при сборке (раздел 4). Поменять их — пересобрать образ админки.

## 7. Домены

Вкладка **Domains → Add Domain** у приложения (https://docs.dokploy.com/docs/core/domains):

| Приложение    | Host              | Path   | Internal Path | Strip Path | Container Port | HTTPS / Certificate |
| ------------- | ----------------- | ------ | ------------- | ---------- | -------------- | ------------------- |
| `dodep-app`   | `dodep.fun`       | `/`    | —             | —          | `4100`         | вкл / Let's Encrypt |
| `dodep-api`   | `dodep.fun`       | `/api` | —             | **выкл**   | `4200`         | вкл / Let's Encrypt |
| `dodep-admin` | `admin.dodep.fun` | `/`    | —             | —          | `80`           | вкл / Let's Encrypt |
| `dodep-api`   | `admin.dodep.fun` | `/api` | —             | **выкл**   | `4200`         | вкл / Let's Encrypt |

- **Strip Path выключен**: API сам слушает с префиксом `/api`. Если включить — `/api/health` превратится в `/health`, и всё сломается с 404.
- Один хост на разные сервисы по путям поддерживается; правило с `/api` специфичнее `/` и побеждает. Нужна свежая версия Dokploy: в старых добавление `dodep.fun/api` при существующем `dodep.fun/` отклонялось как конфликт (исправлено в https://github.com/Dokploy/dokploy/pull/5643) — тогда обновить Dokploy.
- WebSocket `/api/ws` Traefik проксирует без отдельной настройки (проверка — раздел 9).
- Изменения доменов у Applications применяются сразу, без передеплоя.

## 8. Healthcheck, обновление без простоя, реплики

В образы уже встроены healthcheck'и (Swarm использует их по умолчанию):

| Образ | Проверка                                                               |
| ----- | ---------------------------------------------------------------------- |
| api   | `GET http://127.0.0.1:4200/api/health` (проверяет и БД), старт до 30 с |
| app   | `GET http://127.0.0.1:4100/healthz`                                    |
| admin | `GET http://127.0.0.1/`                                                |

Чтобы неудачный релиз **откатывался сам**, у каждого приложения: **Advanced → Cluster Settings → Swarm Settings** (https://docs.dokploy.com/docs/core/applications/rollbacks, https://docs.dokploy.com/docs/core/applications/zero-downtime):

**Health Check** (значения в наносекундах; в образах нет `curl`, поэтому `wget`):

```json
{
  "Test": ["CMD", "wget", "-qO-", "http://127.0.0.1:4200/api/health"],
  "Interval": 10000000000,
  "Timeout": 3000000000,
  "StartPeriod": 30000000000,
  "Retries": 3
}
```

Для `dodep-app` — URL `http://127.0.0.1:4100/healthz`, `StartPeriod` 20 с; для `dodep-admin` — `http://127.0.0.1/`.

**Update Config**:

```json
{
  "Parallelism": 1,
  "Delay": 5000000000,
  "FailureAction": "rollback",
  "Monitor": 30000000000,
  "Order": "start-first"
}
```

`start-first` — новый контейнер поднимается, проходит healthcheck, и только потом гасится старый. Для API это значит, что несколько секунд работают две версии: поэтому миграции должны быть совместимы с предыдущей версией кода (раздел 10).

**Replicas**: `dodep-api` — строго `1`. `dodep-app` и `dodep-admin` можно больше.

После изменения этих настроек — **Deploy / Redeploy**.

## 9. Первый запуск и проверка

1. Задеплоить `dodep-api` (**Deploy**). В **Logs**: миграции применены, сервер слушает 4200. Статус контейнера — healthy.
2. Задеплоить `dodep-app` и `dodep-admin`.
3. Проверить:

| Что         | Как                                                                                            | Ожидается                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| API         | `curl https://dodep.fun/api/health`                                                            | `{"ok":true}`                                                       |
| Сайт        | открыть https://dodep.fun                                                                      | страница игры, без ошибок в консоли                                 |
| SSR → API   | открыть https://dodep.fun/rules                                                                | таблица выплат (данные пришли через `NUXT_API_INTERNAL_URL`)        |
| Swagger     | https://dodep.fun/api/docs                                                                     | открывается; https://admin.dodep.fun/api/admin/docs без входа — 401 |
| WebSocket   | на главной у «За столом» пульсирует точка; DevTools → Network → WS → `/api/ws` со статусом 101 | соединение открыто                                                  |
| Cookie      | зарегистрироваться; DevTools → Application → Cookies → `sid`                                   | `Secure`, `HttpOnly`, `SameSite=Lax`                                |
| Реальный IP | после регистрации — карточка аккаунта в админке, раздел отпечатков                             | ваш IP, а не адрес Traefik/Cloudflare                               |

4. Назначить себя админом: у `dodep-api` вкладка **Terminal** (оболочка в контейнере) →
   ```bash
   node dist/cli/admin-grant.js <ник>
   ```
   Снять права: `node dist/cli/admin-grant.js <ник> --revoke`.
5. Обновить страницу → кнопка «Админка» → вход в https://admin.dodep.fun по одноразовой ссылке (живёт 60 с). Это единственная проверка, где вместе работают Secure-cookie, переход между поддоменами и Traefik — пройти её обязательно.

**Если WebSocket не подключается** (точка серая, в консоли ошибка `/api/ws`): у Dokploy есть открытая проблема с WebSocket при включённом HTTP/2 в Traefik (https://github.com/Dokploy/dokploy/issues/4202). Проверить логи Traefik (**Settings → Traefik → Logs**) и при подтверждении — отключить HTTP/2 для entrypoint `websecure` в конфиге Traefik (**Settings → Traefik → traefik.yml**).

## 10. Обновление, откат, автодеплой

**Обновление**:

```bash
TAG=v1.1.0 pnpm docker:push        # или конкретный сервис: ... pnpm docker:push api
```

В Dokploy у приложения поменять тег в **Docker Image** → **Deploy**. Миграции применятся при старте нового контейнера API. Если healthcheck не пройдёт — Swarm сам вернёт предыдущую версию (раздел 8).

**Откат вручную**: вернуть предыдущий тег → **Deploy**. Миграции автоматически не откатываются, поэтому изменения схемы делаем в два релиза: сначала добавить колонку/таблицу (старый код её игнорирует), удалять старое — в следующем.

**Автодеплой (по желанию)**: во вкладке **General** включить **Auto Deploy**, во вкладке **Deployments** скопировать **Webhook URL** и дёргать его после публикации образа:

```bash
TAG=v1.1.0 pnpm docker:push api && curl -X POST "<Webhook URL dodep-api>"
```

Работает, если в Docker Image указан тег, который вы перезаписываете (например `latest`). При явных тегах проще менять тег руками — так видно, что и когда выкатили.

## 11. Cloudflare и реальный IP

От реального IP клиента зависят лимит регистраций и отпечатки. Цепочка: клиент → (Cloudflare) → Traefik → API. API берёт IP из `X-Forwarded-For`, отсчитывая `TRUST_PROXY` прокси с конца.

- **Без Cloudflare** (DNS-записи «серые», рекомендуется): `TRUST_PROXY=1`. Traefik ставит в `X-Forwarded-For` адрес клиента.
- **С проксированием Cloudflare** («оранжевое облако»): Traefik по умолчанию не доверяет чужим `X-Forwarded-For` и подставит IP Cloudflare — все пользователи будут выглядеть как несколько адресов Cloudflare, и лимит регистраций начнёт блокировать всех подряд. Чтобы это починить, Traefik должен доверять подсетям Cloudflare: в **Settings → Traefik → traefik.yml** для entrypoint `websecure` добавить
  ```yaml
  forwardedHeaders:
    trustedIPs:
      - 173.245.48.0/20 # полный актуальный список: https://www.cloudflare.com/ips/
      # …
  ```
  и выставить `TRUST_PROXY=2`. Режим SSL в Cloudflare — **Full (strict)**: Flexible вызывает бесконечные редиректы с Traefik.

Любой вариант проверить строкой «Реальный IP» из раздела 9.

## 12. Логи, мониторинг, доступ в контейнер

- **Logs** у приложения — логи в реальном времени с поиском (горячая клавиша `l`).
- **Monitoring** — CPU, память, сеть контейнера (`m`).
- **Terminal** — оболочка внутри контейнера (так запускается `admin-grant`).
- **Deployments** — история последних деплоев и их логи.
- Ошибки приложений — в Bugsink (проекты `dodep-api`, `dodep-web`, `dodep-admin`).

## 13. Частые проблемы

| Симптом                                        | Причина и решение                                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Домен без HTTPS / ошибка сертификата           | DNS не указывал на сервер в момент добавления домена. Проверить DNS, удалить и заново добавить домен                                                                |
| `404` на `/api/...`                            | включён **Strip Path** у домена API — выключить                                                                                                                     |
| `502 Bad Gateway`                              | неверный **Container Port** (4200/4100/80) или контейнер не healthy — смотреть Logs                                                                                 |
| `exec format error` в логах                    | образ собран не под `linux/amd64` — проверить `PLATFORM` в `.env`                                                                                                   |
| `unauthorized` / `no such image` при деплое    | не выбран реестр или неверный пароль реестра; на многоузловом Swarm первый деплой иногда падает — повторить Deploy (https://github.com/Dokploy/dokploy/issues/4003) |
| Рейтинг/правила пустые, в логах app ошибки SSR | неверный `NUXT_API_INTERNAL_URL` — должен быть App Name сервиса API и порт 4200                                                                                     |
| Вход работает, но сразу «Нужно войти»          | `COOKIE_SECURE=true`, а сайт открыт по http — открывать только по https                                                                                             |
| Кнопки «Админка» нет                           | пустой `ADMIN_URL` или у пользователя нет прав (`admin-grant`)                                                                                                      |
| Регистрация «недоступна» у всех                | лимит считает один IP на всех — неверный `TRUST_PROXY` / Cloudflare (раздел 11)                                                                                     |

## 14. Локальная проверка образов (без Dokploy)

`docker/docker-compose.prod-like.yml` поднимает собранные образы и отдельную MySQL без Traefik:

```bash
REGISTRY= TAG=local pnpm docker:build
docker compose -f docker/docker-compose.prod-like.yml up -d --wait
```

- API — http://localhost:4200/api, app — http://localhost:4100, admin — http://localhost:4300. Порты переопределяются переменными `API_PORT`, `APP_PORT`, `ADMIN_PORT` (например, если параллельно запущен `pnpm dev`).
- Без Traefik браузер на :4100 не достучится до `/api`, поэтому полноценная игра здесь не проверяется — проверяются SSR, API, статика админки и WebSocket.

```bash
docker compose -f docker/docker-compose.prod-like.yml down -v
```
