import { useRef } from 'react';

type UseWebSocketOptions<T> = {
  onMessage?: (message: T) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  getClient: () => WebSocket;
};

export const useWebSocket = <T>({ onMessage, onOpen, onClose, onError, getClient }: UseWebSocketOptions<T>) => {
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
    controllerRef.current = new AbortController();
    webSocketRef.current = getClient();

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

  const send = (message: T) => {
    if (!webSocketRef.current) {
      console.error(new Error('WebSocket is not found'));
      return;
    }

    if (webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message, WebSocket is not open (state: ${webSocketRef.current.readyState})`);
    }
  };

  return {
    open,
    close,
    send,
  };
};
