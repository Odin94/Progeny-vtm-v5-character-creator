#!/bin/bash
set -e

APP_USER="progeny"
APP_DIR="/opt/progeny"
BACKEND_DIR="$APP_DIR/backend"
APP_NAME="progeny-backend"
HEALTH_URL="https://api-progeny.odin-matthias.de/health"
DEPLOY_SHA="${1:-}"

if [ -n "$DEPLOY_SHA" ] && ! [[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Deployment commit must be a 40-character lowercase SHA-1."
    exit 1
fi

run_app() {
    if [ "$(id -un)" = "$APP_USER" ]; then
        bash -lc "$1"
    elif [ "$EUID" -eq 0 ]; then
        runuser -u "$APP_USER" -- bash -lc "$1"
    else
        echo "Please run this script as root or $APP_USER."
        exit 1
    fi
}

if ! getent passwd "$APP_USER" >/dev/null 2>&1; then
    echo "User $APP_USER does not exist."
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo "Backend directory does not exist: $BACKEND_DIR"
    exit 1
fi

run_app "
    set -e
    cd '$BACKEND_DIR'
    export CI=true
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
    export npm_config_confirm_modules_purge=false

    BACKUP_MONTH=\"\$(date +%Y_%m)\"
    BACKUP_DIR=\"db_backups/\$BACKUP_MONTH\"
    mkdir -p \"\$BACKUP_DIR\"
    BACKUP_FILE=\"\$BACKUP_DIR/database.sqlite.backup.\$(date +%Y%m%d_%H%M%S)\"
    cp database.sqlite \"\$BACKUP_FILE\"
    echo \"Backed up database.sqlite to \$BACKUP_FILE\"

    if [ -n '$DEPLOY_SHA' ]; then
        git fetch --no-tags origin +main:refs/remotes/origin/main
        if ! git merge-base --is-ancestor '$DEPLOY_SHA' origin/main; then
            echo \"Deployment commit is not reachable from origin/main: $DEPLOY_SHA\"
            exit 1
        fi
        git reset --hard '$DEPLOY_SHA'
        echo \"Checked out deployment commit: \$(git rev-parse HEAD)\"
    else
        git pull --ff-only
        echo \"Pulled latest code from git: \$(git rev-parse HEAD)\"
    fi

    corepack enable
    corepack pnpm install --frozen-lockfile --reporter=append-only
    echo \"Installed dependencies\"

    corepack pnpm run build
    echo \"Built the code\"

    corepack pnpm run db:migrate
    echo \"Migrated the database\"

    pm2 restart '$APP_NAME'
    pm2 save
    echo \"Running deployment commit: \$(git rev-parse HEAD)\"
    echo \"Restarted the backend and saved PM2 process list\"
"

echo "Waiting 5 seconds for backend to start..."
sleep 5

curl -fsS "$HEALTH_URL"
echo ""
echo "Use this for logs:"
echo "  sudo su - $APP_USER -c \"pm2 logs $APP_NAME\""
echo ""
