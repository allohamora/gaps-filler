import z from 'zod';
import { Hono } from 'hono';
import { mistakesRepository } from './mistake.repository.js';
import { createTask } from './mistake.service.js';
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
        mistake: z.object({
          incorrect: z.string(),
          correct: z.string(),
          topic: z.string(),
          explanation: z.string(),
        }),
      }),
    ),
    async (c) => {
      const { mistake } = c.req.valid('json');

      return c.json(await mistakesRepository.createMistake(mistake), 201);
    },
  )
  .get('/:id', async (c) => {
    const id = c.req.param('id');

    return c.json(mistakesRepository.getMistakeById(id));
  })
  .post('/:id/task', async (c) => {
    const id = c.req.param('id');

    return c.json(await createTask(id), 201);
  });
