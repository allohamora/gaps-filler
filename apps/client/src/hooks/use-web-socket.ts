import { api } from '@/lib/api';
import type { Message } from '@gaps-filler/api';
import { useRef } from 'react';

type UseWebSocketOptions = {
  onMessage?: (message: Message) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
};

export const useWebSocket = ({ onMessage, onOpen, onClose, onError }: UseWebSocketOptions = {}) => {
  const webSocketRef = useRef<WebSocket>(null);
  const controllerRef = useRef<AbortController>(null);

  const close = async () => {
    if (!webSocketRef.current) {
      return;
    }

    const { promise, resolve } = Promise.withResolvers<void>();

    webSocketRef.current.addEventListener(
      'close',
      () => {
        resolve();
      },
      { signal: controllerRef.current?.signal, once: true },
    );

    webSocketRef.current.close();

    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    webSocketRef.current = null;

    await promise;
  };

  const open = async () => {
    if (webSocketRef.current) {
      await close();
    }

    controllerRef.current = new AbortController();
    webSocketRef.current = api.v1.ws.$ws();

    const { promise, resolve } = Promise.withResolvers<void>();

    webSocketRef.current.addEventListener(
      'open',
      () => {
        onOpen?.();
      },
      { signal: controllerRef.current.signal },
    );

    webSocketRef.current.addEventListener(
      'message',
      (event) => {
        onMessage?.(JSON.parse(event.data));
      },
      { signal: controllerRef.current.signal },
    );

    webSocketRef.current.addEventListener(
      'close',
      (event) => {
        onClose?.(event);
      },
      { signal: controllerRef.current.signal },
    );

    webSocketRef.current.addEventListener(
      'error',
      (event) => {
        onError?.(event);
      },
      { signal: controllerRef.current.signal },
    );

    webSocketRef.current?.addEventListener(
      'open',
      () => {
        resolve();
      },
      { signal: controllerRef.current?.signal, once: true },
    );

    await promise;
  };

  const send = (message: Message) => {
    if (!webSocketRef.current) {
      console.error('WebSocket is not found');
      return;
    }

    if (webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.error(`Cannot send message, WebSocket is not open (state: ${webSocketRef.current.readyState})`);
    }
  };

  return {
    open,
    close,
    send,
  };
};
