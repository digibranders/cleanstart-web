#!/usr/bin/env bash
# Backup wrapper — invoked by /etc/cron.d/cleanstart-backup daily at 02:00 UTC.
# Loads the deploy-rendered /opt/cleanstart/.env so secret rotation via
# GitHub re-deploy propagates here without touching the cron entry.
set -euo pipefail

ENV_FILE=/opt/cleanstart/.env
[ -r "$ENV_FILE" ] || { echo "[run-backup] $ENV_FILE not readable"; exit 1; }

# Load .env WITHOUT shell-executing values. The deploy renders it as literal
# `KEY=VALUE` lines (docker-compose env_file semantics), so values may contain
# spaces — e.g. `BREVO_SENDER_NAME=CleanStart Careers`. Sourcing with `.` would
# set the var to the first word and try to run the second as a command
# (`Careers: command not found`), aborting under `set -e` before the backup
# ever runs. Parse line-by-line and export each pair literally instead.
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    '' | '#'*) continue ;;
  esac
  key=${line%%=*}
  case "$key" in
    [A-Za-z_][A-Za-z0-9_]*) export "$key=${line#*=}" ;;
  esac
done < "$ENV_FILE"

# The compose service hostname (postgres:5432) does not resolve from the host.
# Force the localhost-bound form for the cron-from-host pg_dump.
export DATABASE_URI="postgres://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/cleanstart"

# R2_BUCKET comes from .env (locked decision row 17 — 'cleanstart').
# The backup script writes to 'backups/{ISO-ts}.dump' inside it.
# Lifecycle rule (R2 bucket settings) deletes objects under 'backups/' after 90 days.

# BetterStack heartbeat URL — set via BACKUP_HEARTBEAT_URL secret in GH;
# backup.sh expects the var named BETTERSTACK_HEARTBEAT_URL.
export BETTERSTACK_HEARTBEAT_URL="${BACKUP_HEARTBEAT_URL:-}"

exec /opt/cleanstart/scripts/backup.sh
