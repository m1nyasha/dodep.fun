import { describe, expect, it } from 'vitest';
import { ApiFetchError, apiErrorMessage, toApiFetchError } from '../api-error';

describe('toApiFetchError', () => {
  it('keeps code and message of a domain error', () => {
    const e = toApiFetchError(409, { code: 'NICKNAME_TAKEN', message: 'Этот ник уже занят' });
    expect(e).toBeInstanceOf(ApiFetchError);
    expect(e).toMatchObject({ status: 409, code: 'NICKNAME_TAKEN', message: 'Этот ник уже занят' });
  });

  it('joins validation messages', () => {
    expect(toApiFetchError(400, { message: ['nickname: too short', 'password: too short'] }).message).toBe(
      'nickname: too short; password: too short',
    );
  });

  it('falls back for empty bodies', () => {
    expect(toApiFetchError(502, undefined)).toMatchObject({ status: 502, code: undefined, message: 'Что-то пошло не так' });
  });
});

describe('apiErrorMessage', () => {
  it('uses the API message or a network fallback', () => {
    expect(apiErrorMessage(new ApiFetchError(400, 'Недостаточно монет', 'INSUFFICIENT_BALANCE'))).toBe('Недостаточно монет');
    expect(apiErrorMessage(new TypeError('fetch failed'))).toBe('Сервер недоступен, попробуй ещё раз');
  });
});
