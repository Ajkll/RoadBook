# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- **Client:** `cd client && npm run start` (Expo)
- **Server:** `cd server && npm run dev` (Node.js)

## Testing Commands
- **Client tests:** `cd client && npm test`
- **Single client test:** `cd client && npm test -- -t "test name"`
- **Server tests:** `cd server && npm test`
- **Single server test:** `cd server && npm test -- -t "test name"`
- **Watch server tests:** `cd server && npm run test:watch`

## Lint Commands
- **Client:** `cd client && npm run lint`

## Code Style Guidelines
- **TypeScript:** Use TypeScript for type safety in both client and server
- **Imports:** Use absolute imports with `@/` prefix based on path aliases
- **Naming:** Use PascalCase for components, camelCase for variables and functions
- **React:** Modern React with functional components and hooks
- **API Error Handling:** Use try/catch blocks with appropriate logging
- **Testing:** Jest with React Testing Library for client, Jest for server
- **Validation:** Use Yup for client validation, express-validator/zod for server
- **State Management:** Redux Toolkit for client state management


