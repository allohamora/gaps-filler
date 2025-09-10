import { type FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save as SaveIcon, Check, ArrowUp } from 'lucide-react';
import type { TextChatMessage, Mistake } from '@gaps-filler/api';
import { useWebSocket } from '@/hooks/use-web-socket';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type UserMessage = {
  id: string;
  type: 'user';
  content: string;
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

export const TextChatPage: FC = () => {
  const [messages, setMessages] = useState<Array<UserMessage | AiMessage | MistakeMessage>>([]);
  const [input, setInput] = useState('');

  const { open, close, send } = useWebSocket<TextChatMessage>({
    onMessage: (event) => {
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
          return [...prev, { id: crypto.randomUUID(), type: 'ai', content: event.data.message }];
        });
      }
    },
    getClient: () => api.v1.ws['text-chat'].$ws(),
  });

  const sendMessage = () => {
    const id = crypto.randomUUID();
    const content = input.trim();

    setMessages((prev) => [...prev, { id, type: 'user', content }]);
    send({ type: 'user', data: { id, message: content } });
    setInput('');
  };

  useEffect(() => {
    open();

    return () => close();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-6">
      <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight">Text Chat</h1>
            <p className="text-muted-foreground text-xs">Real-time AI conversation & grammar corrections</p>
          </div>
        </div>
      </div>

      <div className="group relative flex-1 overflow-hidden">
        <div className="size-full overflow-y-auto scroll-smooth px-3 py-2 pb-40 pr-2">
          <div className="flex flex-col gap-4 pt-2">
            {messages.length === 0 && (
              <div className="text-muted-foreground m-10 mx-auto max-w-md text-center text-sm">
                Start by typing a message below.
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
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
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
          </div>
        </div>
      </div>

      <div className="bg-background sticky inset-x-0 bottom-0 mx-auto w-full max-w-5xl pb-4 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="bg-background flex items-end gap-2 rounded-md border p-2 shadow-sm"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            name="message"
            className="w-full resize-none p-2 text-sm outline-none"
            placeholder="Type your message..."
          />
          <Button type="submit" disabled={!input.trim()} aria-label="Send message" className="size-9">
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
