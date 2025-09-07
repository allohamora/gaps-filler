import { createFileRoute } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/mistakes/')({
  loader: async () => {
    const res = await api.v1.mistakes.$get();

    return await res.json();
  },
  component: MistakesPage,
});

function MistakesPage() {
  const mistakes = Route.useLoaderData();

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
        {mistakes.length > 0 && (
          <div className="grid max-h-full grid-cols-1 gap-4 overflow-y-auto p-2 md:grid-cols-2 lg:grid-cols-3">
            {mistakes.map(({ id, topic, mistake, correct, practice }, idx) => {
              return (
                <Link
                  key={id}
                  className="animate-in fade-in slide-in-from-bottom-1 bg-card/60 flex flex-col gap-2 rounded-lg border p-3 text-sm shadow-sm backdrop-blur"
                  to="/mistakes/$id"
                  params={{ id }}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md border border-rose-400/50 bg-rose-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
                      {topic}
                    </span>
                    <span className="text-muted-foreground text-[10px] opacity-70">#{mistakes.length - idx}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    <span className="line-through decoration-rose-500/70">{mistake}</span>{' '}
                    <span className="font-medium">→ {correct}</span>
                  </div>
                  <div className="text-muted-foreground text-[11px] leading-snug opacity-80">{practice}</div>
                </Link>
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
}
