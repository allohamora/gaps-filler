import { useState, type FC } from 'react';
import { Button } from './components/ui/button';
import { useWebSocket } from './hooks/use-web-socket';
import { useMicrophone } from './hooks/use-microphone';
import { usePlayer } from './hooks/use-player';
import type { TextMessageChunk } from '@gaps-filler/api';

export const App: FC = () => {
  const [messages, setMessages] = useState<TextMessageChunk[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  const { startPlaying, stopPlaying, enqueue } = usePlayer();

  const { open, close, send } = useWebSocket({
    onMessage: (event) => {
      if (event.type === 'text') {
        setMessages((prev) => {
          const message = prev.find((m) => m.id === event.data.id);
          if (message) {
            return prev.map((m) =>
              m.id === event.data.id ? { ...m, content: `${m.content} ${event.data.content}` } : m,
            );
          }

          return [...prev, event.data];
        });
      }

      if (event.type === 'audio') {
        enqueue(event.data);
      }

      if (event.type === 'result') {
        close();
      }
    },
    onClose: async () => {
      await stopWithoutClose();
    },
  });

  const { startListening, stopListening } = useMicrophone({
    onData: (data) => {
      send({ type: 'audio', data });
    },
  });

  const start = async () => {
    await open();
    await startListening();
    await startPlaying();
    setIsStarted(true);
    setMessages([]);
  };

  async function stopWithoutClose() {
    await stopPlaying();
    await stopListening();
    setIsStarted(false);
  }

  const stop = async () => {
    await stopWithoutClose();
    send({ type: 'finish' });
    await close();
  };

  return (
    <div className="flex items-center justify-center pt-10">
      <div className="block">
        <div>{isStarted ? <Button onClick={stop}>stop</Button> : <Button onClick={start}>start</Button>}</div>
        <code>{JSON.stringify(messages, null, 2)}</code>
      </div>
    </div>
  );
};
