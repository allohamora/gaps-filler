import { AddressInfo } from 'node:net';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { NODE_ENV, PORT } from './config.js';
import { createLogger } from './services/logger.service.js';
import { createNodeWebSocket } from '@hono/node-ws';
import { createVoiceChatWsEvents } from './voice-chat/voice-chat.service.js';
import { v1Router } from './routers/v1.router.js';
import { createTextChatWsEvents } from './text-chat/text-chat.service.js';
import { dbService } from './services/db.service.js';

const logger = createLogger('server');

const hono = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: hono });

export const app = hono
  .use(cors())
  .get('/v1/ws/voice-chat', upgradeWebSocket(createVoiceChatWsEvents))
  .get('/v1/ws/text-chat', upgradeWebSocket(createTextChatWsEvents))
  .route('/v1', v1Router);

export const listen = async (port = PORT) => {
  await dbService.init();

  const { promise, resolve } = Promise.withResolvers<AddressInfo>();

  const server = serve({ fetch: app.fetch, port }, (info) => {
    resolve(info);
  });
  injectWebSocket(server);

  await promise;

  logger.info({ msg: 'Server has been started', url: `http://localhost:${port}`, env: NODE_ENV });

  return server;
};
