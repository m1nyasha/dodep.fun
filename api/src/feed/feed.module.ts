import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller.js';
import { FeedGateway } from './feed.gateway.js';

@Module({ controllers: [FeedController], providers: [FeedGateway], exports: [FeedGateway] })
export class FeedModule {}
