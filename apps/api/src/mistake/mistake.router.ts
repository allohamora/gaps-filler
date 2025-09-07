import { Hono } from 'hono';
import { mistakesRepository } from './mistake.repository.js';
import { analyzeMistake } from './mistake.service.js';

export const mistakesRouter = new Hono()
  .get('/', async (c) => {
    const mistakes = await mistakesRepository.getMistakes();

    return c.json(mistakes);
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');

    return c.json(mistakesRepository.getMistakeById(id));
  })
  .post('/:id/analyze', async (c) => {
    const id = c.req.param('id');

    return c.json(await analyzeMistake(id));
  });
