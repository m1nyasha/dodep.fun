import { describe, expect, it } from 'vitest';
import { sentryOptions } from '../sentry-options.js';

describe('sentryOptions', () => {
  it('disables Sentry without a DSN', () => {
    expect(sentryOptions({ dsn: '', environment: 'production', release: 'abc' })).toBeNull();
  });

  it('builds options for Bugsink without tracing and PII', () => {
    expect(sentryOptions({ dsn: 'https://key@bugsink.test/1', environment: 'production', release: 'v1.0.0' })).toEqual({
      dsn: 'https://key@bugsink.test/1',
      environment: 'production',
      release: 'v1.0.0',
      tracesSampleRate: 0,
      dataCollection: { userInfo: false, cookies: false, httpHeaders: false, urlQueryParams: false, httpBodies: [] },
    });
  });

  it('omits an empty release', () => {
    expect(sentryOptions({ dsn: 'https://key@bugsink.test/1', environment: 'development', release: '' })?.release).toBeUndefined();
  });
});
