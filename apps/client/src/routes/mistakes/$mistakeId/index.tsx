import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { AnalyzableMistake } from '@gaps-filler/api';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { parse } from 'marked';
/// @ts-expect-error not type definitions
import 'github-markdown-css';

export const Route = createFileRoute('/mistakes/$mistakeId/')({
  component: MistakeDetailPage,
});

function MistakeDetailPage() {
  const { mistakeId } = Route.useParams();

  const { data, isLoading, isError, error } = useQuery<AnalyzableMistake, Error>({
    queryKey: ['mistake', mistakeId],
    queryFn: async () => {
      const res: Response = await api.v1.mistakes[':mistakeId'].$get({ param: { mistakeId } });
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      return (await res.json()) as AnalyzableMistake;
    },
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/mistakes">← Back</Link>
        </Button>
      </div>
      {isLoading && <div className="text-muted-foreground text-sm">Loading…</div>}
      {isError && (
        <div className="text-sm text-rose-500">
          Failed to load
          <div className="text-xs opacity-70">{error?.message}</div>
        </div>
      )}
      {data && (
        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Mistake Explanation</h1>
            <p className="text-muted-foreground text-sm">
              <span className="line-through decoration-rose-500/70">{data.mistake}</span>{' '}
              <span className="font-medium">→ {data.correct}</span>
            </p>
            <div className="text-muted-foreground text-xs">Topic: {data.topic || 'Grammar'}</div>
          </header>
          {!data.article && (
            <div className="text-muted-foreground text-sm">No analysis yet. Go back and run Analyze.</div>
          )}
          {data.article && (
            <article
              className="prose prose-sm dark:prose-invert markdown-body [&.markdown-body]:bg-inherit! max-w-none"
              dangerouslySetInnerHTML={{ __html: parse(data.article) }}
            />
          )}
          {data.questions && data.questions.length > 0 && (
            <div>
              <Button asChild>
                <Link to="/mistakes/$mistakeId/practice" params={{ mistakeId }}>
                  Practice
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
