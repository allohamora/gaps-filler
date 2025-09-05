import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from './hooks/use-web-socket';
import { useMicrophone } from './hooks/use-microphone';
import { usePlayer } from './hooks/use-player';
import { cn } from '@/lib/utils';
import type { Word } from '@gaps-filler/api';

const getConfidenceColorClass = (confidence: number): string => {
  if (confidence >= 0.9) {
    return 'border-green-600';
  } else if (confidence >= 0.7) {
    return 'border-blue-600';
  } else if (confidence >= 0.5) {
    return 'border-yellow-600';
  } else if (confidence >= 0.3) {
    return 'border-orange-600';
  } else {
    return 'border-red-600';
  }
};

export const VoiceChatPage: FC = () => {
  const [messages, setMessages] = useState<
    ({ id: string; content: string; author: 'ai' } | { id: string; content: Word[]; author: 'user' })[]
  >([]);
  const [isStarted, setIsStarted] = useState(false);

  const { startPlaying, stopPlaying, enqueue } = usePlayer();

  const { open, close, send } = useWebSocket({
    onMessage: (event) => {
      if (event.type === 'transcription') {
        setMessages((prev) => {
          const message = prev.find((m) => m.id === event.data.id);

          if (message) {
            return prev.map((m) =>
              m.id === event.data.id && m.author === 'user'
                ? { ...m, content: [...m.content, ...event.data.chunk] }
                : m,
            );
          }

          return [...prev, { id: event.data.id, content: event.data.chunk, author: 'user' }];
        });
      }

      if (event.type === 'answer') {
        setMessages((prev) => {
          const message = prev.find((m) => m.id === event.data.id);
          const content = event.data.chunk;

          if (message) {
            return prev.map((m) =>
              m.id === event.data.id && m.author === 'ai' ? { ...m, content: `${m.content} ${content}` } : m,
            );
          }

          return [...prev, { id: event.data.id, content, author: 'ai' }];
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
      <div className="block w-full max-w-4xl px-4">
        <div className="mb-6 text-center">
          {isStarted ? <Button onClick={stop}>Stop</Button> : <Button onClick={start}>Start</Button>}
        </div>

        <div className="mb-4 rounded-lg border p-4">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Confidence Levels:</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-block rounded border border-green-600 px-2 py-1">High (90%+)</span>
            <span className="inline-block rounded border border-blue-600 px-2 py-1">Good (70-89%)</span>
            <span className="inline-block rounded border border-yellow-600 px-2 py-1">Medium (50-69%)</span>
            <span className="inline-block rounded border border-orange-600 px-2 py-1">Low (30-49%)</span>
            <span className="inline-block rounded border border-red-600 px-2 py-1">Very Low (&lt;30%)</span>
          </div>
        </div>

        <div className="min-h-32 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={'rounded-lg border p-4'}>
              <div className="mb-2 flex items-center gap-2">
                <div className={'bg-primary size-2 rounded-full'} />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {message.author}
                </span>
              </div>
              <div className={'leading-relaxed'}>
                {message.author === 'ai' ? (
                  <div>{message.content}</div>
                ) : (
                  <div>
                    {message.content.map(({ word, confidence }) => {
                      return (
                        <span
                          key={`${message.id}-${word}-${confidence}`}
                          className={cn(
                            'inline-block px-1 py-0.5 mx-0.5 border-b text-sm',
                            getConfidenceColorClass(confidence),
                          )}
                          title={`Confidence: ${(confidence * 100).toFixed(1)}%`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
