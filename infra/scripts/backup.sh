#!/usr/bin/env bash
# Postgres backup to Cloudflare R2: the CMS database, and the partner portal database once it exists.
#
# Required env vars:
#   DATABASE_URI              - postgres connection string of the CMS database
#   R2_ENDPOINT               - R2 S3-compatible endpoint URL
#   R2_ACCESS_KEY_ID          - R2 access key
#   R2_SECRET_ACCESS_KEY      - R2 secret key
#   R2_BUCKET                 - destination bucket name (the CMS bucket, which also serves public media)
#
# Optional env vars:
#   BETTERSTACK_HEARTBEAT_URL - pinged after EVERY dump succeeded, for uptime monitoring
#   DRY_RUN                   - set to any non-empty value to skip dump/upload and print the plan
#   PORTAL_DB_NAME            - portal database name (default cleanstart_portal; empty counts as unset)
#   PORTAL_DATABASE_URI       - portal connection string (default: DATABASE_URI with the database name swapped)
#   PORTAL_ENV_FILE           - the portal's env file (default /opt/cleanstart/portal.env)
#
# Order: CMS dump, CMS upload, portal dump, portal upload, heartbeat. The heartbeat is the last statement, so it
# fires only when every dump and upload succeeded, and any failure exits non-zero before it. The CMS part runs
# first and never depends on the portal settings.
#
# The portal dump never goes to the public media bucket. Its destination is read from PORTAL_ENV_FILE
# (R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY: the private partner documents bucket) and
# lands under portal-backups/. If the portal database exists and that file cannot supply a destination, the
# script fails before the heartbeat, so a missing portal backup is an alert and never a silent gap. If the portal
# database does not exist on this server yet, the script logs a WARNING and skips it.
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

PORTAL_DB_NAME="${PORTAL_DB_NAME:-cleanstart_portal}"
PORTAL_ENV_FILE="${PORTAL_ENV_FILE:-/opt/cleanstart/portal.env}"
PORTAL_BACKUP_FILE="/tmp/cleanstart-portal-${TIMESTAMP}.dump"
PORTAL_S3_KEY="portal-backups/${TIMESTAMP}.dump"
DATABASE_URI_BASE="${DATABASE_URI%%\?*}"
PORTAL_DATABASE_URI="${PORTAL_DATABASE_URI:-${DATABASE_URI_BASE%/*}/${PORTAL_DB_NAME}}"

log() { echo "[backup] $*" >&2; }

cleanup() { rm -f "${BACKUP_FILE}" "${PORTAL_BACKUP_FILE}"; }
trap cleanup EXIT

# The last value of KEY in a KEY=VALUE env file, read literally. The file is never sourced because values may
# contain spaces (the same reason run-backup.sh parses .env line by line).
env_file_value() {
  local file="$1" key="$2" line value=""
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" == "${key}="* ]]; then value="${line#*=}"; fi
  done < "${file}"
  printf '%s' "${value}"
}

r2_put() { # endpoint access_key secret_key bucket file key
  AWS_ACCESS_KEY_ID="$2" AWS_SECRET_ACCESS_KEY="$3" \
    aws s3 cp --endpoint-url "$1" "$5" "s3://$4/$6"
}

log "Starting backup - ${TIMESTAMP}"

if [[ -n "${DRY_RUN}" ]]; then
  log "DRY_RUN set: would dump the CMS database to ${BACKUP_FILE} and upload to s3://${R2_BUCKET}/${S3_KEY}"
  log "DRY_RUN set: would dump ${PORTAL_DB_NAME} (if it exists) to ${PORTAL_BACKUP_FILE} and upload it to the bucket named in ${PORTAL_ENV_FILE} under ${PORTAL_S3_KEY}"
  exit 0
fi

log "Dumping CMS database..."
pg_dump -Fc "${DATABASE_URI}" > "${BACKUP_FILE}"
log "CMS dump complete - $(du -sh "${BACKUP_FILE}" | cut -f1)"

log "Uploading CMS dump to R2..."
r2_put "${R2_ENDPOINT}" "${R2_ACCESS_KEY_ID}" "${R2_SECRET_ACCESS_KEY}" "${R2_BUCKET}" "${BACKUP_FILE}" "${S3_KEY}"
log "CMS upload complete - s3://${R2_BUCKET}/${S3_KEY}"

# The name goes into a SQL string below, so it is checked here, after the CMS backup, never before it.
if [[ ! "${PORTAL_DB_NAME}" =~ ^[a-z_][a-z0-9_]*$ ]]; then
  log "PORTAL_DB_NAME must match ^[a-z_][a-z0-9_]*\$ (got '${PORTAL_DB_NAME}')"
  exit 1
fi

PORTAL_EXISTS=$(psql "${DATABASE_URI}" -Atqc "SELECT 1 FROM pg_database WHERE datname = '${PORTAL_DB_NAME}'")
if [[ "${PORTAL_EXISTS}" == "1" ]]; then
  [[ -r "${PORTAL_ENV_FILE}" ]] || { log "${PORTAL_DB_NAME} exists but ${PORTAL_ENV_FILE} is not readable"; exit 1; }
  PORTAL_ENDPOINT=$(env_file_value "${PORTAL_ENV_FILE}" R2_ENDPOINT)
  PORTAL_BUCKET=$(env_file_value "${PORTAL_ENV_FILE}" R2_BUCKET)
  PORTAL_ACCESS_KEY=$(env_file_value "${PORTAL_ENV_FILE}" R2_ACCESS_KEY_ID)
  PORTAL_SECRET_KEY=$(env_file_value "${PORTAL_ENV_FILE}" R2_SECRET_ACCESS_KEY)
  if [[ -z "${PORTAL_ENDPOINT}" || -z "${PORTAL_BUCKET}" || -z "${PORTAL_ACCESS_KEY}" || -z "${PORTAL_SECRET_KEY}" ]]; then
    log "${PORTAL_ENV_FILE} must define R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
    exit 1
  fi
  if [[ "${PORTAL_BUCKET}" == "${R2_BUCKET}" && "${PORTAL_ENDPOINT}" == "${R2_ENDPOINT}" ]]; then
    log "refusing to put the portal dump in the CMS bucket (${R2_BUCKET}); it also serves public media"
    exit 1
  fi

  log "Dumping portal database ${PORTAL_DB_NAME}..."
  pg_dump -Fc "${PORTAL_DATABASE_URI}" > "${PORTAL_BACKUP_FILE}"
  pg_restore --list "${PORTAL_BACKUP_FILE}" > /dev/null
  log "Portal dump complete - $(du -sh "${PORTAL_BACKUP_FILE}" | cut -f1)"

  log "Uploading portal dump to R2..."
  r2_put "${PORTAL_ENDPOINT}" "${PORTAL_ACCESS_KEY}" "${PORTAL_SECRET_KEY}" "${PORTAL_BUCKET}" "${PORTAL_BACKUP_FILE}" "${PORTAL_S3_KEY}"
  log "Portal upload complete - s3://${PORTAL_BUCKET}/${PORTAL_S3_KEY}"
else
  log "WARNING: database ${PORTAL_DB_NAME} does not exist on this server; skipping the portal dump"
fi

# The heartbeat is the last thing that happens, so it fires only when every dump above succeeded.
if [[ -n "${BETTERSTACK_HEARTBEAT_URL:-}" ]]; then
  curl -fsS --max-time 10 "${BETTERSTACK_HEARTBEAT_URL}" > /dev/null || true
  log "Heartbeat pinged"
fi

log "Backup finished successfully - ${TIMESTAMP}"
