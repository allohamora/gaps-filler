import { Mistake } from '../services/chat.service.js';

export type TextChatMessage =
  | {
      type: 'user';
      data: {
        id: string;
        message: string; // full message
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
      type: 'mistakes';
      data: {
        id: string; // id of the user message
        mistakes: Mistake[];
      };
    };
