# Progeny Agent Guide

## Project Overview
- `frontend/` is a Vite + React client for the character generator, sheet editor, exports, and authenticated UI.
- `backend/` is a Fastify + Drizzle + SQLite API with WorkOS session auth, REST endpoints, and WebSocket sync/chat.
- Deep docs live in `docs/`. Read them on demand; do not treat them as always-required context.

## Where To Look First
- UI routing and app shell: `frontend/src/routes/`, `frontend/src/routes/__root.tsx`
- Generator flow: `frontend/src/generator/`, `frontend/src/routes/index.tsx`
- Character sheet flow: `frontend/src/character_sheet/`, `frontend/src/routes/sheet.tsx`
- Frontend networking/auth: `frontend/src/utils/api.ts`, `frontend/src/hooks/useAuth.tsx`
- Backend bootstrap: `backend/src/index.ts`
- Backend routes: `backend/src/routes/`
- Backend auth/session handling: `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`
- Database schema and migrations: `backend/src/db/schema.ts`, `backend/src/db/migrations/`

## Commands That Must Work
- Frontend install: `cd frontend && npm install`
- Frontend dev: `cd frontend && npm start`
- Frontend build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Frontend tests: `cd frontend && npm run test:run`
- Backend install: `cd backend && npm install`
- Backend dev: `cd backend && npm run dev`
- Backend build: `cd backend && npm run build`
- Backend migrations: `cd backend && npm run db:generate && npm run db:migrate`

## Non-Negotiable Invariants
- Frontend REST calls should go through `frontend/src/utils/api.ts`. It carries `credentials: "include"` and the CSRF header flow for mutating requests.
- Backend auth is based on the sealed WorkOS session cookie `wos-session`, not bearer tokens.
- Character payloads are stored as JSON strings in `backend.characters.data` and parsed/stringified at the API boundary. If the character shape changes, keep frontend model code and backend Zod schemas aligned.
- Shared characters are read-only for non-owners. Preserve that rule in both REST and WebSocket paths.
- Backend schema changes require matching Drizzle migration updates. Do not hand-edit generated migration snapshots unless you understand why.

## Workflow Triggers
- If you change frontend request/response shapes, inspect the matching backend route and the consumer hooks/components before finalizing.
- If you change `backend/src/db/schema.ts`, generate a migration and review the route/schema code that parses persisted JSON.
- If you change generator step order or step gating, verify both `frontend/src/generator/Generator.tsx` and the sidebar/step navigation. See the Generator Step Footgun section in `frontend/AGENTS.md`.
- If you change sheet sync or chat behavior, inspect both the frontend Zustand store and the backend WebSocket handler.
- If you add a new API surface, update the relevant architecture doc in `docs/` if the code path would otherwise be hard to discover.

## Verification
When the task description below says "run the build" or "verify", these are the bars to clear — not just that the command exits 0:
- Frontend build: no TypeScript errors (`cd frontend && npm run build`)
- Frontend tests: all tests pass (`cd frontend && npm run test:run`) — required for any character model or export change
- Backend build: no TypeScript errors (`cd backend && npm run build`)
- Backend tests: health check passes (`cd backend && npm run test:run`) — required after any route or middleware change
- DB migrations: snapshot is consistent (`cd backend && npm run db:generate`) — required after any schema change

## Scoped Guidance
- When working mostly in `frontend/`, read `frontend/AGENTS.md`.
- When working mostly in `backend/`, read `backend/AGENTS.md`.

## Deep Docs
- `docs/architecture-overview.md`
- `docs/frontend-architecture.md`
- `docs/backend-architecture.md`
- `backend/DATA_FLOW.md`
