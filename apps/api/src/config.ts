import { parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

export const {
  NODE_ENV,

  PORT,
} = parseEnv(process.env, {
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  PORT: z.number().optional().default(4000),
});
