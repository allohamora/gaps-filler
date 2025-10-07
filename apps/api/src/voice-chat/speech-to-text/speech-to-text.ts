export type Word = { word: string; confidence: number };

export type OnTranscriptionOptions = {
  onResult: (transcription: Word[], id: string) => void | Promise<void>;
  onChunk: (transcription: Word[], id: string) => void;
  onText: (transcription: Word[]) => void;
};

export interface SpeechToTextSession {
  close(): Promise<void>;
  init(): Promise<void>;

  onTranscription(options: OnTranscriptionOptions): void;
  transcript(buffer: Buffer): void;
}
