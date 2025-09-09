import { createFileRoute } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { MistakePage } from '@/mistake/mistake.page';

export const Route = createFileRoute('/mistakes/$id/')({
  loader: async ({ params: { id } }) => {
    const res = await api.v1.mistakes[':id'].$get({ param: { id } });

    if (res.status === 404) {
      throw new Error('Not Found');
    }

    return await res.json();
  },
  component: () => {
    const { id } = Route.useParams();
    const data = Route.useLoaderData();

    return <MistakePage id={id} data={data} />;
  },
});
