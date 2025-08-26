import { useEffect, useState, type FC } from 'react';
import { Button } from './components/ui/button';
import { api } from './lib/api';

export const App: FC = () => {
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    void (async () => {
      const res = await api.v1['hello-world'].$get();
      const data = await res.json();

      setMessage(data.message);
    })();
  }, []);

  useEffect(() => {
    const ws = api.v1.ws.$ws();
    const controller = new AbortController();

    ws.addEventListener(
      'open',
      () => {
        console.log('WebSocket connection opened');
      },
      { signal: controller.signal },
    );

    return () => {
      ws.close();
      controller.abort();
    };
  }, []);

  return (
    <div className="flex items-center justify-center pt-10">
      <div>
        <Button>test</Button>
        {message && <div>{message}</div>}
      </div>
    </div>
  );
};
