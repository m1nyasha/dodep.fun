import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AuthModule } from './auth/auth.module.js';
import { config } from './config.js';
import { GameModule } from './game/game.module.js';
import { HealthModule } from './health/health.module.js';
import { PlayersModule } from './players/players.module.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- matches @nestjs/swagger's `include?: Function[]`
export const PUBLIC_DOC_MODULES: Function[] = [HealthModule, AuthModule, PlayersModule, GameModule];

export function setupApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.set('trust proxy', config.trustProxy);
  app.use(cookieParser());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableShutdownHooks();

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('dodep.fun API').setVersion('1').addCookieAuth('sid').build(),
    { include: PUBLIC_DOC_MODULES },
  );
  SwaggerModule.setup('api/docs', app, doc);
}
