import { describe, expect, it } from 'vitest';
import { scrubTicketParam } from '../sentry-scrub';

describe('scrubTicketParam', () => {
  it('strips the ticket query param from the event request url', () => {
    const event = { request: { url: 'https://admin.test/auth?ticket=secret-abc&foo=1' } };
    expect(scrubTicketParam(event).request?.url).toBe('https://admin.test/auth?foo=1');
  });

  it('drops the query string entirely when ticket was the only param', () => {
    const event = { request: { url: 'https://admin.test/auth?ticket=secret-abc' } };
    expect(scrubTicketParam(event).request?.url).toBe('https://admin.test/auth');
  });

  it('leaves urls without a ticket param untouched', () => {
    const event = { request: { url: 'https://admin.test/accounts?page=2' } };
    expect(scrubTicketParam(event).request?.url).toBe('https://admin.test/accounts?page=2');
  });

  it('scrubs breadcrumb url/to/from fields', () => {
    const event = {
      breadcrumbs: [
        { data: { url: 'https://admin.test/auth?ticket=abc' } },
        { data: { to: '/auth?ticket=abc', from: '/login?ticket=abc&x=1' } },
        { data: {} },
        {},
      ],
    };
    const scrubbed = scrubTicketParam(event);
    expect(scrubbed.breadcrumbs?.[0]?.data?.url).toBe('https://admin.test/auth');
    expect(scrubbed.breadcrumbs?.[1]?.data?.to).toBe('/auth');
    expect(scrubbed.breadcrumbs?.[1]?.data?.from).toBe('/login?x=1');
  });

  it('is a no-op when there is no request or breadcrumbs', () => {
    expect(scrubTicketParam({})).toEqual({});
  });
});
