import { useState, useRef, useEffect, type FC } from 'react';
import { Save as SaveIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMicrophone } from './hooks/use-microphone';
import { usePlayer } from './hooks/use-player';
import { cn } from '@/lib/utils';
import type { Word, Mistake, VoiceChatMessage } from '@gaps-filler/api';
import { useWebSocket } from '@/hooks/use-web-socket';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const getConfidenceColorClass = (confidence: number): string => {
  if (confidence >= 0.9) return 'bg-green-100 dark:bg-green-500/15 border-green-600 text-green-800 dark:text-green-300';
  if (confidence >= 0.7) return 'bg-blue-100 dark:bg-blue-500/15 border-blue-600 text-blue-800 dark:text-blue-300';
  if (confidence >= 0.5)
    return 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-600 text-yellow-800 dark:text-yellow-300';
  if (confidence >= 0.3)
    return 'bg-orange-100 dark:bg-orange-500/20 border-orange-600 text-orange-800 dark:text-orange-300';
  return 'bg-red-100 dark:bg-red-500/15 border-red-600 text-red-800 dark:text-red-300';
};

type UserMessage = {
  id: string;
  type: 'user';
  content: Word[];
};

type AiMessage = {
  id: string;
  type: 'ai';
  content: string;
};

type MistakeMessage = {
  id: string;
  type: 'mistake';
  isSaved?: boolean;
} & Mistake;

export const VoiceChatPage: FC = () => {
  const [messages, setMessages] = useState<Array<UserMessage | AiMessage | MistakeMessage>>([]);
  const [isStarted, setIsStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { startPlaying, stopPlaying, enqueue } = usePlayer();

  const { open, close, send } = useWebSocket<VoiceChatMessage>({
    onMessage: (event) => {
      if (event.type === 'transcription') {
        setMessages((prev) => {
          return [...prev, { id: event.data.id, content: event.data.chunk, type: 'user' }];
        });
      }

      if (event.type === 'mistakes') {
        const messages: MistakeMessage[] = event.data.mistakes.map((mistake) => ({
          id: crypto.randomUUID(),
          type: 'mistake',
          ...mistake,
        }));

        setMessages((prev) => [...prev, ...messages]);
      }

      if (event.type === 'assistant') {
        setMessages((prev) => {
          return [...prev, { id: event.data.id, content: event.data.message, type: 'ai' }];
        });
      }

      if (event.type === 'audio') {
        enqueue(event.data);
      }
    },
    onClose: async () => {
      await stop();
    },
    getClient: () => api.v1.ws['voice-chat'].$ws(),
  });

  const { startListening, stopListening } = useMicrophone({
    onData: (data) => {
      send({ type: 'audio', data });
    },
  });

  const start = async () => {
    open();
    await startListening();
    await startPlaying();
    setIsStarted(true);
    setMessages([]);
  };

  async function stop() {
    await stopPlaying();
    await stopListening();
    setIsStarted(false);
    close();
  }

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-6">
      <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative inline-flex size-3 items-center justify-center rounded-full transition',
              isStarted ? 'bg-green-500 animate-pulse shadow-[0_0_0_4px_rgba(34,197,94,0.35)]' : 'bg-muted',
            )}
            aria-label={isStarted ? 'Session active' : 'Session inactive'}
          />
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight">Voice Chat</h1>
            <p className="text-muted-foreground text-xs">Real-time AI conversation & grammar corrections</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {isStarted ? (
            <Button
              onClick={stop}
              variant="destructive"
              className="h-10 px-6 font-semibold shadow-md transition hover:scale-[1.02]"
            >
              Stop
            </Button>
          ) : (
            <Button onClick={start} className="h-10 px-6 font-semibold shadow-md transition hover:scale-[1.02]">
              Start Session
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
        <span className="text-muted-foreground mr-1 font-medium">Confidence:</span>
        <span className="rounded-md border border-green-600 bg-green-100 px-2 py-0.5 dark:bg-green-500/15">
          High ≥90%
        </span>
        <span className="rounded-md border border-blue-600 bg-blue-100 px-2 py-0.5 dark:bg-blue-500/15">
          Good 70-89%
        </span>
        <span className="rounded-md border border-yellow-600 bg-yellow-100 px-2 py-0.5 dark:bg-yellow-500/20">
          Med 50-69%
        </span>
        <span className="rounded-md border border-orange-600 bg-orange-100 px-2 py-0.5 dark:bg-orange-500/20">
          Low 30-49%
        </span>
        <span className="rounded-md border border-red-600 bg-red-100 px-2 py-0.5 dark:bg-red-500/15">Very &lt;30%</span>
      </div>

      <div className="group relative flex-1 overflow-hidden">
        <div className="size-full overflow-y-auto scroll-smooth px-3 py-2 pb-40 pr-2">
          <div className="flex flex-col gap-4 pt-2">
            {messages.length === 0 && (
              <div className="text-muted-foreground m-10 mx-auto max-w-md text-center text-sm">
                {isStarted
                  ? 'Listening… start speaking to see transcription.'
                  : 'Press Start Session to begin real-time voice chat.'}
              </div>
            )}
            {messages.map((message) => {
              if (message.type === 'user') {
                return (
                  <div
                    key={message.id}
                    className="animate-in fade-in slide-in-from-bottom-1 ml-auto mr-0 max-w-[85%] rounded-xl border p-3 transition-colors md:p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="size-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
                        User
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed">
                      <span className="flex flex-wrap">
                        {message.content.map(({ word, confidence }) => (
                          <span
                            key={`${message.id}-${word}-${confidence}`}
                            className={cn(
                              'mx-0.5 mb-1 inline-flex select-text items-center rounded-md border px-1.5 py-0.5 font-medium leading-tight shadow-sm backdrop-blur transition hover:brightness-110',
                              'text-[11px] md:text-xs',
                              getConfidenceColorClass(confidence),
                            )}
                            title={`Confidence: ${(confidence * 100).toFixed(1)}%`}
                          >
                            {word}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                );
              }

              if (message.type === 'ai') {
                return (
                  <div
                    key={message.id}
                    className="animate-in fade-in slide-in-from-bottom-1 ml-0 mr-auto max-w-[80%] rounded-xl border p-3 transition-colors md:p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="size-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        AI Assistant
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  </div>
                );
              }

              if (message.type === 'mistake') {
                return (
                  <div
                    key={message.id}
                    className="animate-in fade-in slide-in-from-bottom-1 ml-auto mr-0 max-w-[85%] rounded-xl border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">
                          {message.topic}
                        </span>
                      </div>
                      {message.isSaved ? (
                        <div className="flex size-6 items-center justify-center">
                          <Check className="size-3 text-emerald-500" />
                        </div>
                      ) : (
                        <Button
                          onClick={async () => {
                            try {
                              const res = await api.v1.mistakes.$post({
                                json: { mistake: message },
                              });
                              if (res.ok) {
                                toast.success('Saved');
                                setMessages((prev) =>
                                  prev.map((msg) => (msg.id === message.id ? { ...msg, isSaved: true } : msg)),
                                );
                              } else {
                                toast.error('Failed');
                              }
                            } catch {
                              toast.error('Error');
                            }
                          }}
                          aria-label="Save mistake"
                          title="Save mistake"
                          variant="ghost"
                          size="sm"
                          className="size-6 p-0"
                        >
                          <SaveIcon className="size-3" />
                        </Button>
                      )}
                    </div>

                    <div className="mb-2 text-sm">
                      <span className="line-through decoration-rose-500/70">{message.incorrect}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="font-medium">{message.correct}</span>
                    </div>

                    {message.explanation && <div className="text-muted-foreground text-xs">{message.explanation}</div>}
                  </div>
                );
              }

              const exhaustiveCheck: never = message;
              console.error('Unknown message type:', exhaustiveCheck);

              return null;
            })}
            <div ref={scrollRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
