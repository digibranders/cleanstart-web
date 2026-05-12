#!/usr/bin/env bash
# Postgres backup to Cloudflare R2.
#
# Required env vars:
#   DATABASE_URI              — postgres connection string
#   R2_ENDPOINT               — R2 S3-compatible endpoint URL
#   R2_ACCESS_KEY_ID          — R2 access key
#   R2_SECRET_ACCESS_KEY      — R2 secret key
#   R2_BUCKET                 — destination bucket name
#
# Optional env vars:
#   BETTERSTACK_HEARTBEAT_URL — pinged on success for uptime monitoring
#   DRY_RUN                   — set to any non-empty value to skip dump/upload
set -euo pipefail

: "${DATABASE_URI:?DATABASE_URI is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_BUCKET:?R2_BUCKET is required}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BACKUP_FILE="/tmp/cleanstart-${TIMESTAMP}.dump"
S3_KEY="backups/${TIMESTAMP}.dump"
DRY_RUN="${DRY_RUN:-}"

log() { echo "[backup] $*" >&2; }

log "Starting backup — ${TIMESTAMP}"

if [[ -n "${DRY_RUN}" ]]; then
  log "DRY_RUN set: would dump to ${BACKUP_FILE} and upload to s3://${R2_BUCKET}/${S3_KEY}"
  exit 0
fi

log "Dumping database..."
pg_dump -Fc "${DATABASE_URI}" > "${BACKUP_FILE}"
SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "Dump complete — ${SIZE}"

log "Uploading to R2..."
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
  aws s3 cp \
    --endpoint-url "${R2_ENDPOINT}" \
    "${BACKUP_FILE}" \
    "s3://${R2_BUCKET}/${S3_KEY}"

log "Upload complete — s3://${R2_BUCKET}/${S3_KEY}"

rm -f "${BACKUP_FILE}"
log "Temp file removed"

if [[ -n "${BETTERSTACK_HEARTBEAT_URL:-}" ]]; then
  curl -fsS --max-time 10 "${BETTERSTACK_HEARTBEAT_URL}" > /dev/null || true
  log "Heartbeat pinged"
fi

log "Backup finished successfully — ${TIMESTAMP}"
