# Progeny Architecture Overview

Reference doc for cross-cutting concerns. Entry points, file locations, commands, and invariants live in the AGENTS.md files — this doc explains the *why* behind the four main architectural boundaries.

## 1. Character model boundary

The character shape is a cross-cutting contract with four surfaces that must stay in sync:

- Frontend authoring and rendering: `frontend/src/data/Character.ts`
- Backend Zod validation: `backend/src/schemas/character.ts`
- Persistence: `backend/src/db/schema.ts` stores `characters.data` as a JSON string
- Export/import: `frontend/src/generator/` (PDF, Foundry, Inconnu), `frontend/src/test/`

If the shape changes, all four surfaces need review. The backend never validates the full nested character structure on read — it trusts what was written — so a mismatch between the frontend model and backend schema will silently produce bad data.

## 2. Auth boundary

Authentication is sealed-session-cookie based (WorkOS `wos-session`). This is not a bearer-token flow.

- Login and callback: `backend/src/routes/auth.ts`
- Session middleware: `backend/src/middleware/auth.ts` — loads and authenticates the sealed session, refreshes if expired, attaches `request.user`
- Frontend auth hook: `frontend/src/hooks/useAuth.tsx`
- REST helper: `frontend/src/utils/api.ts` — always uses `credentials: "include"` and the CSRF token header

WebSocket connections use the same `wos-session` cookie, not a separate token. Never assume a bearer-token shape; the WorkOS sealed session is opaque.

## 3. Persistence boundary

The backend mixes typed relational columns with JSON blobs:

- Relational: users, characters, coteries, memberships, shares (`backend/src/db/schema.ts`)
- JSON-backed: `characters.data` (full character payload), `users.preferences` (UI preferences)

The JSON fields mean that schema migrations alone are not enough — the serialization and parsing code in routes and WebSocket handlers is part of the contract. Preferences parsing must be tolerant of missing or malformed data because old records may not have new fields.

## 4. Realtime boundary

Two independent WebSocket systems share the same cookie-based auth:

- Character sync: `backend/src/websocket/characterSync.ts` ↔ frontend sheet sync code
- Session chat / live dice: `backend/src/websocket/sessionChat.ts` ↔ `frontend/src/character_sheet/stores/sessionChatStore.ts`

Payload shape changes must be coordinated across both sides before merging. The systems are independent — a change to one does not affect the other.

## Related docs

- `docs/frontend-architecture.md`
- `docs/backend-architecture.md`
- `backend/DATA_FLOW.md`
