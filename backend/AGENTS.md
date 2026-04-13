# Backend Agent Guide

## Purpose
- The backend serves authenticated REST APIs, WorkOS auth endpoints, WebSocket sync/chat, SQLite persistence, and analytics/security hooks.

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Tests: `npm run test:run`
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`

## Important Areas
- Server bootstrap and middleware registration: `src/index.ts`
- Environment and external services: `src/config/`
- Route handlers: `src/routes/`
- Auth/session middleware: `src/middleware/auth.ts`, `src/routes/auth.ts`
- Database schema and access: `src/db/schema.ts`, `src/db/index.ts`, `src/db/migrations/`
- Zod request schemas: `src/schemas/`
- Realtime sync/chat: `src/websocket/`
- Logging, analytics, and metrics: `src/utils/`, `src/middleware/securityLogger.ts`

## Non-Negotiable Invariants
- Authenticated requests rely on the sealed WorkOS session cookie `wos-session`. Keep REST and WebSocket auth behavior aligned.
- Character payloads are persisted as JSON strings plus version fields. Preserve the parse/stringify boundary in routes and sync handlers.
- Shared characters are readable by shared users but editable only by owners.
- User preferences are stored as JSON in `users.preferences`; keep parsing logic tolerant of missing or malformed data.
- Route validation is done with Zod schemas converted via `zodToFastifySchema`. New endpoints must follow the same pattern — do not add unvalidated routes.
- Schema changes should be expressed in `src/db/schema.ts` and reflected through generated Drizzle migrations.

## Conventions
- Request/response validation: Zod schemas live in `src/schemas/`. Convert them to Fastify schema format with `zodToFastifySchema` from `src/utils/schema.ts`.
- All app setup (plugins, hooks, routes) lives in `src/app.ts` via `buildApp()`. `src/index.ts` only handles server startup and signal handling.

## Verification Triggers
- Route or schema changes: `npm run build` — no TypeScript errors is the minimum bar. Then `npm run test:run` to confirm the health check still passes.
- Database schema changes: `npm run db:generate` and review the generated migration before applying.
- Auth/session changes: inspect both `src/routes/auth.ts` and `src/middleware/auth.ts` — they must stay aligned.
- WebSocket protocol changes: inspect the paired frontend store/hooks before finalizing.
