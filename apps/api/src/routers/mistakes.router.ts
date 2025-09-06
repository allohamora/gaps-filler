import { Hono } from 'hono';
import { dbService } from 'src/services/db.service.js';

export const mistakesRouter = new Hono().get('/', async (c) => {
  const mistakes = await dbService.getMistakes();

  return c.json(mistakes);
});
