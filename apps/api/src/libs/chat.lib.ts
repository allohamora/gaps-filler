import { streamText, ModelMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GEMINI_API_KEY } from '../config.js';
import { PassThrough } from 'stream';
import { createLogger } from '../libs/pino.lib.js';

const END = new Set(['.', '!', '?', ',', ';', ':']);

export class Chat {
  private model = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })('gemini-2.5-flash');
  private logger = createLogger('chat');
  private messages: ModelMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant',
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
