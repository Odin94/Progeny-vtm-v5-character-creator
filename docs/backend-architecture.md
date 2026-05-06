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

## Safe change checklist

- **Auth behavior**: inspect both `src/routes/auth.ts` (login/callback/logout) and `src/middleware/auth.ts` (per-request validation) — they share state assumptions.
- **Route payloads**: inspect the corresponding frontend API helper in `frontend/src/utils/api.ts` and the consumer hook.
- **DB schema**: generate a migration (`pnpm run db:generate`) and inspect affected routes for JSON parse/stringify logic.
- **WebSocket messages**: inspect the paired frontend Zustand store before finalizing — both sides must agree on the payload shape.
