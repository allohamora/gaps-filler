import { AddressInfo } from 'node:net';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { v1Router } from './routers/v1.router.js';
import { serve } from '@hono/node-server';
import { NODE_ENV, PORT } from './config.js';
import { createLogger } from './libs/pino.lib.js';
import { createNodeWebSocket } from '@hono/node-ws';

const logger = createLogger('server');

const hono = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: hono });

export const app = hono
  .use(cors())
  .get(
    '/v1/ws',
    upgradeWebSocket(() => {
      return {
        onMessage: (event) => {
          console.log(event.data);
        },
        onClose: () => {
          console.log('closed');
        },
        onError: (event) => {
          console.error(event);
        },
        onOpen: () => {
          console.log('open');
        },
      };
    }),
  )
  .route('/v1', v1Router);

export const listen = async (port = PORT) => {
  const { promise, resolve } = Promise.withResolvers<AddressInfo>();

  const server = serve({ fetch: app.fetch, port }, (info) => {
    resolve(info);
  });
  injectWebSocket(server);

  await promise;

  logger.info({ msg: 'Server has been started', url: `http://localhost:${port}`, env: NODE_ENV });

  return server;
};
