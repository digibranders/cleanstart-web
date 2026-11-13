#!/usr/bin/env bash
# Restore drill for the partner portal database: restores a backup into a SCRATCH database and checks it.
# It never touches the live database. Log each drill in docs/operations/RESTORE-LOG.md.
#
# Usage:
#   ALLOW_RESTORE=yes ./restore-portal-drill.sh                          # list portal backups in R2
#   ALLOW_RESTORE=yes ./restore-portal-drill.sh 2026-11-20T02:00:00Z     # download that backup and restore it
#   ALLOW_RESTORE=yes ./restore-portal-drill.sh --file /tmp/portal.dump  # restore a local dump
#
# Required env vars:
#   ALLOW_RESTORE             - must be exactly 'yes'
# Optional env vars:
#   PGPASSWORD                - the superuser password. It stays in the environment so it never appears in a command line.
#   PORTAL_DRILL_ADMIN_URI    - superuser connection to the maintenance database, WITHOUT a password
#                               (default postgres://postgres@127.0.0.1:5432/postgres)
#   PORTAL_DRILL_DB           - scratch database name; it must contain "drill" (default cleanstart_portal_drill)
#   PORTAL_DB_NAME            - the live portal database, which the drill refuses to overwrite (default cleanstart_portal)
#   PORTAL_ENV_FILE           - portal env file with the R2 settings (default /opt/cleanstart/portal.env)
#   PORTAL_DRILL_TABLES       - space separated tables that must exist and be readable after the restore
#   KEEP_DRILL_DB             - set to 1 to keep the scratch database for inspection
set -euo pipefail
umask 077

log() { echo "[portal-drill] $*" >&2; }

if [[ "${ALLOW_RESTORE:-}" != "yes" ]]; then
  log "ERROR: set ALLOW_RESTORE=yes to proceed."
  exit 1
fi

PORTAL_DB_NAME="${PORTAL_DB_NAME:-cleanstart_portal}"
DRILL_DB="${PORTAL_DRILL_DB:-cleanstart_portal_drill}"
PORTAL_ENV_FILE="${PORTAL_ENV_FILE:-/opt/cleanstart/portal.env}"
ADMIN_URI="${PORTAL_DRILL_ADMIN_URI:-postgres://postgres@127.0.0.1:5432/postgres}"
DRILL_URI="${ADMIN_URI%/*}/${DRILL_DB}"
TABLES="${PORTAL_DRILL_TABLES:-users partners registrations registration_events documents audit_log hubspot_outbox invites}"

if [[ ! "${DRILL_DB}" =~ ^[a-z_][a-z0-9_]*$ || "${DRILL_DB}" != *drill* ]]; then
  log "PORTAL_DRILL_DB must be a lower case identifier that contains 'drill' (got '${DRILL_DB}')"
  exit 1
fi
if [[ "${ADMIN_URI}" =~ ^[a-z]+://[^/@]*:[^/@]*@ ]]; then
  log "PORTAL_DRILL_ADMIN_URI must not contain a password (it would show in the process list); set PGPASSWORD instead"
  exit 1
fi
if [[ "${DRILL_DB}" == "${PORTAL_DB_NAME}" || "${DRILL_DB}" == "cleanstart" || "${DRILL_DB}" == "postgres" ]]; then
  log "refusing to use '${DRILL_DB}' as the scratch database"
  exit 1
fi

# The last value of KEY in a KEY=VALUE env file, read literally (the file is never sourced).
env_file_value() {
  local file="$1" key="$2" line value=""
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" == "${key}="* ]]; then value="${line#*=}"; fi
  done < "${file}"
  printf '%s' "${value}"
}

r2() {
  AWS_ACCESS_KEY_ID="$(env_file_value "${PORTAL_ENV_FILE}" R2_ACCESS_KEY_ID)" \
  AWS_SECRET_ACCESS_KEY="$(env_file_value "${PORTAL_ENV_FILE}" R2_SECRET_ACCESS_KEY)" \
    aws --endpoint-url "$(env_file_value "${PORTAL_ENV_FILE}" R2_ENDPOINT)" "$@"
}

DUMP_FILE=""
DOWNLOADED=""
cleanup() {
  if [[ -n "${DOWNLOADED}" ]]; then rm -f "${DOWNLOADED}"; fi
  if [[ "${KEEP_DRILL_DB:-}" != "1" ]]; then
    psql -X "${ADMIN_URI}" -qc "DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)" > /dev/null 2>&1 || true
  fi
}

case "${1:-}" in
  "")
    [[ -r "${PORTAL_ENV_FILE}" ]] || { log "${PORTAL_ENV_FILE} is not readable"; exit 1; }
    log "available portal backups:"
    r2 s3 ls "s3://$(env_file_value "${PORTAL_ENV_FILE}" R2_BUCKET)/portal-backups/" | sort
    exit 0
    ;;
  --file)
    DUMP_FILE="${2:?--file needs a path}"
    [[ -r "${DUMP_FILE}" ]] || { log "${DUMP_FILE} is not readable"; exit 1; }
    ;;
  *)
    [[ -r "${PORTAL_ENV_FILE}" ]] || { log "${PORTAL_ENV_FILE} is not readable"; exit 1; }
    DOWNLOADED="/tmp/cleanstart-portal-drill-$(date -u +%s).dump"
    DUMP_FILE="${DOWNLOADED}"
    ;;
esac

# Installed only now: listing mode and a bad --file exit above and must never drop a scratch database kept with KEEP_DRILL_DB=1.
trap cleanup EXIT

if [[ -n "${DOWNLOADED}" ]]; then
  log "downloading portal-backups/$1.dump..."
  r2 s3 cp "s3://$(env_file_value "${PORTAL_ENV_FILE}" R2_BUCKET)/portal-backups/$1.dump" "${DUMP_FILE}"
fi

START=$(date -u +%s)
log "creating scratch database ${DRILL_DB}"
psql -X "${ADMIN_URI}" -qc "DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)" -c "CREATE DATABASE ${DRILL_DB}"

log "restoring ${DUMP_FILE}"
pg_restore --no-owner --no-privileges --exit-on-error -d "${DRILL_URI}" "${DUMP_FILE}"

log "checking restored data"
for table in ${TABLES}; do
  [[ "${table}" =~ ^[a-z_][a-z0-9_]*$ ]] || { log "bad table name '${table}'"; exit 1; }
  count=$(psql -X "${DRILL_URI}" -Atqc "SELECT count(*) FROM ${table}")
  log "  ${table}: ${count} rows"
done
if psql -X "${DRILL_URI}" -Atqc "SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log'" | grep -q 1; then
  log "  newest audit_log entry: $(psql -X "${DRILL_URI}" -Atqc "SELECT coalesce(max(at)::text, 'none') FROM audit_log")"
fi

log "drill passed in $(( $(date -u +%s) - START )) seconds. Add a line to docs/operations/RESTORE-LOG.md."
