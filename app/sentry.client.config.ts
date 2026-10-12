import * as Sentry from '@sentry/nuxt';

const { sentryDsn, sentryEnvironment, sentryRelease } = useRuntimeConfig().public;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: sentryRelease || undefined,
    tracesSampleRate: 0,
  });
}
