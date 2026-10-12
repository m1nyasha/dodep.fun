import { HttpException } from '@nestjs/common';
import type { ApiErrorCode } from '@dodep/shared';

export const apiError = (status: number, code: ApiErrorCode, message: string) =>
  new HttpException({ code, message }, status);
