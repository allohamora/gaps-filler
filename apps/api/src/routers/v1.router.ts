import { Hono } from 'hono';

export const v1Router = new Hono().get('/hello-world', (c) => c.json({ message: 'Hello World!' }));
