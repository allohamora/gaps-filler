import { Link, useRouter } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useState, type FC } from 'react';
import type { SavedMistake } from '@gaps-filler/api';
import { parse } from 'marked';
/// @ts-expect-error not type definitions
import 'github-markdown-css';

type Props = {
  id: string;
  data: SavedMistake;
};

export const MistakePage: FC<Props> = ({ id, data }) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createTask = async () => {
    setIsCreating(true);

    try {
      await api.v1.mistakes[':id'].task.$post({ param: { id } });
      await router.invalidate();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-8 px-4 pb-12 pt-6"
      aria-labelledby="mistake-heading"
    >
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2" aria-label="Back to all mistakes">
          <Link to="/mistakes">← Back</Link>
        </Button>
      </div>

      {data && (
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-rose-400/50 bg-rose-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
                {data.topic || 'Grammar'}
              </span>
            </div>

            <div className="text-sm leading-relaxed">
              <span className="line-through decoration-rose-500/70" aria-label="Incorrect version">
                {data.incorrect}
              </span>{' '}
              <span className="font-medium" aria-label="Correct version">
                → {data.correct}
              </span>
            </div>

            {data.explanation && (
              <p className="text-muted-foreground text-xs leading-snug" aria-label="Short explanation">
                {data.explanation}
              </p>
            )}
          </header>

          {data.task?.summary && (
            <div
              role="region"
              aria-label="Detailed explanation"
              className="markdown-body [&.markdown-body]:bg-inherit! max-w-none space-y-4 px-4 py-3 text-sm leading-relaxed backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: parse(data.task.summary) }}
            />
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={createTask}
              disabled={isCreating}
              aria-busy={isCreating}
              aria-live="polite"
              aria-label={isCreating ? 'Creating in progress' : 'Create task'}
            >
              {isCreating ? 'Creating…' : data.task?.summary ? 'Re-create Task' : 'Create Task'}
            </Button>

            {data.task?.exercises && (
              <Button variant="secondary" disabled={isCreating} asChild>
                <Link to="/mistakes/$id/practice" params={{ id }} aria-label="Practice exercises for this mistake">
                  Practice
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
