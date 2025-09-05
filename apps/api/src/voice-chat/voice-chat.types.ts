export type TextMessageChunk = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
};

export type Message =
  | {
      type: 'text';
      data: TextMessageChunk; // chunk of the message
    }
  | {
      type: 'audio';
      data: string; // base64 encoded audio data
    }
  | {
      type: 'finish';
    }
  | {
      type: 'result';
    };
