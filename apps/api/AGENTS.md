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

### Type Sharing

The API exports types through the `export.ts` file, which provides shared types and interfaces for the client to import, ensuring consistent type safety across the full-stack application.
