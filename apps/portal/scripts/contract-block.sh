#!/usr/bin/env bash
# Prints one fenced code block of the contracts file, without the fence lines.
# Usage: bash apps/portal/scripts/contract-block.sh "### C.1 " 1 > apps/portal/src/db/schema.ts
#   $1  the start of the section heading, e.g. "### C.1 " or "## E. Errors"
#   $2  which fenced block under that heading, counting from 1
# The copy is mechanical on purpose: the contracts file is the single source for these files.
set -euo pipefail

heading="${1:?heading prefix required, for example '### C.1 '}"
want="${2:?block number required, counting from 1}"
here="$(cd "$(dirname "$0")" && pwd)"
contracts="${PORTAL_CONTRACTS_FILE:-$here/../../../docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md}"

awk -v heading="$heading" -v want="$want" '
  index($0, heading) == 1 { insec = 1; blocks = 0; infence = 0; next }
  insec && !infence && /^## |^### / { insec = 0 }
  insec && /^```/ {
    if (infence) { infence = 0; if (blocks == want) exit } else { infence = 1; blocks++ }
    next
  }
  insec && infence && blocks == want { print; found = 1 }
  END { if (!found) { print "contract-block: no block " want " under \"" heading "\"" > "/dev/stderr"; exit 1 } }
' "$contracts"
