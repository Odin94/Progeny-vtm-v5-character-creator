# Backend Data Flow

## HTTP Request Lifecycle

```
Client (Frontend)
  │
  │  HTTP request + cookies (wos-session, csrf-token)
  ▼
Fastify hooks (src/index.ts → src/app.ts)
  ├── Assign request ID (x-request-id header)
  ├── GET requests: generate CSRF token → set csrf-token cookie + X-CSRF-Token response header
  └── Mutating requests (POST/PUT/DELETE): validate csrf-token cookie matches x-csrf-token header → 403 on mismatch
  │
  ▼
Route handler preHandler: authenticateUser (src/middleware/auth.ts)
  ├── Read wos-session cookie
  ├── WorkOS: loadSealedSession + authenticate()
  ├── If expired: attempt session.refresh() → update wos-session cookie on success
  └── Attach { id, email, firstName, lastName } to request.user → 401 on failure
  │
  ▼
Zod validation (src/schemas/ via zodToFastifySchema)
  │
  ▼
Drizzle ORM → SQLite (src/db/)
  │
  ▼
Response
  └── onResponse hook: structured logging + optional PostHog event tracking
```

## WebSocket Lifecycle

```
Client
  │
  │  WebSocket upgrade + cookies (wos-session)
  ▼
WebSocket handler (src/websocket/)
  └── Auth: same wos-session cookie approach as HTTP, not a separate token
  │
  ▼
Message dispatch
  ├── subscribe / unsubscribe { type, characterId }
  └── character_update { type, ... }
  │
  ▼
Access check
  ├── subscribe: user must own or have a share record for the character
  └── character_update: user must own the character (shared users are read-only)
  │
  ▼
Persistence (owner updates) → broadcast to all subscribers
```

## Character CRUD Flow

```
POST /characters
  ├── authenticateUser
  ├── Zod: createCharacterSchema
  ├── Check 100-character limit per user
  ├── Upsert user row if first character
  └── Insert character (data stored as JSON string)

GET /characters
  ├── authenticateUser
  ├── Query owned characters
  ├── Query shared characters (via character_shares join)
  └── Merge + add { shared, canEdit } metadata

PUT /characters/:id
  ├── authenticateUser
  ├── Fetch character → 403 if userId !== request.user.id
  └── Update character (JSON.stringify data)

DELETE /characters/:id
  ├── authenticateUser
  ├── Fetch character → 403 if userId !== request.user.id
  └── Delete character
```

## Sharing Flow

```
POST /characters/:characterId/share
  ├── authenticateUser
  ├── Verify caller owns character
  ├── Look up target user by email
  ├── Reject if sharing with self or share already exists
  └── Insert into character_shares

GET /characters includes shared characters where sharedWithUserId = userId
```

## Metrics Collection

```
Every HTTP response → onResponse hook
  ├── Record route, method, duration
  └── Every 10 minutes: calculate p50/p90/p99, CPU, memory → send to PostHog
```
