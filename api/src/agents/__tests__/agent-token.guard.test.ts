import type { ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';
import { config } from '../../config.js';
import { AgentTokenGuard } from '../agent-token.guard.js';

const original = { enabled: config.agentApiEnabled, token: config.agentApiToken };
afterEach(() => {
  config.agentApiEnabled = original.enabled;
  config.agentApiToken = original.token;
});

function context(token: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ header: () => token }) }),
  } as unknown as ExecutionContext;
}

describe('AgentTokenGuard', () => {
  it('keeps the API disabled by default', () => {
    config.agentApiEnabled = false;
    expect(() => new AgentTokenGuard().canActivate(context('Bearer any'))).toThrow();
  });

  it('requires the exact bearer token', () => {
    config.agentApiEnabled = true;
    config.agentApiToken = 'a'.repeat(32);
    const guard = new AgentTokenGuard();
    expect(() => guard.canActivate(context('Bearer ' + 'b'.repeat(32)))).toThrow();
    expect(guard.canActivate(context('Bearer ' + 'a'.repeat(32)))).toBe(true);
  });
});
