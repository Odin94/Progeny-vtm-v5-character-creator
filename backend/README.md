# Backend

TypeScript Fastify backend for Progeny VTM V5 Character Creator.

## Features

- **Authentication**: WorkOS integration for user management
- **Database**: Drizzle ORM with SQLite
- **Validation**: Zod schemas for request validation
- **Character Management**: Full CRUD operations for characters
- **Sharing**: Read-only character sharing between users
- **Coteries**: Organize characters and shared characters in groups
- **Live Sync**: WebSocket support for real-time character updates

## Setup

### Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your WorkOS credentials, correct backend/frontend urls and posthog config
```

3. Generate database migrations:

```bash
pnpm run db:generate
```

4. Run migrations:

```bash
pnpm run db:migrate
```

5. Start development server:

```bash
pnpm run dev
```

### Production Server Setup (Ubuntu/Hetzner)

For setting up on an Ubuntu Hetzner server, use the provided setup script:

1. Copy the setup script to your server:

```bash
scp backend/scripts/setupServer.sh root@your-server:/tmp/setupServer.sh
```

2. SSH into your server and run the setup:

```bash
ssh root@your-server
apt install -y dos2unix
dos2unix /tmp/setupServer.sh
chmod +x /tmp/setupServer.sh
/tmp/setupServer.sh
```

The script will:

- Update system packages
- Install Node.js 24.x
- Install PM2 process manager
- Install and configure Caddy as the HTTPS reverse proxy
- Create application user and directories
- Clone the repository into `/opt/progeny`
- Set up `pm2-progeny.service` for automatic restarts as the `progeny` user

3. After setup, follow the instructions in `/opt/progeny/backend/README-SETUP.md` to deploy your code.

PM2 commands for production should be run as the `progeny` user, not as `root`:

```bash
sudo su - progeny
cd /opt/progeny/backend
pm2 status
```

Before rebooting, make sure the saved `progeny` PM2 process list contains the backend:

```bash
sudo su - progeny -c "pm2 status"
sudo su - progeny -c "pm2 save"
sudo systemctl status pm2-progeny
```

**Note:** The setup script requires root/sudo access and will configure the server for production use.

## Environment Variables

- `WORKOS_API_KEY`: Your WorkOS API key
- `WORKOS_CLIENT_ID`: Your WorkOS client ID
- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0)

### PostHog Support account identity

Support needs a server-signed identity so signed-in users can access their tickets after logout/login and across browsers and devices. Analytics identification alone does not restore ticket access.

1. In the correct PostHog project, open **Support > Settings** and find **Identity verification secret**. Generate a secret if none exists, then copy it. See [PostHog identity verification setup](https://posthog.com/docs/support/widget#find-your-identity-verification-secret).
2. Add the secret to **`backend/.env`** (production: `/opt/progeny/backend/.env`):

    ```dotenv
    POSTHOG_SUPPORT_IDENTITY_SECRET=<paste-the-identity-verification-secret-here>
    ```

    Use the Support identity verification secret, not a project token or personal API key. Keep it backend-only; do not commit it or use a `VITE_` variable.

3. Deploy the backend and frontend account-identity implementation together. After changing `.env`, restart only the Progeny backend so it loads the new value:

    ```bash
    sudo -iu progeny pm2 restart progeny-backend --update-env
    ```

4. Sign in, send a test support message, sign out, reply in PostHog, then sign in again. Confirm the conversation and reply appear. Repeat in another browser signed into the same account. Support currently requires granted cookie consent.

`GET /auth/me` returns an HMAC-SHA256 signature for the authenticated account ID, and the frontend supplies it to `posthog.setIdentity`. The signing secret stays on the server. Logout clears local support access to isolate accounts; logging back in restores access using the account identity. Impersonation does not issue support credentials. Without this environment variable, support remains tied to the browser session. Past widget tickets whose distinct IDs belong to the account's PostHog person can also appear through verified identity, including linked anonymous IDs. Unlinked anonymous tickets require **Recover my tickets**; do not grant ownership merely because a widget visitor typed the account email.

## API Endpoints

### Characters

- `POST /characters` - Create character
- `GET /characters` - List all characters (owned + shared)
- `GET /characters/:id` - Get character
- `PUT /characters/:id` - Update character
- `DELETE /characters/:id` - Delete character

### Coteries

- `POST /coteries` - Create coterie
- `GET /coteries` - List all coteries
- `GET /coteries/:id` - Get coterie
- `PUT /coteries/:id` - Update coterie
- `DELETE /coteries/:id` - Delete coterie
- `POST /coteries/:id/characters` - Add character to coterie
- `DELETE /coteries/:id/characters/:characterId` - Remove character from coterie

### Sharing

- `POST /characters/:characterId/share` - Share character with user
- `DELETE /characters/:characterId/share/:userId` - Unshare character
- `GET /characters/:characterId/shares` - List shares for character

### WebSocket

- `WS /ws/characters` - WebSocket connection for live character sync

## Authentication

All endpoints (except `/health`) require authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer <workos_token>
```

## Database

The database uses SQLite with the following main tables:

- `users` - User accounts (linked to WorkOS)
- `characters` - Character data
- `coteries` - Character groups
- `coterie_members` - Many-to-many relationship between coteries and characters
- `character_shares` - Read-only character sharing

## WebSocket Protocol

Connect to `/ws/characters` with Bearer token authentication.

### Messages

**Subscribe to character:**

```json
{
    "type": "subscribe",
    "characterId": "character_id"
}
```

**Unsubscribe from character:**

```json
{
    "type": "unsubscribe",
    "characterId": "character_id"
}
```

**Update character:**

```json
{
    "type": "character_update",
    "characterId": "character_id",
    "data": {
        /* character data */
    },
    "version": 1
}
```

### Server Messages

**Subscribed:**

```json
{
    "type": "subscribed",
    "characterId": "character_id"
}
```

**Character Updated:**

```json
{
    "type": "character_updated",
    "characterId": "character_id",
    "data": {
        /* character data */
    },
    "version": 1,
    "updatedBy": "user_id"
}
```

**Update Confirmed:**

```json
{
    "type": "update_confirmed",
    "characterId": "character_id"
}
```
