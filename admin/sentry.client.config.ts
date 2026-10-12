import * as Sentry from '@sentry/nuxt';
import { scrubTicketParam } from './app/utils/sentry-scrub.js';

const { sentryDsn, sentryEnvironment, sentryRelease } = useRuntimeConfig().public;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: sentryRelease || undefined,
    tracesSampleRate: 0,
    beforeSend: scrubTicketParam,
  });
}
