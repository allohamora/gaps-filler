import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from './hooks/use-web-socket';
import { useMicrophone } from './hooks/use-microphone';
import { usePlayer } from './hooks/use-player';

export const VoiceChatPage: FC = () => {
  const [messages, setMessages] = useState<{ id: string; content: string }[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  const { startPlaying, stopPlaying, enqueue } = usePlayer();

  const { open, close, send } = useWebSocket({
    onMessage: (event) => {
      if (event.type === 'transcription') {
        setMessages((prev) => {
          const message = prev.find((m) => m.id === event.data.id);
          const content = event.data.chunk
            .map(({ word, confidence }) => `<span title="${confidence}">${word}</span>`)
            .join('<span> </span>');

          if (message) {
            return prev.map((m) => (m.id === event.data.id ? { ...m, content: `${m.content} ${content}` } : m));
          }

          return [...prev, { id: event.data.id, content }];
        });
      }

      if (event.type === 'answer') {
        setMessages((prev) => {
          const message = prev.find((m) => m.id === event.data.id);
          const content = event.data.chunk;

          if (message) {
            return prev.map((m) => (m.id === event.data.id ? { ...m, content: `${m.content} ${content}` } : m));
          }

          return [...prev, { id: event.data.id, content }];
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
        <div dangerouslySetInnerHTML={{ __html: messages.map(({ content }) => `<div>${content}</div>`).join('') }} />
      </div>
    </div>
  );
};
