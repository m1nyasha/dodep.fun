import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { SessionsService } from '../auth/sessions.service.js';
import { apiError } from '../common/api-error.js';
import { ADMIN_COOKIE } from './admin-cookie.js';
import { resolveAdmin } from './admin-session.guard.js';
import { AdminModule } from './admin.module.js';

const unauthorizedBody = () => apiError(401, 'UNAUTHORIZED', 'Нужно войти в админку').getResponse();

export function setupAdminDocs(app: NestExpressApplication): void {
  const sessions = app.get(SessionsService, { strict: false });
  app.use('/api/admin', (req: Request, res: Response, next: NextFunction) => {
    // Express routing is case-insensitive by default, so the docs gate must match that
    // (otherwise `/api/admin/Docs-json` would slip past a case-sensitive prefix check).
    if (!req.path.toLowerCase().startsWith('/docs')) return next();
    resolveAdmin(sessions, req.cookies?.[ADMIN_COOKIE])
      .then((user) => (user ? next() : res.status(401).json(unauthorizedBody())))
      .catch(next);
  });
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('dodep.fun admin API').setVersion('1').addCookieAuth('admin_sid').build(),
    { include: [AdminModule] },
  );
  SwaggerModule.setup('api/admin/docs', app, doc);
}
