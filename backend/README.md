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
