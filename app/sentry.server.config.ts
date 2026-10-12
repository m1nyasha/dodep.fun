import * as Sentry from '@sentry/nuxt';

const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development',
    release: process.env.NUXT_PUBLIC_SENTRY_RELEASE || undefined,
    tracesSampleRate: 0,
  });
}
