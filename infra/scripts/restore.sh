#!/usr/bin/env bash
# Restore a Postgres backup from Cloudflare R2.
#
# Usage:
#   ALLOW_RESTORE=yes ./restore.sh                      # list available backups
#   ALLOW_RESTORE=yes ./restore.sh 2026-05-12T02:00:00Z # restore specific backup
#
# Required env vars:
#   DATABASE_URI              — postgres connection string
#   R2_ENDPOINT               — R2 S3-compatible endpoint URL
#   R2_ACCESS_KEY_ID          — R2 access key
#   R2_SECRET_ACCESS_KEY      — R2 secret key
#   R2_BUCKET                 — bucket name
#   ALLOW_RESTORE             — must be exactly 'yes' to proceed
set -euo pipefail

if [[ "${ALLOW_RESTORE:-}" != "yes" ]]; then
  echo "[restore] ERROR: Set ALLOW_RESTORE=yes to proceed. This prevents accidental restores." >&2
  exit 1
fi

: "${DATABASE_URI:?DATABASE_URI is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_BUCKET:?R2_BUCKET is required}"

TIMESTAMP="${1:-}"
RESTORE_FILE="/tmp/cleanstart-restore-$(date -u +%s).dump"

r2() {
  AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
    aws --endpoint-url "${R2_ENDPOINT}" "$@"
}

log() { echo "[restore] $*" >&2; }

if [[ -z "${TIMESTAMP}" ]]; then
  log "No timestamp given — available backups:"
  r2 s3 ls "s3://${R2_BUCKET}/backups/" | sort
  echo ""
  log "Usage: ALLOW_RESTORE=yes ./restore.sh 2026-05-12T02:00:00Z"
  exit 0
fi

S3_KEY="backups/${TIMESTAMP}.dump"

log "Downloading s3://${R2_BUCKET}/${S3_KEY}..."
r2 s3 cp "s3://${R2_BUCKET}/${S3_KEY}" "${RESTORE_FILE}"

log "Restoring to database (this replaces all existing data)..."
pg_restore -Fc --clean --if-exists -d "${DATABASE_URI}" "${RESTORE_FILE}"

rm -f "${RESTORE_FILE}"
log "Temp file removed"

log "Restore complete — ${TIMESTAMP}"
