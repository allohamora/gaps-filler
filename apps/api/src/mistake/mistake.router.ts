import { Hono } from 'hono';
import { mistakesRepository } from './mistake.repository.js';
import { analyzeMistakeById } from './mistake.service.js';

export const mistakesRouter = new Hono()
  .get('/', async (c) => {
    const mistakes = await mistakesRepository.getMistakes();

    return c.json(mistakes);
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const mistake = mistakesRepository.getMistakeById(id);
    if (!mistake) {
      return c.json({ message: 'mistake not found' }, 404);
    }
    return c.json(mistake);
  })
  .post('/:id/analyze', async (c) => {
    const id = c.req.param('id');

    return c.json(await analyzeMistakeById(id));
  });
