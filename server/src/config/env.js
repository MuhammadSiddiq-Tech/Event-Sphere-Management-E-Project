/**
 * @module config/env
 * Validates and exports all required environment variables.
 * This is the ONLY module that reads process.env directly.
 */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  CLIENT_URL: z.string().url(),
  // Optional
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  UPLOAD_DIR: z.string().default('./uploads'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  // console.error is the only allowed console usage — logger does not exist yet
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
  process.exit(1);
}

/** @type {Readonly<z.infer<typeof schema>>} */
export const env = Object.freeze(result.data);
export default env;
