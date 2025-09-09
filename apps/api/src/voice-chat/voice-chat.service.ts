import { randomUUID } from 'node:crypto';
import { createLogger } from 'src/services/logger.service.js';
import { SpeechToTextSession } from './services/speech-to-text.service.js';
import { ChatSession } from '../services/chat.service.js';
import { StreamerSession } from './services/streamer.service.js';
import { interruptManager } from './services/interrupt.service.js';
import { WSContext, WSEvents } from 'hono/ws';
import { TextToSpeechSession } from './services/text-to-speech.service.js';
import { VoiceChatMessage } from './voice-chat.types.js';

class VoiceChatSession {
  private logger = createLogger('voice-chat-session');

  private stt = new SpeechToTextSession();
  private tts = new TextToSpeechSession();
  private chat = new ChatSession();
  private streamer = new StreamerSession();

  private ws?: WSContext<WebSocket>;

  private manager = interruptManager(() => this.streamer.interrupt());

  private sendMessage(message: VoiceChatMessage) {
    this.ws?.send(JSON.stringify(message));
  }

  private async open(ws: WSContext<WebSocket>) {
    await this.stt.init();

    this.ws = ws;

    void this.streamer.startSending((data) => this.sendMessage({ type: 'audio', data }));

    this.stt.onTranscription({
      onResult: async (data, id) => {
        const transcription = data
          .map(({ word }) => word)
          .join(' ')
          .trim();

        await this.manager.withHandler(async (handler) => {
          const { answer, mistakes } = await handler.ifContinue(async () => await this.chat.send(transcription));

          if (mistakes?.length) {
            this.sendMessage({ type: 'mistakes', data: { id, mistakes } });
          }

          this.sendMessage({ type: 'assistant', data: { id: randomUUID(), message: answer } });

          await handler.ifContinue(async () => await this.streamer.streamVoice(this.tts.voice(answer)));
        });
      },
      onChunk: (chunk, id) => {
        this.sendMessage({ type: 'transcription', data: { id, chunk } });
      },
      onText: () => {
        this.manager.interrupt();
      },
    });

    this.logger.info({ msg: 'opened' });
  }

  private async close() {
    await this.stt.close();
    this.streamer.stopSending();

    this.logger.info({ msg: 'closed' });
  }

  private handleMessage(event: MessageEvent) {
    const message: VoiceChatMessage = JSON.parse(event.data.toString());

    if (message.type === 'audio') {
      this.stt.transcript(Buffer.from(message.data, 'base64'));
    }
  }

  public toWsEvents(): WSEvents<WebSocket> {
    return {
      onOpen: async (_, socket) => {
        await this.open(socket);
      },
      onClose: async () => {
        await this.close();
      },
      onMessage: (message) => {
        this.handleMessage(message);
      },
    };
  }
}

export const createVoiceChatWsEvents = async () => {
  return new VoiceChatSession().toWsEvents();
};
