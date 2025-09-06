import { type FC, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { TextChatMessage, Mistake } from '@gaps-filler/api';
import { useWebSocket } from '@/hooks/use-web-socket';
import { api } from '@/lib/api';

interface BaseMessage {
  id: string;
  author: 'user' | 'ai';
  createdAt: number;
}
interface UserMessage extends BaseMessage {
  author: 'user';
  content: string;
  mistakes?: Mistake[];
}
interface AIMessage extends BaseMessage {
  author: 'ai';
  content: string;
}

const isWhitespaceOnly = (value: string) => !value.trim();

export const TextChatPage: FC = () => {
  const [messages, setMessages] = useState<Array<UserMessage | AIMessage>>([]);
  const [input, setInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { open, close, send } = useWebSocket<TextChatMessage>({
    onMessage: (event) => {
      if (event.type === 'mistakes') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.data.id && m.author === 'user' ? { ...m, mistakes: event.data.mistakes } : m,
          ),
        );
      }

      if (event.type === 'answer') {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === event.data.id && m.author === 'ai');
          if (exists) {
            return prev.map((m) =>
              m.id === event.data.id && m.author === 'ai' ? { ...m, content: m.content + event.data.chunk } : m,
            );
          }
          return [...prev, { id: event.data.id, author: 'ai', content: event.data.chunk, createdAt: Date.now() }];
        });
      }

      if (event.type === 'result') {
        close();
      }
    },
    onClose: () => {
      stop();
    },
    getClient: () => api.v1.ws['text-chat'].$ws(),
  });

  const start = () => {
    setMessages([]);
    setIsStarted(true);
    open();
  };

  function stop() {
    send({ type: 'finish' });
    close();
    setIsStarted(false);
  }

  const sendMessage = () => {
    if (isWhitespaceOnly(input)) return;
    if (!isStarted) return;
    const id = crypto.randomUUID();
    const content = input.trim();

    // optimistic append user message
    setMessages((prev) => [...prev, { id, author: 'user', content, createdAt: Date.now() }]);
    send({ type: 'input', data: { id, data: content } });
    setInput('');
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-4 px-4 pb-8 pt-6">
      {/* Control Bar */}
      <div className="bg-card/50 supports-[backdrop-filter]:bg-card/40 flex flex-col gap-4 rounded-xl border p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative inline-flex size-3 items-center justify-center rounded-full transition ${isStarted ? 'animate-pulse bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.35)]' : 'bg-muted'}`}
            aria-label={isStarted ? 'Session active' : 'Session inactive'}
          />
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight">Text Chat</h1>
            <p className="text-muted-foreground text-xs">Streaming AI responses & grammar corrections</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStarted ? (
            <button
              onClick={stop}
              className="border-destructive bg-destructive text-destructive-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-semibold shadow-md transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={start}
              className="border-primary bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-semibold shadow-md transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Start Session
            </button>
          )}
        </div>
      </div>

      <div className="group relative flex-1 overflow-hidden rounded-xl border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.04),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.04),transparent_60%)]" />
        <div className="size-full overflow-y-auto scroll-smooth px-3 py-4 pr-2">
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="text-muted-foreground mx-auto mt-10 max-w-md text-center text-sm">
                Start by typing a message below.
              </div>
            )}
            {messages.map((message) => {
              const isAI = message.author === 'ai';
              return (
                <div
                  key={message.id}
                  className={`animate-in fade-in slide-in-from-bottom-1 shadow-xs rounded-xl border p-3 transition-colors md:p-4 ${isAI ? 'bg-secondary/60 dark:bg-secondary/40 ml-0 mr-auto max-w-[80%]' : 'bg-accent/60 dark:bg-accent/30 ml-auto mr-0 max-w-[85%]'}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`size-2 rounded-full ${isAI ? 'bg-primary' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                    />
                    <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                      {message.author}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  {message.author === 'user' && message.mistakes && message.mistakes.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.mistakes.map((m, idx) => (
                        <div
                          key={`${message.id}-mistake-${idx}`}
                          className="rounded-md border border-rose-400/60 bg-rose-50/80 px-2 py-1 text-[11px] shadow-sm md:text-xs dark:border-rose-400/30 dark:bg-rose-500/10"
                        >
                          <div className="font-semibold text-rose-700 dark:text-rose-300">
                            {m.topic || 'Correction'}
                          </div>
                          <div className="mt-0.5">
                            <span className="line-through decoration-rose-500/70">{m.mistake}</span>{' '}
                            <span className="font-medium">→ {m.correct}</span>
                          </div>
                          {m.practice && <div className="text-muted-foreground mt-0.5 opacity-80">{m.practice}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </div>
      </div>

      <div className="bg-card/50 supports-[backdrop-filter]:bg-card/40 rounded-xl border p-4 backdrop-blur">
        <div className="flex flex-col gap-3">
          <textarea
            className="bg-background focus-visible:ring-primary min-h-[90px] w-full resize-y rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!isStarted}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={sendMessage}
              disabled={isWhitespaceOnly(input) || !isStarted}
              className="h-9 px-5 font-semibold shadow-md"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
      <footer className="text-muted-foreground text-center text-[10px]">
        Experimental - streaming answer & real-time corrections.
      </footer>
    </div>
  );
};
