import { Module } from '@nestjs/common';
import { FeedGateway } from './feed.gateway.js';

@Module({ providers: [FeedGateway], exports: [FeedGateway] })
export class FeedModule {}
