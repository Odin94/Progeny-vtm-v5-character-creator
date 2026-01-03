# Backend Data Flow Diagram

## HTTP Request Flow (REST API)

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTP Request
       │ (Bearer Token in Authorization header)
       ▼
┌─────────────────────────────────────┐
│      Fastify Server (index.ts)      │
│  - CORS enabled                     │
│  - WebSocket support                │
│  - Metrics collection               │
└──────┬──────────────────────────────┘
       │
       │ Route Registration
       ▼
┌─────────────────────────────────────┐
│      Route Handler                  │
│  (characters/coteries/shares)      │
└──────┬──────────────────────────────┘
       │
       │ preHandler: authenticateUser
       ▼
┌─────────────────────────────────────┐
│   Auth Middleware (auth.ts)         │
│                                      │
│  1. Extract Bearer token            │
│  2. Decode JWT payload              │
│  3. Extract userId from token       │
│  4. Fetch user from WorkOS          │
│  5. Attach user to request          │
└──────┬──────────────────────────────┘
       │
       │ request.user = { id, email, ... }
       ▼
┌─────────────────────────────────────┐
│   WorkOS API                        │
│   workos.userManagement.getUser()  │
└──────┬──────────────────────────────┘
       │
       │ User data
       ▼
┌─────────────────────────────────────┐
│   Route Handler (continued)         │
│                                      │
│  - Validate request (Zod schemas)  │
│  - Check permissions                │
│  - Query/Update database            │
└──────┬──────────────────────────────┘
       │
       │ Database operations
       ▼
┌─────────────────────────────────────┐
│   Drizzle ORM                      │
│   SQLite Database                   │
│                                      │
│   Tables:                           │
│   - users                           │
│   - characters                      │
│   - coteries                        │
│   - coterie_members                 │
│   - character_shares               │
└──────┬──────────────────────────────┘
       │
       │ Query results
       ▼
┌─────────────────────────────────────┐
│   Response Processing               │
│  - Parse JSON data                  │
│  - Add metadata (canEdit, shared)  │
│  - Format response                  │
└──────┬──────────────────────────────┘
       │
       │ JSON Response
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## WebSocket Flow (Real-time Sync)

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ WebSocket Connection
       │ (Bearer Token in Authorization header)
       ▼
┌─────────────────────────────────────┐
│   WebSocket Handler                 │
│   (/ws/characters)                  │
└──────┬──────────────────────────────┘
       │
       │ Authenticate connection
       ▼
┌─────────────────────────────────────┐
│   WebSocket Auth                    │
│  (Same as HTTP auth)                │
│  1. Extract Bearer token            │
│  2. Decode JWT                      │
│  3. Fetch user from WorkOS          │
└──────┬──────────────────────────────┘
       │
       │ Connection established
       ▼
┌─────────────────────────────────────┐
│   Message Handling                  │
│                                      │
│  Message Types:                     │
│  - subscribe: { type, characterId } │
│  - unsubscribe: { type, characterId}│
│  - character_update: { type, ... } │
└──────┬──────────────────────────────┘
       │
       │ Subscribe to character
       ▼
┌─────────────────────────────────────┐
│   Access Verification               │
│  - Check if user owns character     │
│  - Check if character is shared     │
│  - Add socket to subscription map   │
└──────┬──────────────────────────────┘
       │
       │ Character update received
       ▼
┌─────────────────────────────────────┐
│   Update Processing                 │
│  1. Verify user owns character      │
│  2. Update database                 │
│  3. Broadcast to all subscribers    │
└──────┬──────────────────────────────┘
       │
       │ Broadcast update
       ▼
┌─────────────────────────────────────┐
│   Subscription Map                  │
│  characterId → Set<WebSocket>       │
└──────┬──────────────────────────────┘
       │
       │ Send to all subscribers
       ▼
┌─────────────┐
│   Clients   │
│ (All users  │
│  subscribed)│
└─────────────┘
```

## Authentication Flow Detail

```
┌─────────────┐
│   Client    │
│  Sends:      │
│  Authorization: Bearer <JWT_TOKEN> │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   authenticateUser()                 │
│                                      │
│   1. Extract token from header       │
│   2. Parse JWT payload:              │
│      Buffer.from(                    │
│        token.split('.')[1],          │
│        'base64'                      │
│      ).toString()                    │
│   3. Extract userId:                │
│      payload.sub || payload.user_id  │
└──────┬──────────────────────────────┘
       │
       │ userId
       ▼
┌─────────────────────────────────────┐
│   WorkOS API Call                   │
│   workos.userManagement.getUser()   │
│                                      │
│   Returns:                          │
│   { id, email, firstName, lastName }│
└──────┬──────────────────────────────┘
       │
       │ User object
       ▼
┌─────────────────────────────────────┐
│   Attach to Request                 │
│   request.user = {                   │
│     id: user.id,                     │
│     email: user.email,              │
│     firstName: user.firstName,       │
│     lastName: user.lastName          │
│   }                                  │
└──────┬──────────────────────────────┘
       │
       │ Continue to route handler
       ▼
┌─────────────────────────────────────┐
│   Route Handler                      │
│   Uses: request.user!.id             │
└─────────────────────────────────────┘
```

## Character CRUD Flow Example

```
POST /characters
│
├─► Auth Middleware
│   └─► WorkOS: getUser(userId)
│       └─► Create user in DB if not exists
│
├─► Validate: createCharacterSchema (Zod)
│
├─► Database: Insert character
│   └─► JSON.stringify(data)
│
└─► Response: Character with parsed JSON data

GET /characters
│
├─► Auth Middleware
│
├─► Database: Query owned characters
│
├─► Database: Query shared characters
│   └─► Join with character_shares
│
├─► Combine & format results
│   └─► Add metadata (shared, canEdit)
│
└─► Response: Array of characters

PUT /characters/:id
│
├─► Auth Middleware
│
├─► Database: Find character
│
├─► Permission Check: character.userId === request.user.id
│
├─► Database: Update character
│   └─► JSON.stringify(data)
│
└─► Response: Updated character

DELETE /characters/:id
│
├─► Auth Middleware
│
├─► Database: Find character
│
├─► Permission Check: character.userId === request.user.id
│
└─► Database: Delete character
```

## Sharing Flow

```
POST /characters/:characterId/share
│
├─► Auth Middleware
│
├─► Verify: User owns character
│
├─► Database: Find user by email
│   └─► sharedWithUserEmail
│
├─► Validation: Not sharing with self
│
├─► Database: Check existing share
│
└─► Database: Insert into character_shares

GET /characters
│
├─► Auth Middleware
│
├─► Database: Get owned characters
│
├─► Database: Get shared characters
│   └─► WHERE sharedWithUserId = userId
│
└─► Response: Combined list with metadata
```

## Coterie Flow

```
POST /coteries
│
├─► Auth Middleware
│
└─► Database: Insert coterie (ownerId = userId)

POST /coteries/:id/characters
│
├─► Auth Middleware
│
├─► Verify: User owns coterie
│
├─► Verify: User owns character
│
└─► Database: Insert into coterie_members

GET /coteries
│
├─► Auth Middleware
│
├─► Database: Get owned coteries
│   └─► Join with coterie_members
│   └─► Join with characters
│
├─► Database: Get shared coteries
│   └─► Via character_shares
│
└─► Response: Combined list with members
```

## Metrics Collection

```
Every HTTP Request
│
├─► Fastify Hook: onResponse
│   └─► Track: route, method, duration
│
├─► Store in: responseTimes array
│   └─► Keep last 10 minutes
│
└─► Every 10 minutes:
    ├─► Calculate percentiles (p50, p90, p99)
    ├─► Get CPU usage
    ├─► Get memory usage
    └─► Send to PostHog (if configured)
```
