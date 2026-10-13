import type { AgentState } from './decision.schema.js';

export class GameClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async request<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/internal/experiments${path}`;
    for (let attempt = 0; attempt < 4; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, {
          method: body === undefined ? 'GET' : 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        continue;
      }
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        continue;
      }
      if (!response.ok) throw new Error(`Game API ${response.status}: ${await response.text()}`);
      return (await response.json()) as T;
    }
    throw new Error('Game API retry limit reached');
  }

  createExperiment(body: unknown) {
    return this.request<{ id: string; startedAt: string }>('', body);
  }

  createAgent(experimentId: string, body: unknown) {
    return this.request<{ agentId: string; nickname: string }>(`/${experimentId}/agents`, body);
  }

  state(experimentId: string, agentId: string) {
    return this.request<AgentState>(`/${experimentId}/agents/${agentId}/state`);
  }

  decide(experimentId: string, agentId: string, body: unknown) {
    return this.request<unknown>(`/${experimentId}/agents/${agentId}/decisions`, body);
  }

  monitor(experimentId: string) {
    return this.request<Record<string, unknown>>(`/${experimentId}/monitor`);
  }

  decisions(experimentId: string) {
    return this.request<{ agentId: string; inputTokens: number; outputTokens: number }[]>(`/${experimentId}/decisions`);
  }

  technicalStop(experimentId: string, agentId: string, reason: string) {
    return this.request(`/${experimentId}/agents/${agentId}/technical-stop`, { reason });
  }

  resume(experimentId: string, agentId: string) {
    return this.request(`/${experimentId}/agents/${agentId}/resume`, {});
  }

  finish(experimentId: string) {
    return this.request(`/${experimentId}/finish`, {});
  }
}
