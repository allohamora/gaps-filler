import { streamText, ModelMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';
import { PassThrough } from 'stream';
import { createLogger } from 'src/services/logger.service.js';

const END = new Set(['.', '!', '?', ',', ';', ':']);

const PROMPT = `You are a polite conversational English teacher. We will have a concise back-and-forth. Strict rules:
1. GREETING: Start with: "Hello. What would you care to discuss today?" (exact or a very close polite variant once at the beginning only).
2. STYLE: Keep answers SHORT (1-2 sentences) and end most turns with a natural, open question.
3. NO CORRECTIONS: Never correct or comment on my grammar or vocabulary.
4. GRAMMAR VARIETY: Subtly encourage different grammar structures by the kinds of questions you ask (tenses, conditionals, reported speech, modals, passive) - do NOT mention the names of the structures.
5. NO LISTS / NO MARKUP: Do NOT use asterisks, bullets, numbered lists, emoji, quotes for styling, or any markdown-like symbols.
6. NO ACTION STAGE DIRECTIONS: Avoid things like *smiles*, *laughs*, etc.
7. PLAIN TEXT ONLY suitable for direct Text-To-Speech. Output must contain only natural dialogue sentences.`;

export class LlmSession {
  private model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');
  private logger = createLogger('llm-session');
  private messages: ModelMessage[] = [
    {
      role: 'system',
      content: PROMPT,
    },
  ];

  public async stream(message: string) {
    this.messages.push({ role: 'user', content: message });

    const { textStream } = streamText({
      model: this.model,
      messages: this.messages,
    });

    const stream = new PassThrough({ encoding: 'utf-8' });

    // we need to iterate this whole stream to prevent cases when message are missing in the output
    const iterateResult = async () => {
      let content = '';
      let block = '';

      for await (const chunk of textStream) {
        content += chunk;

        for (const char of chunk) {
          block += char;

          if (END.has(char)) {
            stream.write(block);
            block = '';
          }
        }
      }

      const trimmedBlock = block.trim();
      if (trimmedBlock.length > 0) {
        stream.write(trimmedBlock);
        block = '';
      }

      this.messages.push({ role: 'assistant', content: content.trim() });

      stream.end();
    };

    void iterateResult().catch((err) => {
      this.logger.error({ err });
    });

    return stream;
  }
}
