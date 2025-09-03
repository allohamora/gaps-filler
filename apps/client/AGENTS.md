# Gaps Filler Client

This guide covers the architecture, components, and restrictions of the Gaps Filler Client application.

## Overview

The Gaps Filler Client is a Vite-based React application that provides a web interface for English education services. The main goal of this client is to provide a user interface useful for English education based on WebSocket and REST API communication with the gaps-filler API.

## Architecture

### Core Framework

- **Vite**: Modern build tool and dev server
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **TanStack Router**: Type-safe routing with file-based routing
- **Zod**: Schema validation and type inference
- **ESM**: ECMAScript Modules for modern JavaScript (imports require .ts/.tsx file extensions)

### Client Structure

```
src/
├── app.tsx              # Main application component
├── main.tsx             # Application entry point
├── index.css            # Global styles
├── components/ui        # UI components
├── components/pages     # Pages
├── hooks/               # Custom React hooks
├── lib/                 # Facades for third party APIS and http clients
├── routes/              # TanStack Router routes
├── utils/               # Utilities
└── constants/           # Application constants
```

### Design System

Our design system is based on the default shadcn/ui components. All new components should be created in the same style to provide a cohesive and cool UI experience for users. This ensures consistency across the application and maintains the modern, polished aesthetic that shadcn/ui provides.

### Avoiding Outdated Patterns

**Important**: When working with core frameworks and libraries like React, Vite, and shadcn/ui, avoid using outdated patterns that AI tools commonly generate. AI-generated code often references deprecated approaches or outdated library versions.

**Common Pitfalls to Avoid:**

- **shadcn/ui Components**: Don't use outdated shadcn component patterns that may not be compatible with current versions
- **React Patterns**: Use current React 19 patterns instead of older class-based or deprecated hook patterns
- **Vite Configuration**: Follow current Vite configuration patterns rather than older build tool approaches
- **TypeScript Patterns**: Use current TypeScript patterns and avoid deprecated interfaces
- **Tailwind CSS**: Use current Tailwind utility classes and avoid deprecated CSS approaches

**Before Writing Code**: Always check the `package.json` file to verify the exact versions of dependencies being used. This ensures that any code patterns or component implementations you write will actually work with the installed package versions, preventing runtime errors from version mismatches.

**Best Practice**: Always reference the official documentation for React, Vite, shadcn/ui, and other libraries rather than relying solely on AI-generated code that may contain outdated patterns.

## Scripts

The following npm scripts are available for development and build tasks:

### Development

- **`dev`**: Start the Vite development server with hot reload
- **`build`**: Build the application for production (TypeScript compilation + Vite build)

### Code Quality

- **`format`**: Check code formatting with Prettier
- **`format:fix`**: Fix code formatting issues automatically
- **`lint`**: Run ESLint to check TypeScript/React code quality
- **`lint:fix`**: Fix ESLint issues automatically
- **`csslint`**: Check CSS code quality with Stylelint
- **`csslint:fix`**: Fix CSS code quality issues automatically
