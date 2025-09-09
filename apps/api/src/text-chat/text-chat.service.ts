import { randomUUID } from 'node:crypto';
import { createLogger } from 'src/services/logger.service.js';
import { ChatSession } from '../services/chat.service.js';
import { TextChatMessage } from 'src/export.js';
import { WSContext, WSEvents } from 'hono/ws';

class TextChatSession {
  private logger = createLogger('text-chat-session');

  private chat = new ChatSession();

  private ws?: WSContext<WebSocket>;

  private sendMessage(message: TextChatMessage) {
    this.ws?.send(JSON.stringify(message));
  }

  private open(ws: WSContext<WebSocket>) {
    this.ws = ws;

    this.logger.info({ msg: 'opened' });
  }

  private close() {
    this.logger.info({ msg: 'closed' });
  }

  private async handleInput({ id, data }: { id: string; data: string }) {
    const { answer, mistakes } = await this.chat.send(data);

    if (mistakes?.length) {
      this.sendMessage({ type: 'mistakes', data: { id, mistakes } });
    }

    this.sendMessage({ type: 'answer', data: { id: randomUUID(), chunk: answer } });
  }

  private async handleMessage(event: MessageEvent) {
    const message: TextChatMessage = JSON.parse(event.data.toString());

    if (message.type === 'input') {
      await this.handleInput(message.data);
    }

    if (message.type === 'finish') {
      this.sendMessage({ type: 'result' });
    }
  }

  public toWsEvents(): WSEvents<WebSocket> {
    return {
      onOpen: (_, socket) => {
        this.open(socket);
      },
      onClose: () => {
        this.close();
      },
      onMessage: async (message) => {
        await this.handleMessage(message);
      },
    };
  }
}

export const createTextChatWsEvents = async () => {
  return new TextChatSession().toWsEvents();
};
