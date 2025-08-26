import { hc } from 'hono/client';
import type { app } from '@gaps-filler/api';

export const api = hc<app>(import.meta.env.VITE_API_URL);
