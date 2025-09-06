import z from 'zod';
import { streamText, ModelMessage, tool, stepCountIs } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';
import { createLogger } from './logger.service.js';

const END = new Set(['.', '!', '?', ',', ';', ':']);

export type Mistake = {
  mistake: string;
  correct: string;
  topic: string;
  practice: string;
};

const PROMPT = `ROLE: You are a patient, natural English conversation teacher. Primary goal: sustain engaging dialogue. Secondary goal: silently capture genuine grammar mistakes (not mere informality) from the user's latest message via the reportMistakes tool.

CONVERSATION STYLE:
- Max 1-2 sentences per turn.
- Usually end with an open question (vary wh-, follow-ups, opinions, hypotheticals) to elicit different grammar (tenses, conditionals, modals, passive, comparatives, articles, pronouns, aspect).
- Natural plain text only: no lists, bullets, emojis, asterisks, quotes for emphasis, or stage directions.

MISTAKE TOOL USAGE:
- Examine ONLY the user’s latest message.
- ONLY report clear grammar errors (agreement, tense, aspect, articles, pronoun case, verb form, conditional structure, missing auxiliaries, preposition misuse, word order).

GRANULARITY:
- Each distinct grammar concept = one object.
- Do not split a single verb phrase error into multiple parts.
- Conditional sentence with errors in BOTH clauses => ONE object containing the full erroneous sentence as mistake and the fully corrected sentence as correct; topic: "[type] conditional"; practice: guidance with clause forms (e.g. "forming second conditional sentences (if + past simple, would + base form)").

EXAMPLES (ILLUSTRATIVE ONLY - DO NOT ECHO):
User: "I went to store" -> mistake: I went to store | correct: I went to the store | topic: definite vs indefinite articles | practice: distinguishing between definite and indefinite articles (the vs a/an)
User: "if I was you I were bigger" -> mistake: if I was you I were bigger | correct: if I were you I would be bigger | topic: second conditional | practice: forming second conditional sentences (if + past simple, would + base form)`;

export class LlmSession {
  private model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');
  private logger = createLogger('llm-session');
  private messages: ModelMessage[] = [
    {
      role: 'system',
      content: PROMPT,
    },
  ];

  // we need to iterate this whole stream to prevent cases when message are missing in the output
  private async *iterateStream(textStream: AsyncIterable<string>) {
    let content = '';
    let block = '';

    for await (const chunk of textStream) {
      content += chunk;

      for (const char of chunk) {
        block += char;

        if (END.has(char)) {
          yield block;
          block = '';
        }
      }
    }

    const trimmedBlock = block.trim();
    if (trimmedBlock.length > 0) {
      yield trimmedBlock;
      block = '';
    }

    this.messages.push({ role: 'assistant', content: content.trim() });
  }

  public stream(message: string, onMistakes?: (mistakes: Mistake[]) => void) {
    this.messages.push({ role: 'user', content: message });

    const { textStream } = streamText({
      temperature: 0.8,
      model: this.model,
      messages: this.messages,
      stopWhen: stepCountIs(2),
      tools: {
        reportMistakes: tool({
          description: 'Use this tool to report grammar mistakes made by the user in their last message.',
          inputSchema: z.object({
            mistakes: z.array(
              z.object({
                mistake: z.string(),
                correct: z.string(),
                topic: z.string(),
                practice: z.string(),
              }),
            ),
          }),
          execute: ({ mistakes }) => {
            this.logger.info({ msg: 'reported mistakes', mistakes });

            onMistakes?.(mistakes);
          },
        }),
      },
    });

    return this.iterateStream(textStream);
  }
}
