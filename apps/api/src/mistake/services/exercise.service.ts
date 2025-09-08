import z from 'zod';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';
import { Mistake } from 'src/export.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ChoosingExercise = {
  question: string;
  options: { value: string; isCorrect: boolean }[];
  difficulty: Difficulty;
};

export type WritingExercise = {
  task: string;
  answer: string;
  difficulty: Difficulty;
};

export type Exercises = { choosing: ChoosingExercise[]; writing: WritingExercise[] };

const model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');

const PROMPT = `You are an English tutor that is skilled in creating practical exercises to fix students' mistakes.
Your task is to analyze the student's mistake and generate exercises to help the student understand and correct their error.

Your exercises requirements:
- 12 questions of each type.
- difficulty levels: easy, medium, hard (equal distribution).
- exactly 1 underscore (_) for gaps.
- 4 mixed options for choosing questions with one correct answer.
- writing exercises should force student to write full sentences.
- writing exercises should have only one possible answer based on the instruction, they should not be open-ended.`;

export const generateExercises = async (mistake: Mistake) => {
  const { object } = await generateObject({
    temperature: 1,
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
      choosing: z.array(
        z.object({
          question: z.string(),
          options: z.array(z.object({ value: z.string(), isCorrect: z.boolean() })),
          difficulty: z.enum(['easy', 'medium', 'hard']),
        }),
      ),
      writing: z.array(
        z.object({
          task: z.string(),
          answer: z.string(),
          difficulty: z.enum(['easy', 'medium', 'hard']),
        }),
      ),
    }),
  });

  return object satisfies Exercises;
};
