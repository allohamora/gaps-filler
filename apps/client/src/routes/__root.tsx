import { ThemeProvider } from '@/components/theme-provider';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark">
      <div className="flex min-h-screen min-w-full flex-col">
        <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
          <div className="container flex h-14 items-center px-4">
            <a href="/" className="flex items-center space-x-2">
              <img src="/favicon.svg" alt="Gaps Filler Logo" className="size-6" />
              <span className="font-bold">Gaps Filler</span>
            </a>
          </div>
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
});
