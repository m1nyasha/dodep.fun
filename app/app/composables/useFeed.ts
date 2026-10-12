import type { FeedEventDto } from '@dodep/shared';

export function useFeed() {
  const api = useApi();
  const config = useRuntimeConfig();
  const items = useState<FeedEventDto[]>('feed', () => []);

  const url = import.meta.client
    ? config.public.wsUrl || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`
    : undefined;

  const { status } = useWebSocket(url, {
    autoReconnect: { retries: () => true, delay: 3_000 },
    heartbeat: {
      message: FEED_PING,
      responseMessage: FEED_PONG,
      pongTimeout: 10_000,
      scheduler: (cb) => useIntervalFn(cb, 25_000, { immediate: false }),
    },
    onMessage(_, e: MessageEvent) {
      const event = parseFeedMessage(String(e.data));
      if (event) items.value = [event, ...items.value].slice(0, FEED_SIZE);
    },
  });

  async function load() {
    items.value = await api<FeedEventDto[]>('/feed');
  }

  return { items, status, load };
}
