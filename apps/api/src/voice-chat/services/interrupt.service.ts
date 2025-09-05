import { createLogger } from 'src/services/logger.service.js';

export class InterruptError extends Error {
  constructor() {
    super('interrupt error');
  }
}

export type InterruptHandler = {
  isInterrupted: () => boolean;
  ifContinue: <T>(fn: () => T) => T;
  getId: () => number;
  runWithoutInterruptException: <T>(fn: () => T) => Promise<T | null>;
};

const logger = createLogger('interrupt.service');

export const interruptManager = (onInterrupt?: () => void) => {
  let current = 0;

  const interrupt = () => {
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
    const id = ++current;
    const isInterrupted = () => id !== current;
    const ifContinue = <T>(fn: () => T) => {
      if (isInterrupted()) {
        throw new InterruptError();
      }

      return fn();
    };

    return { isInterrupted, ifContinue, runWithoutInterruptException, getId: () => id };
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
