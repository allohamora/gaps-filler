import z from 'zod';
import { generateObject, ModelMessage } from 'ai';
import { model } from 'src/libs/ai.lib.js';

export type Mistake = {
  incorrect: string;
  correct: string;
  topic: string;
  explanation: string;
};

const PROMPT = `You are a professional English language teacher who is experienced in one to one chatting.
The user want to find and correct their grammar mistakes, and he is expecting you to help him with that.
Your task is to keep a conversation with a user and return all mistakes that you notice to help him.

Answer requirements:
- max 1-2 sentences.
- natural plain text only: no lists, bullets, emojis, asterisks, quotes for emphasis, or stage directions.
- do not correct the user: just keep the conversation going.

Mistakes requirements:
- conditional sentence with errors in both clauses => one mistake.
- misspelling does not count as a mistake.

Examples (illustrative only - do not echo):
User: "She don’t likes coffee" -> incorrect: She don’t likes coffee | correct: She doesn’t like coffee | topic: subject–verb agreement (don’t vs doesn’t) | explanation: Whom was used as the subject, which violates subject vs. object rules.
User: "I have visited Paris last year" -> incorrect: I have visited Paris last year. | correct: I visited Paris last year. | topic: verb tense (present perfect vs simple past) | explanation: The present perfect tense is not used with specific past time expressions like "last year."
User: "I like dogs" + "I like it" -> incorrect: I like it | correct: I like them | topic: pronoun reference (it vs them) | explanation: The pronoun "it" does not agree in number with the plural noun "dogs."
User: "If I was you, I was a doctor" -> incorrect: If I was you, I was a doctor | correct: If I were you, I would be a doctor | topic: second conditional (was vs were) (was vs would be) | explanation: In hypothetical conditional sentences, "were" is used instead of "was" for all subjects, "would be" is used instead of "was" to express the consequence.`;

// half from ai, half from user
const MESSAGES_LIMIT = 10;

export class ChatSession {
  private systemMessage: ModelMessage = {
    role: 'system',
    content: PROMPT,
  };

  private history: ModelMessage[] = [];

  public async send(message: string) {
    this.history.push({ role: 'user', content: message });

    const { object } = await generateObject({
      temperature: 0.8,
      model,
      messages: [this.systemMessage, ...this.history.slice(-MESSAGES_LIMIT)],
      schema: z.object({
        answer: z.string(),
        mistakes: z
          .array(
            z.object({
              incorrect: z.string(),
              correct: z.string(),
              topic: z.string(),
              explanation: z.string(),
            }),
          )
          .optional(),
      }),
    });

    this.history.push({ role: 'assistant', content: JSON.stringify(object) });

    return object;
  }
}
