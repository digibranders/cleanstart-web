# Droplet access — quick reference

Public connection details for the production CMS droplet. Non-secret values only.
The SSH key passphrase lives in the operator's secrets store (see `docs/CMS-DEPLOYMENT.md` §6).

## Production CMS droplet

| Field | Value |
|---|---|
| Hostname | `cleanstart-cms` |
| Public IP | `64.227.152.63` |
| Public hostname | `cms.cleanstart.com` (Cloudflare-proxied) |
| OS | Ubuntu 24.04.4 LTS |
| Spec | 2 GB RAM / 1 vCPU / 48 GB disk, DO Bangalore (BLR1) |
| SSH user | `root` (no separate `deploy` user — see `docs/CMS-DEPLOYMENT.md` row 29) |
| Operator key | `~/.ssh/id_ed25519` on the operator Mac (registered with DO as `mac-mini-gaurav-jadhav`) |
| GHA deploy key | `~/.ssh/gha-deploy` (private, on operator Mac); public also in `/root/.ssh/authorized_keys` on the droplet |

## Connect from your Mac (interactive)

```bash
ssh root@64.227.152.63
```

If you have not pre-loaded the SSH key into the macOS keychain agent, you will be
prompted for the operator-key passphrase. To unlock once per Mac reboot:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

After that, all SSH (including Claude's Bash tool) inherits the unlocked key.

## Quick sanity checks on the droplet

```bash
# Container health
docker ps

# Live RAM
free -m | awk 'NR==2'

# Cms container logs (last 50 lines)
docker logs --tail 50 cleanstart-cms-1

# Postgres reachable + Meilisearch healthy
docker compose -f /opt/cleanstart/compose.yml exec -T postgres pg_isready -U postgres -d cleanstart
curl -sS http://127.0.0.1:7700/health

# Disk
df -h /
```

## Re-rendering /opt/cleanstart/.env outside a deploy

The deploy workflow (`.github/workflows/deploy-cms.yml`) re-renders `.env` from
the GitHub Variables + Secrets on every run. If you ever need to change a value
without doing a full deploy:

1. Update the relevant GitHub Variable or Secret
2. Trigger the workflow manually: GitHub → Actions → Deploy CMS → "Run workflow"

Editing `.env` by hand on the droplet works but the next deploy will overwrite
your edit. Don't rely on hand edits surviving.

## Bootstrap snippet for a fresh Claude session

If a new Claude session needs to SSH to the droplet, paste this:

> Droplet is `cleanstart-cms` at `64.227.152.63`, user `root`. SSH key at
> `~/.ssh/id_ed25519` on the operator Mac, passphrase stored in operator's
> secrets store (RoboForm `CleanStart CMS/Infrastructure access/DO droplet`).
> If `ssh-add -l` shows the key loaded, just `ssh root@64.227.152.63`; if not,
> the operator needs to `ssh-add --apple-use-keychain ~/.ssh/id_ed25519` once
> and re-enter the passphrase.

## Related

- Full deploy runbook: `docs/CMS-DEPLOYMENT.md`
- Architecture context: `docs/cleanstart-cms-architecture.html` §`#hosting`, §`#droplet-tuning`
- Rollback procedure: `docs/migration/rollback-runbook.md`
