import { randomUUID } from 'node:crypto';
import { createLogger } from '../libs/pino.lib.js';
import { CARTESIA_API_KEY, CARTESIA_VERSION } from '../config.js';
import { CartesiaClient, Cartesia } from '@cartesia/cartesia-js';
import { WebSocketTtsRequest } from '@cartesia/cartesia-js/api/index.js';
import { SAMPLE_RATE } from '../constants/audio.constants.js';

type CartesiaVersion = CartesiaClient['_options']['cartesiaVersion'];

const client = new CartesiaClient({
  apiKey: CARTESIA_API_KEY,

  // type issues, support only "2024-06-10"
  cartesiaVersion: CARTESIA_VERSION as CartesiaVersion,
});

export class TextToSpeech {
  private logger = createLogger('text-to-speech');

  private ws = client.tts.websocket({
    container: 'raw',
    encoding: 'pcm_s16le',
    sampleRate: SAMPLE_RATE,
  });

  public init = async () => {
    await this.ws.connect();
  };

  public close = () => {
    this.ws.disconnect();

    this.logger.info({ msg: 'closed' });
  };

  public async *voiceStream(stream: AsyncGenerator<string>) {
    const { value } = await stream.next();
    if (!value) {
      this.logger.error({ msg: 'stream is empty' });
      return;
    }

    const body: WebSocketTtsRequest = {
      modelId: 'sonic-turbo',
      voice: {
        mode: 'id',
        // "Pleasant Man"
        id: '729651dc-c6c3-4ee5-97fa-350da1f88600',
      },
      contextId: randomUUID(),
      transcript: value,
      language: 'en',
      continue: true,
    };

    const res = await this.ws.send(body);

    const handleStream = async () => {
      for await (const transcript of stream) {
        this.ws.continue({ ...body, transcript });
      }
    };

    void handleStream();

    for await (const message of res.events('message')) {
      const event = JSON.parse(message) as Cartesia.WebSocketResponse;

      if (event.type === 'chunk') {
        yield Buffer.from(event.data, 'base64');
      }
    }
  }
}
