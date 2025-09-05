import { scheduler } from 'node:timers/promises';
import { InterruptError } from './interrupt.service.js';
import { createLogger } from 'src/services/logger.service.js';
import { BYTES_PER_SAMPLE, SAMPLE_RATE } from '../voice-chat.constants.js';

const BUFFER_SIZE = 640; // 640 bytes = 320 samples = 20ms of audio at 16kHz
const EXPECTED_DURATION = BUFFER_SIZE / BYTES_PER_SAMPLE / SAMPLE_RATE; // 20ms

const STRATEGY_CHECK_DELAY = EXPECTED_DURATION; // ms

type Stream =
  | AsyncGenerator<Buffer, void, unknown>
  | Generator<Buffer, void, unknown>
  | Generator<Buffer, Buffer, unknown>;

type Strategy = {
  stream: Stream;
  onInterrupt?: () => void;
  onSuccess?: () => void;
} | null;

export class StreamerSession {
  private logger = createLogger('streamer-session');

  private mainStrategy: Strategy = null;
  private fallbackStrategy: Strategy = null;

  private isSending = true;
  private chunkTime = Date.now();

  private async *createVoiceStream(voice: AsyncGenerator<Buffer>) {
    for await (const chunk of voice) {
      yield chunk;
    }
  }

  private setStrategy(strategy: Strategy) {
    if (this.mainStrategy?.onInterrupt) {
      this.mainStrategy.onInterrupt();
    }

    this.mainStrategy = strategy;
  }

  public interrupt() {
    this.logger.debug({ msg: 'interrupt' });

    this.setStrategy(this.fallbackStrategy);
  }

  public streamVoice = async (voice: AsyncGenerator<Buffer>) => {
    return await new Promise((res, rej) => {
      this.setStrategy({
        stream: this.createVoiceStream(voice),
        onInterrupt: () => rej(new InterruptError()),
        onSuccess: () => res(null),
      });
    });
  };

  public async startSending(sendAudio: (audio: string) => void) {
    this.logger.info({ msg: 'start sending' });

    while (this.isSending) {
      if (this.mainStrategy === null) {
        this.chunkTime += STRATEGY_CHECK_DELAY;

        const delay = this.chunkTime - Date.now();

        if (delay > 0) {
          await scheduler.wait(delay);
        }
        continue;
      }

      const { value, done } = await this.mainStrategy.stream.next();

      if (done) {
        this.mainStrategy.onSuccess?.();
        this.mainStrategy = this.fallbackStrategy;
        continue;
      }

      const duration = (value.length / BYTES_PER_SAMPLE / SAMPLE_RATE) * 1000;
      const data = value.toString('base64');

      this.chunkTime += duration;

      const delay = this.chunkTime - Date.now();

      sendAudio(data);

      if (delay > 0) {
        await scheduler.wait(delay);
      }
    }
  }

  public stopSending() {
    this.isSending = false;
  }
}
