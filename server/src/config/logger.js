/**
 * @module config/logger
 * Pino logger instance. Import this everywhere logging is needed.
 */
import pino from 'pino';
import { env } from './env.js';

/** @type {import('pino').Logger} */
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss' },
    },
  }),
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
});

export default logger;
