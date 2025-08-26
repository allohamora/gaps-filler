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

  const close = () => {
    if (!webSocketRef.current) {
      return;
    }

    webSocketRef.current.close();

    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    webSocketRef.current = null;
  };

  const open = () => {
    if (webSocketRef.current) {
      close();
    }

    controllerRef.current = new AbortController();
    webSocketRef.current = api.v1.ws.$ws();

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
