import { type FC } from 'react';
import { Feature } from './feature';
import { Link } from '@tanstack/react-router';

export const LandingPage: FC = () => {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-4 text-center">
        <h1 className="from-foreground to-foreground/60 bg-gradient-to-b bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
          Close Your Speaking & Writing Gaps in Real Time
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed md:text-lg">
          Gaps Filler is an AI-powered language practice platform for both voice and text. Speak or type and get live
          transcription or inline writing feedback, confidence & hesitation cues, grammar and usage insights, and an
          adaptive AI partner that responds-and even speaks back-with low-latency streaming.
        </p>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xs leading-relaxed md:text-sm">
          Every error becomes a coached improvement: pronunciation, wording, structure, fluency, tone, clarity. Practice
          continuously without breaking flow.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/voice-chat"
            className="bg-primary text-primary-foreground focus:ring-primary/50 inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold shadow transition hover:brightness-110 focus:outline-none focus:ring-2"
          >
            Try Voice Chat
          </Link>
        </div>
      </header>
      <section className="grid gap-6 md:grid-cols-3">
        <Feature
          title="Voice Chat"
          description="Speak naturally; get live transcription confidence cues & immediate usage/grammar insights."
        />
        <Feature
          title="Text Chat"
          description="Practice writing; receive inline corrections, tone guidance, and clearer phrasing suggestions."
        />
        <Feature
          title="Mistake Fixer"
          description="Instant rewrites with explanations & better alternatives so errors turn into progress."
        />
      </section>
    </div>
  );
};
