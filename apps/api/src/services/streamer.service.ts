import { scheduler } from 'node:timers/promises';
import { InterruptError } from 'src/utils/interrupt.utils.js';
import { createLogger } from '../libs/pino.lib.js';
import { Message } from '../types/ws.types.js';
import { BYTES_PER_SAMPLE, SAMPLE_RATE } from '../constants/audio.constants.js';

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

class Streamer {
  private logger = createLogger('streamer');

  private async *createVoiceStream(voice: AsyncGenerator<Buffer>) {
    for await (const chunk of voice) {
      yield chunk;
    }
  }

  public setup(sendMessage: (message: Message) => void) {
    let mainStrategy: Strategy = null;
    const fallbackStrategy: Strategy = null;

    const setStrategy = (strategy: Strategy) => {
      if (mainStrategy?.onInterrupt) {
        mainStrategy.onInterrupt();
      }

      mainStrategy = strategy;
    };

    const interrupt = () => {
      this.logger.debug({ msg: 'interrupt' });

      setStrategy(fallbackStrategy);
    };

    const streamVoice = async (voice: AsyncGenerator<Buffer>) => {
      return await new Promise((res, rej) => {
        setStrategy({
          stream: this.createVoiceStream(voice),
          onInterrupt: () => rej(new InterruptError()),
          onSuccess: () => res(null),
        });
      });
    };

    let isSending = true;
    let chunkTime = Date.now();

    const startSending = async () => {
      this.logger.info({ msg: 'start sending' });

      while (isSending) {
        if (mainStrategy === null) {
          chunkTime += STRATEGY_CHECK_DELAY;

          const delay = chunkTime - Date.now();

          if (delay > 0) {
            await scheduler.wait(delay);
          }
          continue;
        }

        const { value, done } = await mainStrategy.stream.next();

        if (done) {
          mainStrategy.onSuccess?.();
          mainStrategy = fallbackStrategy;
          continue;
        }

        const duration = (value.length / BYTES_PER_SAMPLE / SAMPLE_RATE) * 1000;
        const data = value.toString('base64');

        chunkTime += duration;

        const delay = chunkTime - Date.now();

        sendMessage({ type: 'audio', data });

        if (delay > 0) {
          await scheduler.wait(delay);
        }
      }
    };

    const stopSending = () => {
      isSending = false;
    };

    return {
      streamVoice,
      interrupt,
      startSending,
      stopSending,
    };
  }
}

export const streamer = new Streamer();
