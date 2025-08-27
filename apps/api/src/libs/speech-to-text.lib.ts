import { createClient, LiveTranscriptionEvent, LiveTranscriptionEvents } from '@deepgram/sdk';
import { once } from 'node:events';
import { createLogger } from '../libs/pino.lib.js';
import { randomUUID } from 'node:crypto';
import { CHANNELS, SAMPLE_RATE } from '../constants/audio.constants.js';
import { DEEPGRAM_API_KEY } from 'src/config.js';

export type OnTranscriptionOptions = {
  onResult: (transcription: string, id: string) => void | Promise<void>;
  onChunk: (chunk: string, id: string) => void;
  onText: (chunk: string) => void;
};

const KEEP_ALIVE_INTERVAL = 10 * 1000;

const client = createClient(DEEPGRAM_API_KEY);

export class SpeechToText {
  private logger = createLogger('speech-to-text');

  private live = client.listen.live({
    // https://developers.deepgram.com/docs/model
    // https://developers.deepgram.com/docs/models-languages-overview
    model: 'nova-3',

    interim_results: true,
    utterance_end_ms: 1000,

    // https://developers.deepgram.com/docs/smart-format
    // with smart formatting we receive the long load number as date time or something and its' not possible to receive the load number
    punctuate: true,
    no_delay: true,
    endpointing: 300,

    encoding: 'linear16',
    channels: CHANNELS,
    sample_rate: SAMPLE_RATE,

    language: 'en',
  });

  private keepAliveInterval?: NodeJS.Timeout;

  private onClose = async () => {
    await this.close();
  };

  public async init() {
    await once(this.live, LiveTranscriptionEvents.Open);

    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      this.live.keepAlive();
    }, KEEP_ALIVE_INTERVAL);

    this.live.addListener(LiveTranscriptionEvents.Close, this.onClose);
  }

  public async close() {
    clearInterval(this.keepAliveInterval);

    this.live.requestClose();
    this.live.removeAllListeners();
  }

  public transcript(buffer: Buffer) {
    this.live.send(new Blob([buffer as BlobPart]));
  }

  // https://developers.deepgram.com/docs/understanding-end-of-speech-detection#using-utteranceend-and-endpointing
  public onTranscription({ onResult, onChunk, onText }: OnTranscriptionOptions) {
    let chunks: string[] = [];
    let id: string = randomUUID();

    const getTranscription = () => {
      const transcription = chunks.join(' ').trim();
      chunks = [];

      return transcription;
    };

    const sendTranscription = () => {
      // can be ''
      const transcription = getTranscription();

      if (!id) {
        this.logger.error('No request id');
        return;
      }

      if (transcription) {
        onResult(transcription, id);
      }

      id = randomUUID();
    };

    const onUtteranceEnd = () => {
      this.logger.info('[utterance-end]');

      const isIgnored = !chunks.length;

      // https://github.com/nikolawhallon/temp-utterance-end?tab=readme-ov-file#using-both
      // https://github.com/orgs/deepgram/discussions/980
      if (isIgnored) {
        return;
      }

      sendTranscription();
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { transcript } = data.channel.alternatives[0] || {};
      const { is_final, speech_final } = data;

      console.log({ transcript, is_final, speech_final });

      if (transcript) {
        onText(transcript);
      }

      if (transcript && is_final) {
        onChunk(transcript, id);
        chunks.push(transcript);
      }

      if (speech_final) {
        sendTranscription();
      }
    };

    this.live.on(LiveTranscriptionEvents.Transcript, onTranscript);
    this.live.on(LiveTranscriptionEvents.UtteranceEnd, onUtteranceEnd);
  }
}
