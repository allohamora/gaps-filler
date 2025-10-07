import { AssemblyAI } from 'assemblyai';
import { createLogger } from 'src/services/logger.service.js';
import { randomUUID } from 'node:crypto';
import { SAMPLE_RATE } from '../voice-chat.constants.js';
import { ASSEMBLY_AI_API_KEY } from 'src/config.js';

export type Word = { word: string; confidence: number };

export type OnTranscriptionOptions = {
  onResult: (transcription: Word[], id: string) => void | Promise<void>;
  onChunk: (transcription: Word[], id: string) => void;
  onText: (transcription: Word[]) => void;
};

const client = new AssemblyAI({ apiKey: ASSEMBLY_AI_API_KEY });

export class AssemblyAiSpeechToTextSession {
  private logger = createLogger('assembly-ai-speech-to-text-session');

  private transcriber = client.streaming.transcriber({
    sampleRate: SAMPLE_RATE,
    encoding: 'pcm_s16le',
    formatTurns: true,
  });

  private isReady = false;

  public async init() {
    this.transcriber.on('open', ({ id }) => {
      this.logger.info({ msg: 'session opened', id });
    });

    this.transcriber.on('error', (err) => {
      this.logger.error({ err, msg: 'transcriber error' });
    });

    this.transcriber.on('close', (code, reason) => {
      this.logger.info({ msg: 'transcriber closed', code, reason });
    });

    await this.transcriber.connect();

    this.isReady = true;

    this.logger.info({ msg: 'initialized' });
  }

  public async close() {
    await this.transcriber.close();

    this.isReady = false;

    this.logger.info({ msg: 'closed' });
  }

  public transcript(buffer: Buffer) {
    // we can receive audio before we can handle it
    if (this.isReady) {
      this.transcriber.sendAudio(buffer.buffer);
    }
  }

  public onTranscription({ onResult, onChunk, onText }: OnTranscriptionOptions) {
    this.transcriber.on('turn', (turn) => {
      const transcription = turn?.words
        ?.filter(({ word_is_final }) => word_is_final)
        ?.map(({ text, confidence }) => ({ word: text, confidence }));
      onText(transcription);

      if (transcription?.length && turn.end_of_turn && turn.turn_is_formatted) {
        const id = randomUUID();

        onChunk(transcription, id);
        onResult(transcription, id);
      }
    });
  }
}
