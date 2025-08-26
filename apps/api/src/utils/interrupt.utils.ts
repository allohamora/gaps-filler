import { createLogger } from '../libs/pino.lib.js';

export class InterruptError extends Error {
  constructor() {
    super('interrupt error');
  }
}

export type InterruptHandler = {
  isInterrupted: () => boolean;
  ifContinue: <T>(fn: () => T) => T;
  getId: () => number;
  block: () => void;
  runWithoutInterruptException: <T>(fn: () => T) => Promise<T | null>;
};

const logger = createLogger('interrupt.utils');

export const interruptManager = (onInterrupt?: () => void) => {
  let isBlocked = false;
  let current = 0;

  const interrupt = () => {
    if (isBlocked) {
      return;
    }

    current++;

    onInterrupt?.();
  };

  const runWithoutInterruptException = async <T>(fn: () => T): Promise<T | null> => {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof InterruptError) {
        logger.debug({ err });

        return null;
      }

      throw err;
    }
  };

  const handler = (): InterruptHandler => {
    const id = isBlocked ? -1 : ++current;
    const isInterrupted = () => id !== current;
    const ifContinue = <T>(fn: () => T) => {
      if (isInterrupted()) {
        throw new InterruptError();
      }

      return fn();
    };

    const block = () => (isBlocked = true);

    return { isInterrupted, ifContinue, block, runWithoutInterruptException, getId: () => id };
  };

  const withHandler = async <T>(fn: (handler: InterruptHandler) => T): Promise<T | null> => {
    return await runWithoutInterruptException(async () => await fn(handler()));
  };

  return {
    interrupt,
    handler,
    withHandler,
  };
};
