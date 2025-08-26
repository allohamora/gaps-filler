import type { FC } from 'react';
import { Button } from './components/ui/button';

export const App: FC = () => {
  return (
    <div className="flex items-center justify-center pt-10">
      <div>
        <Button>test</Button>
        <div>Hello world!</div>
      </div>
    </div>
  );
};
