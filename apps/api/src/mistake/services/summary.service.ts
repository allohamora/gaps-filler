import z from 'zod';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';
import { Mistake } from 'src/export.js';

const model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');

const PROMPT = `You are an English tutor that is skilled in explaining student's mistakes and helping to fix them.
Your task is to analyze the student's mistake and generate summary to help the student understand and correct their error.

Your summary should contain:
- markdown format
- explanation of the mistake
- detailed explanation of the related grammar
- examples and counterexamples
- conclusion with key takeaways`;

export const generateSummary = async (mistake: Mistake) => {
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
        content: JSON.stringify(mistake),
      },
    ],
    schema: z.object({
      summary: z.string(),
    }),
  });

  return object.summary;
};
