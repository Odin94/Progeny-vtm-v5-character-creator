#!/bin/bash
set -e

mkdir -p db_backups
BACKUP_FILE="db_backups/database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
cp database.sqlite "$BACKUP_FILE"
echo "Backed up database.sqlite to $BACKUP_FILE"

git pull
echo "Pulled latest code from git"
npm install
echo "Installed dependencies"
npm run build
echo "Built the code"
npm run db:migrate
echo "Migrated the database"
pm2 restart progeny-backend
echo "Restarted the backend"
echo "Waiting 5 seconds for backend to start..."
sleep 5
curl https://api.progeny.odin-matthias.de/health
echo ""