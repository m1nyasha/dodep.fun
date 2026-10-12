import './instrument.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import { config } from './config.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
setupApp(app);
await app.listen(config.port, '0.0.0.0');
