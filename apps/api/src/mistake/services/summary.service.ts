import z from 'zod';
import { generateObject } from 'ai';
import { Mistake } from 'src/export.js';
import { model } from 'src/libs/ai.lib.js';

const PROMPT = `You are an English tutor that is skilled in explaining student's mistakes and helping to fix them.
Your task is to analyze the student's mistake and generate summary to help the student understand and correct their error.

Summary requirements:
- markdown format.
- detailed explanation of the mistake.
- detailed explanation of the related grammar.
- examples and counterexamples.
- conclusion with key takeaways.`;

export const generateSummary = async ({ incorrect, correct, topic, explanation }: Mistake) => {
  const { object } = await generateObject({
    temperature: 0.8,
    model,
    messages: [
      {
        role: 'system',
        content: PROMPT,
      },
      {
        role: 'user',
        content: JSON.stringify({ incorrect, correct, topic, explanation }),
      },
    ],
    schema: z.object({
      summary: z.string(),
    }),
  });

  return object.summary;
};
