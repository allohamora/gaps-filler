import { createFileRoute } from '@tanstack/react-router';
import { MistakesPage } from '@/mistakes/mistakes.page';

export const Route = createFileRoute('/mistakes')({
  component: MistakesPage,
});
