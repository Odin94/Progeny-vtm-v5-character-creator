#!/bin/bash
set -e

BACKUP_MONTH="$(date +%Y_%m)"
BACKUP_DIR="db_backups/$BACKUP_MONTH"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
cp database.sqlite "$BACKUP_FILE"
echo "Backed up database.sqlite to $BACKUP_FILE"

git pull
echo "Pulled latest code from git"
corepack enable
corepack pnpm install --frozen-lockfile
echo "Installed dependencies"
corepack pnpm run build
echo "Built the code"
corepack pnpm run db:migrate
echo "Migrated the database"
pm2 restart progeny-backend
echo "Restarted the backend"
echo "Waiting 5 seconds for backend to start..."
sleep 5
curl https://api-progeny.odin-matthias.de/health
echo "pm2 logs to see logs"
echo ""
