import { randomUUID } from 'node:crypto';
import { createLogger } from 'src/services/logger.service.js';
import { SpeechToTextSession } from './services/speech-to-text.service.js';
import { TextToSpeechSession } from './services/text-to-speech.service.js';
import { LlmSession } from './services/llm.service.js';
import { StreamerSession } from './services/streamer.service.js';
import { Message } from 'src/export.js';
import { interruptManager } from './services/interrupt.service.js';
import { WSContext, WSEvents } from 'hono/ws';

class VoiceChatSession {
  private logger = createLogger('voice-chat-session');

  private stt = new SpeechToTextSession();
  private tts = new TextToSpeechSession();
  private llm = new LlmSession();
  private streamer = new StreamerSession();

  private ws?: WSContext<WebSocket>;

  private manager = interruptManager(() => this.streamer.interrupt());

  private sendMessage(message: Message) {
    this.ws?.send(JSON.stringify(message));
  }

  private async open(ws: WSContext<WebSocket>) {
    await this.stt.init();
    await this.tts.init?.();

    this.ws = ws;

    void this.streamer.startSending((data) => this.sendMessage({ type: 'audio', data }));

    this.stt.onTranscription({
      onResult: async (data) => {
        await this.manager.withHandler(async (handler) => {
          const res = await handler.ifContinue(async () => await this.llm.stream(data));
          const sendMessage = this.sendMessage.bind(this);

          async function* streamWithTranscription() {
            const id = randomUUID();

            for await (const content of res) {
              sendMessage({ type: 'text', data: { id, content, role: 'assistant' } });

              yield content;
            }
          }

          await handler.ifContinue(
            async () => await this.streamer.streamVoice(this.tts.voiceStream(streamWithTranscription())),
          );
        });
      },
      onChunk: (transcript, id) => {
        this.sendMessage({ type: 'text', data: { id, content: transcript, role: 'user' } });
      },
      onText: () => {
        this.manager.interrupt();
      },
    });

    this.logger.info({ msg: 'opened' });
  }

  private async close() {
    await this.stt.close();
    this.tts.close?.();
    this.streamer.stopSending();

    this.logger.info({ msg: 'closed' });
  }

  private handleMessage(event: MessageEvent) {
    const message: Message = JSON.parse(event.data.toString());

    if (message.type === 'audio') {
      this.stt.transcript(Buffer.from(message.data, 'base64'));
    }

    if (message.type === 'finish') {
      this.sendMessage({ type: 'result' });
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

export const createWsEvents = async () => {
  return new VoiceChatSession().toWsEvents();
};
