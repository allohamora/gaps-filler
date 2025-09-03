# Gaps Filler API

This guide covers the architecture, components, and restrictions of the Gaps Filler API application.

## Overview

The Gaps Filler API is a Hono-based Node.js application that provides HTTP and WebSocket endpoints for various services. The main goal of this API is to provide services useful for English education.

## Architecture

### Core Framework

- **Hono**: Modern, fast web framework for Node.js
- **WebSocket Support**: Real-time bidirectional communication using `@hono/node-ws`
- **TypeScript**: Full type safety throughout the application
- **Zod**: Schema validation and type inference
- **Vercel AI SDK**: AI model integration
- **ESM**: ECMAScript Modules for modern JavaScript (imports require .js file extensions)

### Services

- **Deepgram**: Speech-to-text service
- **Cartesia**: Text-to-speech service
- **Gemini**: Large language model

### Server Structure

```
src/
├── index.ts          # Application entry point
├── server.ts         # Hono server setup
├── config.ts         # Env config
├── export.ts         # Type exports for client
├── dev-chat.ts       # Chat prompt testing utility
├── routers/          # Http routes
├── services/         # Domain services
├── libs/            # Facades for the third party libraries
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── constants/       # Application constants
```

### File Naming Convention

Files inside directories follow the pattern `{name}.{dir}.ts`. For example: `libs` directory contains `sheets.lib.ts`, `services` directory contains `streamer.service.ts`, etc.

### API Endpoints

All API endpoints should use the `/v1` prefix and are created inside `v1.router.ts`. This ensures proper versioning and organization of the API routes.

### Router Pattern

To maintain type safety and consistency, create routers using the following pattern:

```ts
export const {name}Router = new Hono()
  .post('/endpoint', handler)
  .get('/endpoint', handler)
```

### Router Integration

After creating individual routers, connect them in the main `v1.router.ts` file:

```ts
import { articlesRouter } from './articles.router';
import { chatRouter } from './chat.router';

export const v1Router = new Hono().route('/articles', articlesRouter).route('/chat', chatRouter);
```

### Type Sharing

The API exports types through the `export.ts` file, which provides shared types and interfaces for the client to import, ensuring consistent type safety across the full-stack application.

## Scripts

The following npm scripts are available for development and build tasks:

### Development

- **`dev`**: Start the development server with hot reload using tsx
- **`dev-chat`**: Run the chat prompt testing utility
- **`start`**: Start the production server from built files

### Build

- **`build`**: Build the application for production (TypeScript compilation)
- **`postbuild`**: Post-build step to resolve TypeScript path aliases

### Code Quality

- **`format`**: Check code formatting with Prettier
- **`format:fix`**: Fix code formatting issues automatically
- **`lint`**: Run ESLint to check TypeScript code quality
- **`lint:fix`**: Fix ESLint issues automatically
