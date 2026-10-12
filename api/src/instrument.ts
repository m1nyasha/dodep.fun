import * as Sentry from '@sentry/nestjs';
import { config } from './config.js';
import { sentryOptions } from './sentry-options.js';

const options = sentryOptions(config.sentry);
if (options) Sentry.init(options);
