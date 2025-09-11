import { useMemo, useState, type FC } from 'react';
import type { ChoosingExercise, WritingExercise } from '@gaps-filler/api';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Exercise = { type: 'choosing'; data: ChoosingExercise } | { type: 'writing'; data: WritingExercise };

type Props = {
  id: string;
  choosing: ChoosingExercise[];
  writing: WritingExercise[];
};

const normalize = (str: string) =>
  str
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]$/, '')
    .toLowerCase();

export const PracticePage: FC<Props> = ({ id, choosing, writing }) => {
  const exercises = useMemo(() => {
    const combined: Exercise[] = [];

    for (const item of choosing) {
      const data = { ...item };
      data.options = data.options.toSorted(() => Math.random() - 0.5);

      combined.push({ type: 'choosing', data });
    }

    for (const data of writing) {
      combined.push({ type: 'writing', data });
    }

    return combined;
  }, [choosing, writing]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { correct: boolean; value?: string; skipped?: boolean }>>({});
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(false);

  const total = exercises.length;
  const current = exercises[index];

  const percent = (index / total) * 100;
  const isLast = index === total - 1;
  const completed = Object.keys(answers).length === total;
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;
  const skippedCount = Object.values(answers).filter((answer) => answer.skipped).length;

  const goNext = () => {
    if (isLast) {
      return;
    }

    setIndex((idx) => idx + 1);
    setInput('');
    setRevealed(false);
  };

  const selectOption = (value: string, isCorrect: boolean) => {
    if (answers[index]) return;

    setAnswers((prevAnswers) => ({ ...prevAnswers, [index]: { correct: isCorrect, value } }));
  };

  const checkWriting = () => {
    if (answers[index] || current.type !== 'writing') return;

    const expected = normalize(current.data.answer);
    const actual = normalize(input);

    const isCorrect = expected === actual;
    setAnswers((prevAnswers) => ({ ...prevAnswers, [index]: { correct: isCorrect, value: input } }));
  };

  const reveal = () => setRevealed(true);

  const skipCurrent = () => {
    if (answers[index]) return;
    setAnswers((prevAnswers) => ({ ...prevAnswers, [index]: { correct: false, skipped: true } }));

    if (!isLast) {
      goNext();
    }
  };

  const retry = () => {
    setIndex(0);
    setAnswers({});
    setInput('');
    setRevealed(false);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-12 pt-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2" aria-label="Back to mistake">
          <Link to="/mistakes/$id" params={{ id }}>
            ← Back
          </Link>
        </Button>
        <div className="text-muted-foreground text-xs">Practice</div>
      </div>

      {total === 0 && (
        <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
          No exercises available. Create a task again.
        </div>
      )}

      {total > 0 && !completed && (
        <div className="flex flex-col gap-6" aria-live="polite">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medium tracking-wide">
              <span>
                {index + 1} / {total}
              </span>
              <span className="text-muted-foreground flex gap-2">
                <span>{Math.round((correctCount / total) * 100)}% correct</span>
                {skippedCount > 0 && <span className="opacity-70">• {skippedCount} skipped</span>}
              </span>
            </div>
            <div className="bg-muted/60 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="relative rounded-xl border p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  current.type === 'choosing'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
                )}
              >
                {current.type === 'choosing' ? 'Choosing' : 'Writing'}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  current.data.difficulty === 'easy' &&
                    'border-lime-500/40 bg-lime-500/10 text-lime-600 dark:text-lime-300',
                  current.data.difficulty === 'medium' &&
                    'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300',
                  current.data.difficulty === 'hard' &&
                    'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300',
                )}
              >
                {current.data.difficulty}
              </span>
            </div>

            {current.type === 'choosing' && (
              <div className="flex flex-col gap-5">
                <p className="text-sm leading-relaxed" aria-label="Question">
                  {current.data.question}
                </p>
                <div className="grid gap-3">
                  {current.data.options.map((option) => {
                    const answered = answers[index];
                    const isPicked = answered?.value === option.value;
                    const correct = option.isCorrect;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!!answered}
                        onClick={() => selectOption(option.value, option.isCorrect)}
                        className={cn(
                          'text-left rounded-md border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-90',
                          !answered && 'hover:border-primary/60 hover:bg-primary/5',
                          answered && correct && 'border-emerald-500/70 bg-emerald-500/10',
                          answered && isPicked && !correct && 'border-rose-500/70 bg-rose-500/10',
                        )}
                        aria-pressed={isPicked}
                      >
                        <span className="flex items-start gap-2">
                          <span className="mt-0.5 inline-block size-2 shrink-0 rounded-full border" />
                          <span>{option.value}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {answers[index] && !answers[index]?.skipped && (
                  <div
                    className={cn(
                      'rounded-md border px-3 py-2 text-xs font-medium',
                      answers[index].correct
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300',
                    )}
                    role="status"
                  >
                    {answers[index].correct ? 'Correct!' : 'Incorrect'}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  {!answers[index] && (
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={skipCurrent}
                      aria-label="Skip exercise"
                    >
                      Skip
                    </Button>
                  )}
                  {!isLast && answers[index] && (
                    <Button size="sm" onClick={goNext} aria-label="Next exercise">
                      Next →
                    </Button>
                  )}
                  {isLast && answers[index] && (
                    <Button
                      size="sm"
                      onClick={() => setIndex((prevIndex) => prevIndex)}
                      aria-label="Finish practice"
                      disabled
                    >
                      Finish below ↓
                    </Button>
                  )}
                </div>
              </div>
            )}

            {current.type === 'writing' && (
              <div className="flex flex-col gap-5">
                <p className="text-sm leading-relaxed" aria-label="Task">
                  {current.data.task}
                </p>
                <div className="flex flex-col gap-3">
                  <textarea
                    className="bg-background focus-visible:ring-ring min-h-[90px] w-full resize-y rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-70"
                    placeholder="Type your answer..."
                    value={input}
                    disabled={!!answers[index]}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();

                        if (input.trim()) {
                          checkWriting();
                        }
                      }
                    }}
                    aria-label="Your answer"
                  />
                  {!answers[index] && (
                    <div className="flex justify-between">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={!input.trim()} onClick={checkWriting} aria-label="Check answer">
                          Check
                        </Button>
                        {!revealed && (
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={reveal}
                            aria-label="Reveal answer"
                          >
                            Reveal
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={skipCurrent}
                        aria-label="Skip exercise"
                      >
                        Skip
                      </Button>
                    </div>
                  )}
                </div>

                {(answers[index] || revealed) && !answers[index]?.skipped && (
                  <div className="space-y-2 text-xs">
                    {answers[index] && (
                      <div
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-1 font-medium',
                          answers[index].correct
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300',
                        )}
                        role="status"
                      >
                        {answers[index].correct ? 'Correct!' : 'Not quite'}
                      </div>
                    )}
                    <p>
                      <span className="text-muted-foreground">Answer: </span>
                      <span className="font-medium">{current.data.answer}</span>
                    </p>
                  </div>
                )}

                {answers[index] && (
                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    {isLast ? (
                      <Button
                        size="sm"
                        onClick={() => setIndex((prevIndex) => prevIndex)}
                        aria-label="Finish practice"
                        disabled
                      >
                        Finish below ↓
                      </Button>
                    ) : (
                      <Button size="sm" onClick={goNext} aria-label="Next exercise">
                        Next →
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {completed && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Session Complete</h1>
            <p className="text-muted-foreground text-sm">
              You answered {correctCount} of {total} correctly ({Math.round((correctCount / total) * 100)}%).
            </p>
          </div>
          <div className="grid gap-3 text-xs">
            {exercises.map((exercise, exerciseIndex) => {
              const exerciseAnswer = answers[exerciseIndex];
              return (
                <div
                  key={exerciseIndex}
                  className={cn(
                    'rounded-md border p-3',
                    exerciseAnswer?.skipped
                      ? 'border-muted/40 opacity-70'
                      : exerciseAnswer?.correct
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-muted/40',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold',
                        exerciseAnswer?.skipped
                          ? 'bg-muted text-muted-foreground'
                          : exerciseAnswer?.correct
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
                      )}
                    >
                      {exerciseAnswer?.skipped ? '–' : exerciseAnswer?.correct ? '✓' : '✕'}
                    </span>
                    <span className="font-medium">{exercise.type === 'choosing' ? 'Choosing' : 'Writing'}</span>
                    <span className="text-muted-foreground ml-auto">#{exerciseIndex + 1}</span>
                  </div>
                  <div className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">
                    {exercise.type === 'choosing' ? exercise.data.question : exercise.data.task}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link to="/mistakes/$id" params={{ id }}>
                Back to Mistake
              </Link>
            </Button>
            <Button variant="secondary" onClick={retry}>
              Retry
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};
