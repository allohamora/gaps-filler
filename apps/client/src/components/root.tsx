import { type FC } from 'react';
import { ThemeProvider } from './theme-provider';
import { Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from './ui/sonner';

export const Root: FC = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <nav className="bg-background sticky top-0 z-40 border-b">
        <div className="flex justify-between px-6 py-4 text-sm font-medium md:justify-start md:space-x-6">
          <Link
            to="/"
            activeProps={{ className: 'text-primary font-semibold' }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            to="/voice-chat"
            activeProps={{ className: 'text-primary font-semibold' }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Voice Chat
          </Link>
          <Link
            to="/text-chat"
            activeProps={{ className: 'text-primary font-semibold' }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Text Chat
          </Link>
          <Link
            to="/mistakes"
            activeProps={{ className: 'text-primary font-semibold' }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Mistakes
          </Link>
        </div>
      </nav>

      <main className="flex flex-1">
        <Outlet />
      </main>

      <TanStackRouterDevtools />
      <Toaster />
    </ThemeProvider>
  );
};
