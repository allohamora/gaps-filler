import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/mistakes/$id/practice')({
  loader: async ({ params: { id } }) => {
    const res = await api.v1.mistakes[':id'].$get({ param: { id } });

    const data = await res.json();
    if (!data.task?.exercises) {
      throw new Error('No exercises available for this mistake.');
    }

    return data.task.exercises;
  },
  component: PracticePage,
});

function PracticePage() {
  const { id } = Route.useParams();
  const { choosing, writing } = Route.useLoaderData();

  const [stage, setStage] = useState<'choosing' | 'writing' | 'results'>('choosing');
  const [currentChoosing, setCurrentChoosing] = useState(0);
  const [currentWriting, setCurrentWriting] = useState(0);
  const [answersChoosing, setAnswersChoosing] = useState<Record<number, number>>({});
  const [answersWriting, setAnswersWriting] = useState<Record<number, { value: string; isCorrect: boolean }>>({});
  const ref = useRef<HTMLTextAreaElement>(null);

  // Choosing helpers
  const choosingQuestion = choosing[currentChoosing];
  const choosingAnswered = answersChoosing[currentChoosing] !== undefined;
  const choosingSelectedIdx = answersChoosing[currentChoosing];
  const choosingIsCorrect = choosingAnswered && choosingQuestion?.options[choosingSelectedIdx!].isCorrect;

  const handleSelectChoosing = (idx: number) => {
    if (choosingAnswered) return; // lock answer
    setAnswersChoosing((prev) => ({ ...prev, [currentChoosing]: idx }));
  };

  const nextChoosing = () => {
    if (currentChoosing + 1 < choosing.length) setCurrentChoosing((i) => i + 1);
    else setStage('writing');
  };

  // Writing helpers
  const writingExercise = writing[currentWriting];
  const writingAnswered = answersWriting[currentWriting] !== undefined;
  const writingUserValue = answersWriting[currentWriting]?.value ?? '';
  const writingIsCorrect = answersWriting[currentWriting]?.isCorrect;

  const checkWriting = (value: string) => {
    if (writingAnswered) return;
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/\.$/, '').toLowerCase();
    const isCorrect = normalize(value) === normalize(writingExercise.answer);

    setAnswersWriting((prev) => ({ ...prev, [currentWriting]: { value, isCorrect } }));
  };

  const nextWriting = () => {
    if (currentWriting + 1 < writing.length) {
      setCurrentWriting((i) => i + 1);

      if (ref?.current?.value) {
        ref.current.value = '';
      }
    } else setStage('results');
  };

  const retry = () => {
    setStage('choosing');
    setCurrentChoosing(0);
    setCurrentWriting(0);
    setAnswersChoosing({});
    setAnswersWriting({});
  };

  const choosingScore = Object.entries(answersChoosing).filter(
    ([key, value]) => choosing[Number(key)]?.options[Number(value)].isCorrect,
  ).length;
  const writingScore = Object.values(answersWriting).filter((a) => a.isCorrect).length;
  const totalScore = choosingScore + writingScore;
  const totalQuestions = choosing.length + writing.length;

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

      {stage === 'results' ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Results</h1>
          <div className="rounded-lg border p-6 text-sm">
            <p className="mb-2 font-medium">
              Score: {totalScore} / {totalQuestions} ({choosingScore} MCQ • {writingScore} Writing)
            </p>
            <p className="text-muted-foreground mb-4 text-xs">
              Review your answers. Correct options/answers are highlighted.
            </p>
            <h2 className="mb-2 text-sm font-semibold">Choosing</h2>
            <ul className="mb-6 space-y-4">
              {choosing.map((item, idx) => {
                const picked = answersChoosing[idx];
                return (
                  <li key={idx} className="rounded-md border p-3">
                    <div className="mb-2 text-sm font-medium">{item.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {item.options.map((o, oi) => {
                        const isPicked = picked === oi;
                        return (
                          <span
                            key={oi}
                            className={cn('rounded-md border px-2 py-1', {
                              'border-green-400 bg-green-100 dark:bg-green-500/10': o.isCorrect,
                              'border-rose-400 bg-rose-100 dark:bg-rose-500/10': !o.isCorrect && isPicked,
                              'bg-muted': !o.isCorrect && !isPicked,
                            })}
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
            <h2 className="mb-2 text-sm font-semibold">Writing</h2>
            <ul className="space-y-4">
              {writing.map((item, idx) => {
                const answer = answersWriting[idx];
                return (
                  <li key={idx} className="rounded-md border p-3 text-xs">
                    <div className="mb-2 text-sm font-medium">{item.task}</div>
                    <div className="flex flex-col gap-1">
                      <div
                        className={cn(
                          'rounded-md border px-2 py-1',
                          answer?.isCorrect
                            ? 'border-green-400 bg-green-100 dark:bg-green-500/10'
                            : 'border-rose-400 bg-rose-100 dark:bg-rose-500/10',
                        )}
                      >
                        Your answer: {answer?.value || '—'}
                      </div>
                      {!answer?.isCorrect && (
                        <div className="rounded-md border border-green-400 bg-green-100 px-2 py-1 dark:bg-green-500/10">
                          Correct answer: {item.answer}
                        </div>
                      )}
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
      ) : stage === 'choosing' ? (
        <div className="flex flex-col gap-4">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold">Practice (Choosing)</h1>
            <div className="text-muted-foreground text-xs">
              Question {currentChoosing + 1} of {choosing.length}
            </div>
          </header>
          <div className="rounded-lg border p-5 shadow-sm">
            <div className="mb-4 font-medium">{choosingQuestion.question}</div>
            <ul className="space-y-2">
              {choosingQuestion.options.map((option, idx) => {
                const picked = choosingSelectedIdx === idx;
                const correct = choosingAnswered && option.isCorrect;
                const wrongPick = choosingAnswered && picked && !option.isCorrect;
                return (
                  <li key={idx}>
                    <button
                      onClick={() => handleSelectChoosing(idx)}
                      className={cn(
                        'group w-full rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:opacity-70',
                        {
                          'border-green-500 bg-green-100 dark:bg-green-500/10': correct,
                          'border-rose-500 bg-rose-100 dark:bg-rose-500/10': wrongPick,
                        },
                      )}
                      disabled={choosingAnswered}
                    >
                      <span className="mr-2 font-mono text-xs opacity-70">{String.fromCharCode(65 + idx)}.</span>
                      {option.value}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              {choosingAnswered ? (
                <div className={cn('text-xs font-medium', choosingIsCorrect ? 'text-green-600' : 'text-rose-600')}>
                  {choosingIsCorrect ? 'Correct' : 'Incorrect'}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">Select one answer.</div>
              )}
              <Button size="sm" onClick={nextChoosing} disabled={!choosingAnswered}>
                {currentChoosing + 1 < choosing.length ? 'Next' : 'Start Writing'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold">Practice (Writing)</h1>
            <div className="text-muted-foreground text-xs">
              Exercise {currentWriting + 1} of {writing.length}
            </div>
          </header>
          <div className="rounded-lg border p-5 shadow-sm">
            <div className="mb-4 whitespace-pre-wrap font-medium">{writingExercise.task}</div>
            <div className="space-y-2">
              <textarea
                className="bg-background focus:ring-ring min-h-[120px] w-full rounded-md border p-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-70"
                placeholder="Type your answer here..."
                disabled={writingAnswered}
                defaultValue={writingUserValue}
                ref={ref}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    checkWriting(target.value);
                  }
                }}
                onBlur={() => {
                  // keep content if user clicked elsewhere
                }}
                id="writing-answer"
              />
              <div className="flex items-center justify-between gap-2">
                {writingAnswered ? (
                  <div className={cn('text-xs font-medium', writingIsCorrect ? 'text-green-600' : 'text-rose-600')}>
                    {writingIsCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">Press Cmd/Ctrl+Enter or click Check.</div>
                )}
                {!writingAnswered && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const el = document.getElementById('writing-answer') as HTMLTextAreaElement | null;
                      if (el) {
                        checkWriting(el.value);
                      }
                    }}
                  >
                    Check
                  </Button>
                )}
              </div>
              {writingAnswered && !writingIsCorrect && (
                <div className="text-xs">
                  <span className="font-medium">Correct answer:</span> {writingExercise.answer}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={nextWriting} disabled={!writingAnswered}>
                {currentWriting + 1 < writing.length ? 'Next' : 'Finish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
