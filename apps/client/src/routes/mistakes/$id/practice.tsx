import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/mistakes/$id/practice')({
  loader: async ({ params: { id } }) => {
    const res = await api.v1.mistakes[':id'].$get({ param: { id } });

    if (res.status === 404) {
      throw new Error('Not Found');
    }

    const { questions } = await res.json();

    if (!questions) {
      throw new Error('No questions found');
    }

    return questions;
  },
  component: PracticePage,
});

function PracticePage() {
  const { id } = Route.useParams();
  const questions = Route.useLoaderData();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const question = questions[current];
  const answered = answers[current] !== undefined;
  const selectedIdx = answers[current];
  const isCorrect = answered && question?.options[selectedIdx].isCorrect;

  const handleSelect = (idx: number) => {
    if (answered) return; // lock answer
    setAnswers((item) => ({ ...item, [current]: idx }));
  };

  const next = () => {
    if (current + 1 < questions.length) setCurrent((idx) => idx + 1);
    else setShowResults(true);
  };

  const retry = () => {
    setCurrent(0);
    setAnswers({});
    setShowResults(false);
  };

  const score = Object.entries(answers).filter(
    ([key, value]) => questions[Number(key)]?.options[Number(value)].isCorrect,
  ).length;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col gap-6 px-4 pb-10 pt-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/mistakes/$id" params={{ id }}>
            ← Back
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/mistakes/$id" params={{ id }}>
            Article
          </Link>
        </Button>
      </div>

      {showResults ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Results</h1>
          <div className="rounded-lg border p-6 text-sm">
            <p className="mb-2 font-medium">
              Score: {score} / {questions.length}
            </p>
            <p className="text-muted-foreground mb-4 text-xs">Review answers below. Correct options are highlighted.</p>
            <ul className="space-y-4">
              {questions.map((item, idx) => {
                const picked = answers[idx];

                return (
                  <li key={idx} className="rounded-md border p-3">
                    <div className="mb-2 text-sm font-medium">{item.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {item.options.map((o, oi) => {
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
              <Button size="sm" onClick={retry}>
                Retry
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/mistakes">Done</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold">Practice</h1>
            <div className="text-muted-foreground text-xs">
              Question {current + 1} of {questions.length}
            </div>
          </header>
          <div className="rounded-lg border p-5 shadow-sm">
            <div className="mb-4 font-medium">{question.question}</div>
            <ul className="space-y-2">
              {question.options.map((option, idx) => {
                const picked = selectedIdx === idx;
                const correct = answered && option.isCorrect;
                const wrongPick = answered && picked && !option.isCorrect;

                return (
                  <li key={idx}>
                    <button
                      onClick={() => handleSelect(idx)}
                      className={cn(
                        'group w-full rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:opacity-70',
                        {
                          'border-green-500 bg-green-100 dark:bg-green-500/10': correct,
                          'border-rose-500 bg-rose-100 dark:bg-rose-500/10': wrongPick,
                        },
                      )}
                      disabled={answered}
                    >
                      <span className="mr-2 font-mono text-xs opacity-70">{String.fromCharCode(65 + idx)}.</span>
                      {option.value}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              {answered ? (
                <div className={`text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-rose-600'}`}>
                  {isCorrect ? 'Correct' : 'Incorrect'}
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
    </div>
  );
}
