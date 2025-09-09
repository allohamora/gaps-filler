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
  // Tints + border to improve quick visual parsing; keeps accessible contrast.
  if (confidence >= 0.9) return 'bg-green-100 dark:bg-green-500/15 border-green-600 text-green-800 dark:text-green-300';
  if (confidence >= 0.7) return 'bg-blue-100 dark:bg-blue-500/15 border-blue-600 text-blue-800 dark:text-blue-300';
  if (confidence >= 0.5)
    return 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-600 text-yellow-800 dark:text-yellow-300';
  if (confidence >= 0.3)
    return 'bg-orange-100 dark:bg-orange-500/20 border-orange-600 text-orange-800 dark:text-orange-300';
  return 'bg-red-100 dark:bg-red-500/15 border-red-600 text-red-800 dark:text-red-300';
};

export const VoiceChatPage: FC = () => {
  const [messages, setMessages] = useState<
    (
      | { id: string; content: string; author: 'ai' }
      | { id: string; content: Word[]; author: 'user'; mistakes?: Mistake[]; savedMistakes?: number[] }
    )[]
  >([]);
  const [isStarted, setIsStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { startPlaying, stopPlaying, enqueue } = usePlayer();

  const { open, close, send } = useWebSocket<VoiceChatMessage>({
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

      if (event.type === 'mistakes') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.data.id && m.author === 'user' ? { ...m, mistakes: event.data.mistakes } : m,
          ),
        );
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
    send({ type: 'finish' });
    close();
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-6">
      {/* Control Bar */}
      <div className="bg-card/50 supports-[backdrop-filter]:bg-card/40 flex flex-col gap-4 rounded-xl border p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
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
            <p className="text-muted-foreground text-xs">Real-time transcription + AI responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Legend */}
      <div className="bg-card/30 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs">
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

      {/* Messages */}
      <div className="group relative flex-1 overflow-hidden rounded-xl border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.04),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.04),transparent_60%)]" />
        <div className="size-full overflow-y-auto scroll-smooth px-3 py-4 pr-2">
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-muted-foreground mx-auto mt-10 max-w-md text-center text-sm">
                {isStarted
                  ? 'Listening… start speaking to see transcription.'
                  : 'Press Start Session to begin real-time voice chat.'}
              </div>
            )}
            {messages.map((message) => {
              const isAI = message.author === 'ai';
              return (
                <div
                  key={message.id}
                  className={cn(
                    'animate-in fade-in slide-in-from-bottom-1 rounded-xl border p-3 shadow-xs transition-colors md:p-4',
                    isAI
                      ? 'ml-0 mr-auto max-w-[80%] bg-secondary/60 dark:bg-secondary/40'
                      : 'mr-0 ml-auto max-w-[85%] bg-accent/60 dark:bg-accent/30',
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={cn(
                        'size-2 rounded-full',
                        isAI ? 'bg-primary' : 'bg-gradient-to-r from-blue-500 to-cyan-500',
                      )}
                    />
                    <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                      {message.author}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed">
                    {isAI ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <div className="flex flex-col gap-2">
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
                        {!!message.mistakes?.length && (
                          <div className="mt-1 space-y-2">
                            {message.mistakes.map((m, idx) => {
                              const isSaved = message.savedMistakes?.includes(idx);
                              return (
                                <div
                                  key={`${message.id}-mistake-${idx}`}
                                  className="group/mistake rounded-md border border-rose-400/60 bg-rose-50/80 p-2 text-[11px] shadow-sm md:text-xs dark:border-rose-400/30 dark:bg-rose-500/10"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="font-semibold text-rose-700 dark:text-rose-300">
                                        {m.topic || 'Grammar issue'}
                                      </div>
                                      <div className="mt-0.5">
                                        <span className="line-through decoration-rose-500/70">{m.incorrect}</span>{' '}
                                        <span className="font-medium">→ {m.correct}</span>
                                      </div>
                                      {m.explanation && (
                                        <div className="text-muted-foreground mt-0.5 opacity-80">{m.explanation}</div>
                                      )}
                                    </div>
                                    <div className="flex items-center pl-2 pt-0.5">
                                      {isSaved ? (
                                        <Button
                                          asChild
                                          className="size-6 opacity-100"
                                          aria-label="Saved"
                                          title="Saved"
                                          variant="outline"
                                        >
                                          <span>
                                            <Check className="size-3" />
                                          </span>
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={async () => {
                                            try {
                                              const res = await api.v1.mistakes.$post({
                                                json: { mistakes: [m] as Mistake[] },
                                              });
                                              if (res.ok) {
                                                toast.success('Saved');
                                                setMessages((prev) =>
                                                  prev.map((msg) =>
                                                    msg.id === message.id && msg.author === 'user'
                                                      ? {
                                                          ...msg,
                                                          savedMistakes: [...(msg.savedMistakes || []), idx],
                                                        }
                                                      : msg,
                                                  ),
                                                );
                                              } else {
                                                toast.error('Failed');
                                              }
                                            } catch {
                                              toast.error('Error');
                                            }
                                          }}
                                          disabled={isSaved}
                                          aria-label="Save mistake"
                                          title="Save mistake"
                                          className="focus-visible:ring-ring border-primary/50 bg-background/70 text-primary hover:bg-primary/10 inline-flex size-6 items-center justify-center rounded border backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-60"
                                        >
                                          <SaveIcon className="size-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </div>
      </div>
      <footer className="text-muted-foreground text-center text-[10px]">
        Experimental - transcription chunks stream live; AI response assembles progressively.
      </footer>
    </div>
  );
};
