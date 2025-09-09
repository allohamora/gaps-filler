import { createFileRoute } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { MistakesPage } from '@/mistake/pages/mistakes.page';

export const Route = createFileRoute('/mistakes/')({
  loader: async () => {
    const res = await api.v1.mistakes.$get();

    return await res.json();
  },
  component: () => {
    const mistakes = Route.useLoaderData();

    return <MistakesPage mistakes={mistakes} />;
  },
});
