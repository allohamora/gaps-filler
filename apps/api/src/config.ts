import { parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

export const {
  NODE_ENV,

  PORT,

  PINO_LEVEL,
} = parseEnv(process.env, {
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  PORT: z.number().optional().default(4000),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
});
