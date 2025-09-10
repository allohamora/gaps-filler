import { type FC } from 'react';
import { Feature } from './feature';

export const LandingPage: FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-4 text-center">
        <h1 className="from-foreground to-foreground/60 bg-gradient-to-b bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
          Close Your Speaking & Writing Gaps in Real Time
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed md:text-lg">
          Gaps Filler is a real‑time mistake detection & improvement platform for voice and text. Speak for live
          transcription with confidence cues, or write for inline corrections. Each mistake from the chat can be saved
          for future fixing and reinforcement through targeted exercises.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Feature
          title="Voice Chat"
          description="Speak naturally; get live transcription confidence cues & immediate usage/grammar insights."
          to="/voice-chat"
        />
        <Feature
          title="Text Chat"
          description="Practice writing; receive inline corrections, tone guidance, and clearer phrasing suggestions."
          to="/text-chat"
        />
        <Feature
          title="Mistake Fixer"
          description="Fix mistakes; get a concise summary, then reinforce them through targeted exercises."
          to="/mistakes"
        />
      </section>
    </div>
  );
};
