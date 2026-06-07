#!/bin/bash
set -e

APP_USER="progeny"
APP_NAME="progeny-backend"

usage() {
    echo "Usage: $0 {status|logs|restart|stop}"
    exit 1
}

run_pm2() {
    if [ "$(id -un)" = "$APP_USER" ]; then
        pm2 "$@"
    elif [ "$EUID" -eq 0 ]; then
        runuser -u "$APP_USER" -- pm2 "$@"
    else
        echo "Please run this script as root or $APP_USER."
        exit 1
    fi
}

case "${1:-}" in
    status)
        run_pm2 status
        ;;
    logs)
        shift
        run_pm2 logs "$APP_NAME" "$@"
        ;;
    restart)
        run_pm2 restart "$APP_NAME"
        run_pm2 save
        ;;
    stop)
        run_pm2 stop "$APP_NAME"
        run_pm2 save
        ;;
    *)
        usage
        ;;
esac
