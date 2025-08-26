import { randomUUID } from 'node:crypto';
import { createLogger } from 'src/libs/pino.lib.js';
import { SpeechToText } from 'src/libs/speech-to-text.lib.js';
import { TextToSpeech } from 'src/libs/text-to-speech.lib.js';
import { Chat } from 'src/libs/chat.lib.js';
import { Message } from 'src/export.js';
import { interruptManager } from 'src/utils/interrupt.utils.js';
import { streamer } from './streamer.service.js';
import { WSContext, WSEvents } from 'hono/ws';

export const createWsEvents = async () => {
  const sessionId = randomUUID();

  const logger = createLogger(`ws-connection--${sessionId}`);

  logger.info({ msg: 'connection was opened' });

  const stt = new SpeechToText();
  await stt.init();

  const tts = new TextToSpeech();
  await tts.init?.();

  const chat = new Chat();

  let ws: WSContext<WebSocket> | undefined;

  const sendMessage = (message: Message) => ws?.send(JSON.stringify(message));
  const { startSending, stopSending, streamVoice, interrupt } = streamer.setup(sendMessage);

  return {
    onOpen: (_, socket) => {
      ws = socket;

      const manager = interruptManager(() => interrupt());

      void startSending();

      stt.onTranscription({
        onResult: async (data) => {
          await manager.withHandler(async (handler) => {
            const res = await handler.ifContinue(async () => await chat.stream(data));

            async function* streamWithTranscription() {
              const id = randomUUID();

              for await (const content of res) {
                sendMessage({ type: 'text', data: { id, content, role: 'assistant' } });

                yield content;
              }
            }

            await handler.ifContinue(async () => await streamVoice(tts.voiceStream(streamWithTranscription())));
          });
        },
        onChunk: (transcript, id) => {
          sendMessage({ type: 'text', data: { id, content: transcript, role: 'user' } });
        },
        onText: () => {
          manager.interrupt();
        },
      });
    },
    onClose: async () => {
      await stt.close();
      tts.close?.();
      stopSending();
      logger.info({ msg: 'connection was closed' });
    },
    onMessage: async (message) => {
      const event: Message = JSON.parse(message.data.toString());

      if (event.type === 'audio') {
        stt.transcript(Buffer.from(event.data, 'base64'));
      }

      if (event.type === 'finish') {
        sendMessage({ type: 'result' });
      }
    },
  } as WSEvents<WebSocket>;
};
