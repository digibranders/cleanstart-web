#!/usr/bin/env bash
# Creates, idempotently, the portal roles and one database for local development or tests.
# Usage: PGPASSWORD=<postgres password> scripts/db-create.sh <database-name> [--recreate]
#   --recreate drops the database first (and, for a *_test database, its four per-worker clones). Only ever
#   use it on this worktree's own databases; it deletes their data.
# The development role passwords below exist only on a developer's own Postgres, never on the droplet.
set -euo pipefail

name="${1:-}"
if [[ ! "$name" =~ ^[a-z][a-z0-9_]{0,62}$ ]]; then
  echo "usage: scripts/db-create.sh <database-name> [--recreate]  (lower case letters, digits and underscores)" >&2
  exit 2
fi

admin_url="${PORTAL_PG_ADMIN_URL:-postgresql://postgres@localhost:5432/postgres}"
admin_host="$(printf '%s' "$admin_url" | sed -E 's#^[a-z]+://([^@/]*@)?(\[[^]]*\]|[^:/]*).*$#\2#')"
case "$admin_host" in
  localhost|127.0.0.1|'[::1]'|'::1') ;;
  *)
    echo "refusing to run: PORTAL_PG_ADMIN_URL host \"$admin_host\" is not localhost, 127.0.0.1 or ::1. This script creates and drops databases and is for local use only." >&2
    exit 2
    ;;
esac
here="$(cd "$(dirname "$0")" && pwd)"

if [[ "${2:-}" == "--recreate" ]]; then
  targets=("$name")
  if [[ "$name" == *_test ]]; then
    for n in 1 2 3 4; do targets+=("${name}_w${n}"); done
  fi
  for target in "${targets[@]}"; do
    psql "$admin_url" -q -v ON_ERROR_STOP=1 -v dbname="$target" <<'SQL'
SELECT format('DROP DATABASE IF EXISTS %I WITH (FORCE)', :'dbname') \gexec
SQL
  done
fi

psql "$admin_url" -q -v ON_ERROR_STOP=1 \
  -v dbname="$name" \
  -v owner_password=portal_owner_dev \
  -v app_password=portal_app_dev \
  -v conn_limit=-1 \
  -v allow_createdb=on \
  -f "$here/db-bootstrap.sql"

hostport="$(printf '%s' "$admin_url" | sed -E 's#^[a-z]+://([^@/]*@)?([^/]+)/.*$#\2#')"
echo "Database $name is ready. Put these in apps/portal/.env:"
if [[ "$name" == *_test ]]; then
  echo "PORTAL_TEST_DATABASE_URL=postgresql://portal_app:portal_app_dev@$hostport/$name"
  echo "PORTAL_TEST_OWNER_URL=postgresql://portal_owner:portal_owner_dev@$hostport/$name"
else
  echo "DATABASE_URL=postgresql://portal_app:portal_app_dev@$hostport/$name"
  echo "DATABASE_OWNER_URL=postgresql://portal_owner:portal_owner_dev@$hostport/$name"
fi
