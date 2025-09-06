import { Hono } from 'hono';
import { mistakesRouter } from '../mistake/mistake.router.js';

export const v1Router = new Hono().route('/mistakes', mistakesRouter);
