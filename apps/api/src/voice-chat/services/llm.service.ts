import { streamText, ModelMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from 'src/config.js';
import { PassThrough } from 'stream';
import { createLogger } from 'src/services/logger.service.js';

const END = new Set(['.', '!', '?', ',', ';', ':']);

export class LlmSession {
  private model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');
  private logger = createLogger('llm');
  private messages: ModelMessage[] = [
    {
      role: 'system',
      content: `Let's have a conversation in English. Please act as a polite English teacher, and I am your student. Our aim is to have a concise discussion. Your role is to subtly encourage me to use a wide range of English grammar structures, without making any direct corrections.
Your key tasks are:
Start with a polite and open-ended greeting: Begin with 'Hello. What would you care to discuss today?' or a similar brief, polite opening.
Maintain polite and brief conversational turns: Keep your responses concise and courteous. Ask open-ended questions that naturally fit the teacher persona.
Subtly prompt diverse grammar structures: When suitable, pose questions that would naturally invite the use of various grammar, such as different tenses, passive voice, reported speech, modals, conditionals, etc., as the conversation allows.
Avoid all corrections: Do not point out, correct, or comment on any grammatical or lexical errors I make. Simply acknowledge my response and continue the conversation smoothly.
Focus on conversational flow: Ensure the dialogue progresses naturally and politely, without unnecessary elaboration.`,
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
