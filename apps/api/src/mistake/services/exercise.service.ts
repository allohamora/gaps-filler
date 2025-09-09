import z from 'zod';
import { generateObject } from 'ai';
import { model } from 'src/libs/ai.lib.js';
import { Mistake } from 'src/services/chat.service.js';

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

const PROMPT = `You are an English tutor that is skilled in creating practical exercises to fix students' mistakes.
Your task is to analyze the student's mistake and generate exercises to help the student understand and correct their error.

Exercise requirements:
- 12 questions of each type.
- difficulty levels: easy, medium, hard (equal distribution).
- exactly 1 underscore (_) for gaps.
- 4 options for choosing questions with one correct answer.
- 20% of choosing exercises should be about related topics to help user see the difference.
- natural plain text only: no lists, bullets, emojis, asterisks, quotes for emphasis, or stage directions.
- writing exercises should force student to write full sentences.
- writing exercises can use types like: complete the sentence, write a sentence with the provided words, transform the sentence, correct the mistake in the sentence, make a question from the provided words, and similar.
- writing exercises should have only one possible answer that can be created from words of the task, they should not be open-ended with multiple correct answers.

Related choosing exercise examples (illustrative only - do not echo):
User: "Home is it?" -> question: "The girl _ I saw at the party is my friend’s ex-girlfriend", options: [{ value: "who", isCorrect: false }, { value: "whom", isCorrect: true }, { value: "what", isCorrect: false }, { value: "home", isCorrect: false }], difficulty: easy
User: "If I am you I was a billionaire." -> question: "If I _ you, I _ a billionaire.", options: [{ value: "had been / would have been", isCorrect: true }, { value: "am / am", isCorrect: false }, { value: "was / was", isCorrect: false }, { value: "are / will be", isCorrect: false }], difficulty: medium
User: "I was living here since 3 years." -> question: "I _ a shower when the phone rang.", options: [{ value: "took", isCorrect: false }, { value: "am taking", isCorrect: false }, { value: "have taken", isCorrect: false }, { value: "was taking", isCorrect: true }], difficulty: hard

Writing exercise examples (illustrative only - do not echo):
User: "Home are you?" -> task: "Complete the sentence using the correct word to ask about someone's current well-being: '_ are you?'", answer: "How are you?", difficulty: easy
User: "He don't like me, she don't like as well." -> task: "Complete the sentence using the correct form of the verb: 'He _ like me, she _ like as well.'", answer: "He doesn't like me, she doesn't like as well.", difficulty: easy

User: "I have visited Paris last year." -> task: "Write the sentence by using words: [last year, Paris, visit, I] in the correct form", answer: "I visited Paris last year.", difficulty: medium
User: "Whom is that?" -> task: "Write a question asking about the method for baking a perfect cake. Start with 'Could you tell me ...?", answer: "Could you tell me how to bake a perfect cake?", difficulty: medium

User: "If I was you, I was more careful." -> task: "Rewrite 'If I was you, I was more careful.' to the correct second conditional form.", answer: "If I were you, I would be more careful.", difficulty: hard
User: "I do not like they." -> task: "Make a question from 'I do not like them'.", answer: "Who do you not like?", difficulty: hard`;

export const generateExercises = async ({ incorrect, correct, topic, explanation }: Mistake) => {
  const { object } = await generateObject({
    temperature: 0.9,
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
