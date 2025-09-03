# Gaps Filler API

The Gaps Filler API is a Hono-based Node.js application that provides HTTP and WebSocket endpoints for English education services.

### Tech Stack

- **Hono**: Modern, fast web framework for Node.js
- **WebSocket Support**: Real-time communication using `@hono/node-ws`
- **TypeScript**: Full type safety
- **Zod**: Schema validation
- **Vercel AI SDK**: AI model integration
- **ESM**: ECMAScript Modules (imports require .js file extensions)

### Services

- **Deepgram**: Speech-to-text
- **Cartesia**: Text-to-speech
- **Gemini**: Large language model

## Structure & Conventions

- **Directory Structure**:
  ```
  src/
  ├── index.ts          # Application entry point
  ├── server.ts         # Hono server setup
  ├── config.ts         # Env config
  ├── export.ts         # Type exports for client
  ├── dev-chat.ts       # Chat prompt testing utility
  ├── routers/          # Http routes
  ├── services/         # Domain services
  ├── libs/             # Facades for third-party libraries
  ├── types/            # TypeScript type definitions
  ├── utils/            # Utility functions
  └── constants/        # Application constants
  ```
- **File Naming**: Follow the `{name}.{dir}.ts` convention (e.g., `libs/chat.lib.ts`).

## Scripts

- **`dev`**: Start the development server with hot reload.
- **`dev-chat`**: Run the chat prompt testing utility.
- **`build`**: Build the application for production.
- **`format`**: Check code formatting with Prettier.
- **`format:fix`**: Fix formatting issues.
- **`lint`**: Run ESLint to check code quality.
- **`lint:fix`**: Fix ESLint issues.
