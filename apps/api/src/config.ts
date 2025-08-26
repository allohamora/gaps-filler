import { parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

export const {
  NODE_ENV,

  PORT,

  PINO_LEVEL,

  DEEPGRAM_API_KEY,

  CARTESIA_API_KEY,
  CARTESIA_VERSION,

  GEMINI_API_KEY,
} = parseEnv(process.env, {
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  PORT: z.number().optional().default(4000),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),

  DEEPGRAM_API_KEY: z.string(),

  CARTESIA_API_KEY: z.string(),
  CARTESIA_VERSION: z.string(),

  GEMINI_API_KEY: z.string(),
});
