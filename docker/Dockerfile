# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --store-dir /pnpm/store
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --store-dir /pnpm/store --package-import-method copy
RUN pnpm build:shared

FROM deps AS api-build
RUN pnpm --filter @dodep/api build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    rm -rf node_modules */node_modules \
    && pnpm install --offline --frozen-lockfile --prod --filter "@dodep/api..." --store-dir /pnpm/store --package-import-method copy

FROM node:24-alpine AS api
ARG SENTRY_RELEASE=local
ENV NODE_ENV=production PORT=4200 SENTRY_RELEASE=$SENTRY_RELEASE
WORKDIR /repo
COPY --from=api-build --chown=node:node /repo/node_modules ./node_modules
COPY --from=api-build --chown=node:node /repo/shared/package.json ./shared/package.json
COPY --from=api-build --chown=node:node /repo/shared/dist ./shared/dist
COPY --from=api-build --chown=node:node /repo/api/package.json ./api/package.json
COPY --from=api-build --chown=node:node /repo/api/node_modules ./api/node_modules
COPY --from=api-build --chown=node:node /repo/api/dist ./api/dist
COPY --from=api-build --chown=node:node /repo/api/drizzle ./api/drizzle
USER node
WORKDIR /repo/api
EXPOSE 4200
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4200/api/health || exit 1
CMD ["sh", "-c", "node dist/db/migrate.js && exec node dist/main.js"]

FROM deps AS app-build
RUN pnpm --filter @dodep/app build

FROM node:24-alpine AS app
ARG SENTRY_RELEASE=local
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4100 NUXT_PUBLIC_SENTRY_RELEASE=$SENTRY_RELEASE
WORKDIR /app
COPY --from=app-build --chown=node:node /repo/app/.output ./.output
USER node
EXPOSE 4100
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4100/healthz || exit 1
CMD ["node", ".output/server/index.mjs"]

FROM deps AS admin-build
ARG SENTRY_RELEASE=local
ARG NUXT_PUBLIC_SENTRY_DSN=
ARG NUXT_PUBLIC_SENTRY_ENVIRONMENT=production
ARG NUXT_PUBLIC_SITE_URL=https://dodep.fun
ENV NUXT_PUBLIC_SENTRY_RELEASE=$SENTRY_RELEASE
RUN pnpm --filter @dodep/admin build

FROM nginx:1.27-alpine AS admin
COPY docker/nginx.admin.conf /etc/nginx/conf.d/default.conf
COPY --from=admin-build /repo/admin/.output/public /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
