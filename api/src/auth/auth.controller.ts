import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import { fingerprintFromRequest } from './fingerprint.js';
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  @Post('register')
  @HttpCode(204)
  async register(
    @Body({ schema: registerSchema }) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    setSessionCookie(res, await this.auth.register(body, fingerprintFromRequest(req, body.clientHash)));
  }

  @Post('login')
  @HttpCode(204)
  async login(
    @Body({ schema: loginSchema }) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    setSessionCookie(res, await this.auth.login(body, fingerprintFromRequest(req, body.clientHash)));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string') await this.sessions.revoke(token);
    clearSessionCookie(res);
  }
}
