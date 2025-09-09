import z from 'zod';
import { Hono } from 'hono';
import { mistakesRepository } from './mistake.repository.js';
import { analyzeMistake } from './mistake.service.js';
import { zValidator } from '@hono/zod-validator';

export const mistakesRouter = new Hono()
  .get('/', async (c) => {
    const mistakes = await mistakesRepository.getMistakes();

    return c.json(mistakes);
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        mistakes: z.array(
          z.object({
            incorrect: z.string(),
            correct: z.string(),
            topic: z.string(),
            explanation: z.string(),
          }),
        ),
      }),
    ),
    async (c) => {
      const { mistakes } = c.req.valid('json');
      // Create mistakes once and return them
      const created = await mistakesRepository.createMistakes(mistakes);

      return c.json(created, 201);
    },
  )
  .get('/:id', async (c) => {
    const id = c.req.param('id');

    return c.json(mistakesRepository.getMistakeById(id));
  })
  .post('/:id/analyze', async (c) => {
    const id = c.req.param('id');

    return c.json(await analyzeMistake(id));
  });
