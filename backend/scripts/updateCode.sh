#!/bin/bash
set -e

cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)
echo "Backed up database.sqlite to database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
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
echo "Waiting 2 seconds for backend to start..."
sleep 2
curl https://api.progeny.odin-matthias.de/health
echo ""