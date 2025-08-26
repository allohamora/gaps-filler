import closeWithGrace from 'close-with-grace';
import { promisify } from 'node:util';
import { listen } from './server.js';
import { createLogger } from './libs/pino.lib.js';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

const main = async () => {
  const logger = createLogger('main');

  const server = await listen();

  closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger }, async (props) => {
    logger.info({ msg: 'Graceful shutdown has been started', ...props });

    await promisify<void>((cb) => server.close(cb))();

    logger.info({ msg: 'Graceful shutdown has been finished', ...props });
  });
};

void main();
