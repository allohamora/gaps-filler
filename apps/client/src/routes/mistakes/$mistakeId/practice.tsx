import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { AnalyzableMistake, Question } from '@gaps-filler/api';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const Route = createFileRoute('/mistakes/$mistakeId/practice')({
  component: PracticePage,
});

function PracticePage() {
  const { mistakeId } = Route.useParams();
  const { data, isLoading, isError, error } = useQuery<AnalyzableMistake, Error>({
    queryKey: ['mistake', mistakeId],
    queryFn: async () => {
      const res: Response = await api.v1.mistakes[':mistakeId'].$get({ param: { mistakeId } });
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      return (await res.json()) as AnalyzableMistake;
    },
  });

  const questions: Question[] = data?.questions || [];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const q = questions[current];
  const answered = answers[current] !== undefined;
  const selectedIdx = answers[current];
  const isCorrect = answered && q?.options[selectedIdx].isCorrect;

  const handleSelect = (idx: number) => {
    if (answered) return; // lock answer
    setAnswers((a) => ({ ...a, [current]: idx }));
  };

  const next = () => {
    if (current + 1 < questions.length) setCurrent((c) => c + 1);
    else setShowResults(true);
  };

  const score = Object.entries(answers).filter(([k, v]) => questions[Number(k)]?.options[Number(v)].isCorrect).length;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col gap-6 px-4 pb-10 pt-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/mistakes/$mistakeId" params={{ mistakeId }}>
            ← Back
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/mistakes/$mistakeId" params={{ mistakeId }}>
            Article
          </Link>
        </Button>
      </div>
      {isLoading && <div className="text-muted-foreground text-sm">Loading…</div>}
      {isError && <div className="text-sm text-rose-500">{error?.message}</div>}
      {data && questions.length === 0 && (
        <div className="text-muted-foreground text-sm">No questions generated yet. Analyze the mistake first.</div>
      )}
      {data && questions.length > 0 && !showResults && q && (
        <div className="flex flex-col gap-4">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold">Practice</h1>
            <div className="text-muted-foreground text-xs">
              Question {current + 1} of {questions.length}
            </div>
          </header>
          <div className="rounded-lg border p-5 shadow-sm">
            <div className="mb-4 font-medium">{q.question}</div>
            <ul className="space-y-2">
              {q.options.map((o, idx) => {
                const picked = selectedIdx === idx;
                const correct = answered && o.isCorrect;
                const wrongPick = answered && picked && !o.isCorrect;
                return (
                  <li key={idx}>
                    <button
                      onClick={() => handleSelect(idx)}
                      className="group w-full rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:opacity-70"
                      disabled={answered}
                      data-state={picked ? 'picked' : undefined}
                      style={
                        correct
                          ? { background: 'hsl(var(--success) / 0.15)', borderColor: 'hsl(var(--success))' }
                          : wrongPick
                            ? { background: 'hsl(var(--destructive) / 0.15)', borderColor: 'hsl(var(--destructive))' }
                            : picked
                              ? { background: 'hsl(var(--accent) / 0.3)' }
                              : undefined
                      }
                    >
                      <span className="mr-2 font-mono text-xs opacity-70">{String.fromCharCode(65 + idx)}.</span>
                      {o.value}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              {answered ? (
                <div className={`text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-rose-600'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">Select one answer.</div>
              )}
              <Button size="sm" onClick={next} disabled={!answered}>
                {current + 1 < questions.length ? 'Next' : 'Finish'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showResults && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Results</h1>
          <div className="rounded-lg border p-6 text-sm">
            <p className="mb-2 font-medium">
              Score: {score} / {questions.length}
            </p>
            <p className="text-muted-foreground mb-4 text-xs">Review answers below. Correct options are highlighted.</p>
            <ul className="space-y-4">
              {questions.map((q, qi) => {
                const picked = answers[qi];
                return (
                  <li key={qi} className="rounded-md border p-3">
                    <div className="mb-2 text-sm font-medium">{q.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {q.options.map((o, oi) => {
                        const isPicked = picked === oi;
                        return (
                          <span
                            key={oi}
                            className={`rounded-md border px-2 py-1 ${o.isCorrect ? 'border-green-400 bg-green-100 dark:bg-green-500/10' : isPicked ? 'border-rose-400 bg-rose-100 dark:bg-rose-500/10' : 'bg-muted'}`}
                          >
                            {String.fromCharCode(65 + oi)}. {o.value}
                          </span>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setCurrent(0);
                  setAnswers({});
                  setShowResults(false);
                }}
              >
                Retry
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/mistakes">Done</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
