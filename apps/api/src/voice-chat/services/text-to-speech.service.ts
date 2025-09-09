import { DEEPGRAM_API_KEY } from 'src/config.js';
import { SAMPLE_RATE } from '../voice-chat.constants.js';
import { createClient } from '@deepgram/sdk';

const client = createClient(DEEPGRAM_API_KEY);

export class TextToSpeechSession {
  public async *voice(text: string) {
    const res = await client.speak.request(
      { text },
      {
        container: 'none',
        model: 'aura-2-thalia-en',
        encoding: 'linear16',
        sample_rate: SAMPLE_RATE,
      },
    );

    const response = await res.getStream();
    if (!response) {
      throw new Error('no response from Deepgram TTS');
    }

    for await (const chunk of response) {
      yield Buffer.from(chunk);
    }
  }
}
