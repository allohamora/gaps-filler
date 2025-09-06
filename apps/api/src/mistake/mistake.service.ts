import z from 'zod';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';
import { mistakesRepository } from './mistake.repository.js';
import { Mistake } from 'src/services/llm.service.js';

const model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');

const PROMPT = `You are an expert, encouraging ESL grammar tutor. INPUT: one learner mistake object with fields: mistake (original erroneous sentence), correct (corrected sentence), topic (short grammar label), practice (optional hint). OUTPUT: ONLY valid JSON with EXACTLY these two top-level keys: "article" (Markdown string) and "questions" (array of 5 question objects). No extra keys, no commentary, no backticks.

-"article" (Markdown):
- Purpose: a self‑contained mini-lesson (self‑study book style) ensuring the learner will not repeat this mistake.
- Tone: authoritative yet encouraging; concise density (no fluff); minimal but purposeful emoji (optional, never at very start).
- REQUIRED OPENING: A TASK PREVIEW block (no greeting) emulating a quality self‑study textbook. Acceptable formats:
  Lesson Focus: <topic label>\nLearner Error: "<original mistake>"
  or
  Objective: Correct the <topic> error found in: "<original mistake>".
- Immediately after the preview, provide a 1–2 sentence high-level description of what this grammar point does (functional description), like a textbook intro.
- Structured flow (still narrative; headings optional but allowed): Suggested labeled segments in bold or level-3 headings: Overview, Pattern / Form, Usage & Nuance, Common Errors, Contrast & Near Forms, Register & Variation, Memory Aids, Related Points, Quick Mastery Recap. Do NOT dump a rigid bullet list of examples.
- Examples: woven into prose; each example sentence appears inline or after a colon—avoid raw bullet/number lists for examples. No code fences.
- Must clearly: (1) Diagnose the error, (2) Give canonical pattern(s), (3) Explain forms & constraints, (4) Provide varied natural examples, (5) Contrast with easily confused structures, (6) Show register/formality or spoken vs written differences when relevant, (7) Give memory heuristics, (8) Connect to related grammar, (9) Include advanced nuance only if well-established; omit speculative edge cases.
- End with a concise mastery recap (1 short paragraph) signalling readiness for practice (e.g., "You should now be able to..."), no bullets.
- Do NOT invent dubious rules. If an advanced edge case is uncertain, omit it.
- You may quote the incorrect and correct sentences once early for contrast, but do not repeatedly reuse them.
- Examples appear inline in flowing prose (e.g., “For example, …”). No markdown code fences for sentences. Avoid long enumerated lists; keep narrative style.

"questions": EXACTLY 5 multiple-choice items styled like a self‑study workbook practice set reinforcing the SAME topic.
Each question object schema:
  {
    "question": "A single complete sentence with exactly one blank ___ somewhere.",
    "options": [ { "value": string, "isCorrect": boolean }, x4 total ]
  }
Constraints:
- Exactly 5 question objects. No more, no fewer.
- Each question has exactly one blank token: ___ (three underscores) and no other blanks.
- Each question should feel like a textbook exercise item: clear, context-rich, concise.
- Exactly 4 options; exactly one has isCorrect: true.
- Options: unique, trimmed, short (1–3 words or concise phrase), no trailing punctuation unless syntactically required.
- Distractors: target typical confusions for THIS grammar point (form, tense, auxiliary choice, word form, preposition/article, register). Avoid absurd or obviously wrong distractors.
- At least one item must subtly reflect the original error pattern (fixed correctly) in a new context.
- Vary contexts (formal/informal, spoken/written, temporal frames) without leaving the grammar scope.
- Do NOT reuse the exact erroneous sentence; no recycling of identical clause order.
- Do NOT number questions or options; no explanations, hints, rationales, answer key, or metadata outside required fields.

Validation & Output Rules:
- Output MUST be raw JSON parsable by JSON.parse — no markdown fences, no trailing text.
- Only top-level keys: "article" and "questions".
- Keep content strictly on the provided topic; avoid unrelated tangents.
- Avoid hallucinated frequency claims; only include frequency/naturalness statements if widely established.

Goal: Precision, clarity, and lasting understanding—concise yet rich. Return JSON now.`;

const analyzeMistake = async (mistake: Mistake) => {
  const res = await generateObject({
    model,
    system: PROMPT,
    schema: z.object({
      article: z.string(),
      questions: z.array(
        z.object({
          question: z.string(),
          options: z.array(
            z.object({
              value: z.string(),
              isCorrect: z.boolean(),
            }),
          ),
        }),
      ),
    }),
    messages: [
      {
        role: 'user',
        content: JSON.stringify(mistake),
      },
    ],
  });

  return res.object;
};

export const analyzeMistakeById = async (mistakeId: string) => {
  const mistake = mistakesRepository.getMistakeById(mistakeId);

  if (!mistake) {
    throw new Error('mistake is not found');
  }

  const { article, questions } = await analyzeMistake(mistake);

  return await mistakesRepository.updateMistake(mistakeId, { article, questions });
};
