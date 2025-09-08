import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { parse } from 'marked';
/// @ts-expect-error not type definitions
import 'github-markdown-css';

export const Route = createFileRoute('/mistakes/$id/')({
  loader: async ({ params: { id } }) => {
    const res = await api.v1.mistakes[':id'].$get({ param: { id } });

    if (res.status === 404) {
      throw new Error('Not Found');
    }

    return await res.json();
  },
  component: MistakeDetailPage,
});

function MistakeDetailPage() {
  const { id } = Route.useParams();
  const data = Route.useLoaderData();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async () => {
    setIsAnalyzing(true);

    await api.v1.mistakes[':id'].analyze.$post({ param: { id } });
    await router.invalidate();

    setIsAnalyzing(false);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/mistakes">← Back</Link>
        </Button>
      </div>
      {data && (
        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Mistake Explanation</h1>
            <p className="text-muted-foreground text-sm">
              <span className="line-through decoration-rose-500/70">{data.incorrect}</span>{' '}
              <span className="font-medium">→ {data.correct}</span>
            </p>
            <div className="text-muted-foreground text-xs">Topic: {data.topic || 'Grammar'}</div>
            <div className="text-muted-foreground text-xs">
              Explanation: {data.explanation || 'No explanation available.'}
            </div>
          </header>
          {data.summary && (
            <article
              className="prose prose-sm dark:prose-invert markdown-body [&.markdown-body]:bg-inherit! max-w-none"
              dangerouslySetInnerHTML={{ __html: parse(data.summary) }}
            />
          )}
          <div className="flex justify-between">
            <Button onClick={analyze} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>

            {data.exercises && (
              <Button variant="secondary" disabled={isAnalyzing} asChild>
                <Link to="/mistakes/$id/practice" disabled={isAnalyzing} params={{ id }}>
                  Practice
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
