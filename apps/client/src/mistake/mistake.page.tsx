import { type FC, useState } from 'react';
import type { AnalyzableMistake } from '@gaps-filler/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export const MistakesPage: FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery<AnalyzableMistake[], Error>({
    queryKey: ['mistakes'],
    queryFn: async () => {
      const res: Response = await api.v1.mistakes.$get();
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return (await res.json()) as AnalyzableMistake[];
    },
  });
  const mistakes = (data ?? []).slice().reverse();

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (mistakeId: string) => {
      const res: Response = await api.v1.mistakes.analyze.$post({ json: { mistakeId } });
      if (!res.ok) throw new Error('Failed to analyze');
      return (await res.json()) as AnalyzableMistake;
    },
    onMutate: (mistakeId) => {
      setAnalyzingId(mistakeId);
    },
    onSettled: () => {
      setAnalyzingId(null);
    },
    onSuccess: (updated) => {
      // Update cache
      queryClient.setQueryData<AnalyzableMistake[]>(['mistakes'], (old) => {
        if (!old) return [updated];
        return old.map((m) => (m.id === updated.id ? updated : m));
      });
    },
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Mistakes</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Recent grammar corrections captured during your sessions.
        </p>
        <p className="text-muted-foreground text-xs opacity-70">
          (List updates when you navigate back here or reload.)
        </p>
      </header>

      <div className="relative flex-1 overflow-hidden rounded-xl border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.04),transparent_65%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_65%)]" />
        {isLoading && (
          <div className="text-muted-foreground flex h-full items-center justify-center p-10 text-sm">
            Loading mistakes…
          </div>
        )}
        {!isLoading && isError && (
          <div className="flex h-full items-center justify-center p-10 text-center text-sm text-rose-500">
            Failed to load mistakes
            <br />
            <span className="text-xs opacity-75">{error?.message}</span>
          </div>
        )}
        {!isLoading && !isError && mistakes.length === 0 && (
          <div className="text-muted-foreground flex h-full items-center justify-center p-10 text-center text-sm">
            No mistakes have been logged yet. Start a session to generate feedback.
          </div>
        )}
        {!isLoading && !isError && mistakes.length > 0 && (
          <div className="grid max-h-full grid-cols-1 gap-4 overflow-y-auto p-2 md:grid-cols-2 lg:grid-cols-3">
            {mistakes.map((m, idx) => {
              const isAnalyzing = analyzingId === m.id && analyzeMutation.isPending;
              const analyzed = Boolean(m.article);
              return (
                <div
                  key={m.id || `${idx}-${m.mistake}-${m.correct}`}
                  className="animate-in fade-in slide-in-from-bottom-1 bg-card/60 flex flex-col gap-2 rounded-lg border p-3 text-sm shadow-sm backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md border border-rose-400/50 bg-rose-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
                      {m.topic || 'Grammar'}
                    </span>
                    <span className="text-muted-foreground text-[10px] opacity-70">#{mistakes.length - idx}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    <span className="line-through decoration-rose-500/70">{m.mistake}</span>{' '}
                    <span className="font-medium">→ {m.correct}</span>
                  </div>
                  {m.practice && (
                    <div className="text-muted-foreground text-[11px] leading-snug opacity-80">{m.practice}</div>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {!analyzed && (
                      <Button size="sm" disabled={isAnalyzing} onClick={() => analyzeMutation.mutate(m.id as string)}>
                        {isAnalyzing ? 'Analyzing…' : 'Analyze'}
                      </Button>
                    )}
                    {analyzed && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/mistakes/$mistakeId" params={{ mistakeId: m.id as string }}>
                          View
                        </Link>
                      </Button>
                    )}
                  </div>
                  {isAnalyzing && (
                    <div className="text-muted-foreground animate-pulse text-[10px]">
                      Generating article & questions…
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <footer className="text-muted-foreground text-center text-[10px]">
        Mistakes persist per server run (JSON). Future: accounts & spaced review.
      </footer>
    </div>
  );
};
