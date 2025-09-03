# Gaps Filler Client

The Gaps Filler Client is a Vite-based React application for English education, communicating with the `gaps-filler` API via WebSocket and REST.

## Tech Stack

- **Vite**: Build tool and dev server
- **React 19**: Core library with concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS
- **Shadcn/Ui**: Component library
- **TanStack Router**: Type-safe file-based routing
- **Zod**: Schema validation
- **ESM**: ECMAScript Modules

## Structure & Conventions

- **Directory Structure**:
  ```
  src/
  ├── app.tsx              # Main application component
  ├── main.tsx             # Application entry point
  ├── components/          # UI and page components
  ├── hooks/               # Custom React hooks
  ├── lib/                 # API clients and facades
  ├── routes/              # TanStack Router routes
  ├── utils/               # Utility functions
  └── constants/           # Application constants
  ```
- **Design System**: New UI components must align with the `Shadcn/Ui` style.
- **File Naming**: Follow the `{name}.tsx` convention (e.g., `components/ui/button.tsx`).

## Scripts

- **`dev`**: Start the dev server.
- **`build`**: Build for production.
- **`format`**: Check formatting.
- **`format:fix`**: Fix formatting.
- **`lint`**: Check code quality.
- **`lint:fix`**: Fix linting errors.
- **`csslint`**: Check CSS quality.
- **`csslint:fix`**: Fix CSS linting errors.
