export interface TextToSpeechStrategy {
  init?: () => Promise<void>;
  close?: () => void;
  voiceStream: (stream: AsyncGenerator<string>) => AsyncGenerator<Buffer>;
  voice: (text: string) => AsyncGenerator<Buffer>;
}
