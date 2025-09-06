import { ThemeProvider } from '@/components/theme-provider';
import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark">
      <div className="flex min-h-screen min-w-full flex-col">
        <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
          <div className="container flex h-14 items-center px-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/favicon.svg" alt="Gaps Filler Logo" className="size-6" />
              <span className="font-bold">Gaps Filler</span>
            </Link>
            <div className="ml-8 flex items-center gap-6 text-sm font-medium">
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
          </div>
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
      <Toaster />
    </ThemeProvider>
  ),
});
