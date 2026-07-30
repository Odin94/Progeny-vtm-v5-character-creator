# Backend Architecture

Reference doc for implementation detail not covered in `backend/AGENTS.md`. For a visual flow, see `backend/DATA_FLOW.md`.

## Request lifecycle sequence

Most authenticated HTTP requests pass through this exact sequence:

1. `src/index.ts` → `buildApp()` in `src/app.ts` registers all plugins and hooks
2. `onRequest` hook: assign request ID
3. `onRequest` hook: GET requests → generate/set CSRF token cookie + response header; mutating requests → validate `x-csrf-token` header against `csrf-token` cookie (403 on mismatch)
4. Route `preHandler: authenticateUser` in `src/middleware/auth.ts` → read `wos-session` cookie → WorkOS sealed session authenticate → refresh if expired → attach `request.user`
5. Zod validation via `zodToFastifySchema` (routes that declare a schema)
6. Drizzle query/mutation
7. `onResponse` hook: structured logging + optional PostHog tracking

Steps 2–3 run for all requests including unauthenticated ones. Step 4 only runs on routes that declare `preHandler: authenticateUser`.

### Superadmin impersonation

Superadmin support is layered onto the same auth boundary:

- `users.is_superadmin` is the DB-backed admin flag; the first superadmin is bootstrapped manually in SQLite.
- `src/routes/admin.ts` exposes user search, superadmin toggling, name-tag entitlement toggling, and impersonation start/stop endpoints.
- Name tags use two DB-backed flags: `users.name_tag_enabled` is the superadmin-controlled entitlement, while `users.name_tag_visible` is the user's preference. Public coterie and chat payloads expose only the effective `enabled && visible` state.
- `authenticateUser` always resolves the real WorkOS actor first, then applies a signed `impersonation-session` cookie when an active in-memory session exists.
- During impersonation, existing route handlers continue to read `request.user` as the effective user. Admin checks must use `request.actorUser` through `requireSuperadmin` so an impersonated identity cannot grant admin access.
- Mutating REST calls during impersonation are appended by the global `onResponse` hook to `impersonation_sessions.audit_log`; WebSocket messages are not audited there.

## Route patterns

New endpoints must follow the existing pattern:

```ts
fastify.post<{ Body: MyInput }>(
    "/my-route",
    {
        preHandler: authenticateUser,
        schema: { body: zodToFastifySchema(myZodSchema) },
    },
    async (request: AuthenticatedRequest, reply) => { ... }
)
```

Schemas live in `src/schemas/`. The `zodToFastifySchema` helper is in `src/utils/schema.ts`. Do not add routes without a Zod schema for any user-supplied input.

## Homebrew API

`src/routes/homebrew.ts` owns the full Homebrew lifecycle. Its input contracts live in `src/schemas/homebrew.ts`, and collection serialization/copy helpers live in `src/utils/homebrew.ts`.

- `/homebrew/collections` provides owner-only collection CRUD.
- `/coteries/:id/homebrew` lets a coterie owner attach their collections; `/characters/:id/homebrew` resolves only collections enabled through that character's current coteries.
- `/homebrew/library` and `/homebrew/library/:id` are public reads of approved snapshots. Copy, rating, comment, and unpublish endpoints require authentication as appropriate.
- `/homebrew/publish-requests` creates and lists a user's requests. A user may submit five requests in any rolling seven-day window, including requests later denied or withdrawn.
- `/admin/homebrew/publish-requests` is protected by `requireSuperadmin` and approves or denies snapshots. Denials require a message.

Private coterie attachments intentionally reference a live collection. Publishing creates an immutable snapshot and approval promotes that snapshot as the library entry's active version; editing the source collection never mutates an approved publication. Copies create independent private snapshots and retain both immediate and root source references.

## Safe change checklist

- **Auth behavior**: inspect both `src/routes/auth.ts` (login/callback/logout) and `src/middleware/auth.ts` (per-request validation) — they share state assumptions.
- **Route payloads**: inspect the corresponding frontend API helper in `frontend/src/utils/api.ts` and the consumer hook.
- **DB schema**: generate a migration (`pnpm run db:generate`) and inspect affected routes for JSON parse/stringify logic.
- **WebSocket messages**: inspect the paired frontend Zustand store before finalizing — both sides must agree on the payload shape.
