import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { ApiFetchError } from '../../utils/api-error';
import { useApi } from '../useApi';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('useApi', () => {
  it('prefixes requests with /api', async () => {
    registerEndpoint('/api/ping-ok', () => ({ ok: true }));
    const result = (await useApi()('/ping-ok')) as unknown;
    expect(result).toEqual({ ok: true });
  });

  it('throws ApiFetchError with the domain code', async () => {
    registerEndpoint('/api/ping-bad', () => json(400, { code: 'BET_INVALID', message: 'Ставка — от 100 с шагом 100' }));
    const error = await useApi()('/ping-bad').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiFetchError);
    expect(error).toMatchObject({ status: 400, code: 'BET_INVALID', message: 'Ставка — от 100 с шагом 100' });
  });
});
