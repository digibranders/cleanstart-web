# Migration Dry-Run Report — {date}

> Copy this template to `docs/migration/dry-run-{date}.md`, fill in every field, and sign off before cutover is scheduled.

## Environment

| Field | Value |
|---|---|
| Date | {date} |
| Staging droplet IP | {IP} |
| Database snapshot taken at | {datetime} |
| Payload version | {version} |
| Webflow export file | {filename or S3 path} |
| Operator | {name} |

---

## Steps executed

### H1 — Webflow export
- [ ] `export.ts` ran without errors
- Webflow item count: {n}
- Duration: {duration}
- Output file: {path}

### H3 — Per-collection transforms
- [ ] All transform scripts completed with zero schema errors
- Collections processed: {list}
- Total docs transformed: {n}
- Transformation errors: {n} (attach log if > 0)

### H5 — Asset upload to R2
- [ ] `upload-assets.ts` completed
- Assets uploaded: {n}
- SHA-256 mismatches: {n} (must be 0)
- Skipped (already present): {n}

### H6 — Payload import
- [ ] `import.ts` ran to completion
- Docs created: {n}
- Docs updated: {n}
- Errors: {n} (attach log if > 0)

### H7 — URL parity
- [ ] `url-parity.ts` ran
- Webflow URLs: {n}
- New CMS URLs: {n}
- Missing in CMS: {n} (must be 0 or documented below)

### H8 — Acceptance-criteria gate
- [ ] All 9 acceptance criteria passed

---

## Acceptance check results

Paste the full output of `pnpm --filter @cleanstart/cms ts-node migrations/webflow-import/acceptance-check.ts` here:

```
{paste output}
```

| # | Criterion | Result |
|---|---|---|
| 1 | All docs imported without errors | ✅ / ❌ |
| 2 | URL parity: every Webflow slug maps to a CMS slug | ✅ / ❌ |
| 3 | Assets accessible via R2 CDN URL | ✅ / ❌ |
| 4 | JSON-LD validates for one fixture per collection | ✅ / ❌ |
| 5 | Sitemaps include all imported slugs | ✅ / ❌ |
| 6 | Redirects created for any slug changes | ✅ / ❌ |
| 7 | Search index populated (Meili doc count ≥ import count) | ✅ / ❌ |
| 8 | Leads submit correctly on staging | ✅ / ❌ |
| 9 | Admin login + publish workflow succeeds | ✅ / ❌ |

---

## URL parity exceptions

Document any URLs present in Webflow but not matched in the new CMS, with justification:

| Webflow URL | Status | Reason |
|---|---|---|
| | | |

---

## Rollback drill

- [ ] Rollback drill executed (see `docs/operations/RESTORE-LOG.md` for entry)
- Restore timestamp used: {backup datetime}
- Time to restore: {duration}
- Webflow DNS repointed: ✅ / ❌
- Webflow serving correctly after rollback: ✅ / ❌

---

## Sign-off

- [ ] All 9 acceptance criteria pass
- [ ] URL parity exceptions reviewed and accepted
- [ ] Rollback drill executed and logged
- [ ] Ready for cutover scheduling

Signed off by: {name} on {date}
