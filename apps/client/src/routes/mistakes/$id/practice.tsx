import { createFileRoute } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { PracticePage } from '@/mistake/pages/practice.page';

export const Route = createFileRoute('/mistakes/$id/practice')({
  loader: async ({ params: { id } }) => {
    const res = await api.v1.mistakes[':id'].$get({ param: { id } });

    const data = await res.json();
    if (!data.task?.exercises) {
      throw new Error('No exercises available for this mistake.');
    }

    return data.task.exercises;
  },
  component: () => {
    const { id } = Route.useParams();
    const { writing, choosing } = Route.useLoaderData();

    return <PracticePage id={id} choosing={choosing} writing={writing} />;
  },
});
