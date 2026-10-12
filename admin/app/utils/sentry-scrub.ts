function stripTicketParam(url: string | undefined): string | undefined {
  if (!url?.includes('ticket=')) return url;
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const qIndex = base.indexOf('?');
  if (qIndex < 0) return url;
  const params = new URLSearchParams(base.slice(qIndex + 1));
  if (!params.has('ticket')) return url;
  params.delete('ticket');
  const query = params.toString();
  return `${base.slice(0, qIndex)}${query ? `?${query}` : ''}${hash}`;
}

interface ScrubbableEvent {
  request?: { url?: string };
  breadcrumbs?: Array<{ data?: { url?: string; to?: string; from?: string } }>;
}

// Strips the admin login ticket out of Sentry events: it's sent as a one-time
// `?ticket=` query param before the app replaces it out of the URL bar, but
// Sentry can capture the raw URL/breadcrumbs before that replaceState runs.
export function scrubTicketParam<T extends ScrubbableEvent>(event: T): T {
  if (event.request?.url) event.request.url = stripTicketParam(event.request.url);
  for (const crumb of event.breadcrumbs ?? []) {
    if (!crumb.data) continue;
    if (crumb.data.url) crumb.data.url = stripTicketParam(crumb.data.url);
    if (crumb.data.to) crumb.data.to = stripTicketParam(crumb.data.to);
    if (crumb.data.from) crumb.data.from = stripTicketParam(crumb.data.from);
  }
  return event;
}
