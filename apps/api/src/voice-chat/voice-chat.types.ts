import { Mistake } from '../services/chat.service.js';
import { Word } from './services/speech-to-text.service.js';

export type { Word };

export type VoiceChatMessage =
  | {
      type: 'transcription';
      data: {
        id: string;
        chunk: Word[]; // chunk of the message
      };
    }
  | {
      type: 'mistakes';
      data: {
        id: string; // id of the user message
        mistakes: Mistake[];
      };
    }
  | {
      type: 'assistant';
      data: {
        id: string;
        message: string; // full message
      };
    }
  | {
      type: 'audio';
      data: string; // base64 encoded audio data
    };
