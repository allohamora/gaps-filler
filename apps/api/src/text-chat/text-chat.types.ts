import { Mistake } from '../services/llm.service.js';

export type TextChatMessage =
  | {
      type: 'input';
      data: {
        id: string;
        data: string; // full message
      };
    }
  | {
      type: 'answer';
      data: {
        id: string;
        chunk: string; // chunk of the message
      };
    }
  | {
      type: 'mistakes';
      data: {
        id: string;
        mistakes: Mistake[];
      };
    }
  | {
      type: 'finish';
    }
  | {
      type: 'result';
    };
