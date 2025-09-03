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

### Client Structure

```
src/
├── app.tsx              # Main application component
├── main.tsx             # Application entry point
├── index.css            # Global styles
├── components/          # UI components
├── hooks/               # Custom React hooks
├── lib/                 # Facades for third party APIS and http clients
├── routes/              # TanStack Router routes
├── utils/               # Utilities
└── constants/           # Application constants
```

### Design System

Our design system is based on the default shadcn/ui components. All new components should be created in the same style to provide a cohesive and cool UI experience for users. This ensures consistency across the application and maintains the modern, polished aesthetic that shadcn/ui provides.
