import type * as Sentry from '@sentry/nestjs';

export type SentryInitOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;

export function sentryOptions(s: { dsn: string; environment: string; release: string }): SentryInitOptions | null {
  if (!s.dsn) return null;
  return {
    dsn: s.dsn,
    environment: s.environment,
    release: s.release || undefined,
    tracesSampleRate: 0,
    // @sentry/nestjs 11 replaced `sendDefaultPii` with granular `dataCollection`; disable the PII-bearing categories.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, urlQueryParams: false, httpBodies: [] },
  };
}
