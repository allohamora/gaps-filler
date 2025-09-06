import { createFileRoute } from '@tanstack/react-router';
import { MistakesPage } from '@/mistake/mistake.page';

export const Route = createFileRoute('/mistakes/')({
  component: MistakesPage,
});
