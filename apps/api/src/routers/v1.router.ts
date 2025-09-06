import { Hono } from 'hono';
import { mistakesRouter } from './mistakes.router.js';

export const v1Router = new Hono().route('/mistakes', mistakesRouter);
