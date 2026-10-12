import type { ApiErrorCode } from '@dodep/shared';

export class ApiFetchError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: ApiErrorCode,
  ) {
    super(message);
    this.name = 'ApiFetchError';
  }
}

export function toApiFetchError(status: number, body: unknown): ApiFetchError {
  const b = (body ?? {}) as { code?: ApiErrorCode; message?: unknown };
  const message = Array.isArray(b.message)
    ? b.message.join('; ')
    : typeof b.message === 'string'
      ? b.message
      : 'Что-то пошло не так';
  return new ApiFetchError(status, message, b.code);
}

export function apiErrorMessage(e: unknown): string {
  return e instanceof ApiFetchError ? e.message : 'Сервер недоступен, попробуй ещё раз';
}
