# Restore Log

Running log of restore drills and production restores per Phase I4 (arch doc §`#decisions` restore drill row).

Each entry should be made within 24 hours of the drill or restore event.

| Date | Backup restored | Duration | Performed by | Notes |
|------|----------------|----------|--------------|-------|
| *(first drill pending)* | | | | Schedule after staging droplet is live |
| 2026-11-17 | portal-backups/2026-11-17T13:54:47Z.dump (local MinIO, not R2) | under 1 second | portal build round 3 | Local rehearsal only: infra/scripts/backup.sh then restore-portal-drill.sh against a seeded local Postgres 16 and MinIO, heartbeat URL stubbed. Row counts matched the live copy for all eight drill tables (users 38, partners 21, registrations 15, registration_events 29, documents 12, audit_log 13, hubspot_outbox 0, invites 4) and pg_policies matched (62). The first drill against real R2 and the droplet is still pending. |
