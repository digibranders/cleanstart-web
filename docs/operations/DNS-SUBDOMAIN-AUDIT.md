# DNS / Subdomain Audit — cleanstart.com

**Audit date:** 2026-07-20 · **Live re-verified:** 2026-07-20 ~08:1x
**DNS host:** Cloudflare (`garret.ns.cloudflare.com`, `gene.ns.cloudflare.com`)
**Ground-truth source:** Cloudflare zone export (`cleanstart.com.txt`, exported 2026-07-20 07:35 UTC; re-exported 08:09 UTC — **records byte-for-byte identical**, only the SOA serial ticked), reconciled with live DNS resolution, HTTP probes, Certificate Transparency logs (crt.sh), and repo cross-reference.

> **How to refresh this audit:** re-export the zone from the Cloudflare dashboard, re-run live probes (`dig`/`curl`) against each host, and diff against the tables below. CT logs (`crt.sh/?q=%25.cleanstart.com`) surface historical hostnames; the zone export is the definitive current list.

---

## Summary

- **~21 host subdomains** currently carry an address record; all serve legitimate traffic **except `demo`** (origin down) and **`staging`** (orphaned Vercel verification, no address record).
- Email/identity plumbing (M365, Trend Micro, Brevo, HubSpot, Zoho, SES DKIM, SPF, DMARC) is functional — keep.
- **~11 records are redundant / broken / stale cruft** and are cleanup candidates (see table below).
- The old cPanel / VPN / webmail hostnames visible in CT logs (`cpanel`, `owa`, `webmail`, `mail`, `smtpauth`, `rdp`, `vpn2`, `sslvpn3`, `ww1`, `ww12`, `admin`, `login`, `portal`, `my`, `connect`, `sitemap`, etc.) **are not in the current zone** — already removed. Only expiring historical certs remain. **No dangling records, no subdomain-takeover risk from them.**

---

## ✅ Live hosts, actively used

| Subdomain | Target | Proxied | Notes |
|---|---|:---:|---|
| `cleanstart.com` / `www` / `preview` | Vercel (`…vercel-dns-017.com`) | no | apex → www redirect · marketing site (`apps/web`) · preview deploys |
| `cms` | `64.227.152.63` (DO droplet) | **yes** | Payload CMS behind Cloudflare WAF |
| `cdn` | `public.r2.dev` | **yes** | R2 media CDN — `R2_PUBLIC_BASE=https://cdn.cleanstart.com`. Root 404 is expected (bucket root). |
| `platform` | `136.110.142.160` (GCP) | no | product dashboard |
| `console` | `34.107.130.8` (GCP) | no | product dashboard (⚠ same "CleanStart Dashboard" as `platform`) |
| `api-console` | `34.49.218.126` (GCP) | no | console backend API |
| `auth` | `34.117.0.176` (GCP) | no | auth service |
| `discovery` | `34.54.227.128` (GCP) | no | service discovery |
| `sec-pkg` | `35.232.252.93` (GCP) | no | secure package registry (zone comment: *"secure package testing POC"*) |
| `cleansight` | `136.116.90.193` (GCP) | no | CleanSight product |
| `clnstrt-images` | `35.202.103.140` (GCP) | no | Harbor container registry (comment: *"new repo"*) |
| `images` | `35.227.232.20` (GCP) | no | hardened-image catalog site (23 repo refs) |
| `academy` | `ghs.googlehosted.com` | no | Academy on Google Sites — kept in active use |
| `supporting-api` | `34.36.201.170` (GCP) | no | FastAPI backend |
| `ticketing-api` | `34.110.152.44` (GCP) | no | FastAPI backend (comment: *"ticketing-api ingress"*) |
| `uvdesk-support` | `34.61.143.205` (GCP) | no | UVdesk helpdesk |

## ✉️ Email / Microsoft 365 / identity plumbing — keep (functional)

- **Mail flow:** MX → `cleanstart.in.tmes.trendmicro.com` (pri 0, Trend Micro Email Security gateway) → `cleanstart-com.mail.protection.outlook.com` (pri 100, M365).
- **`autodiscover`** → `autodiscover.outlook.com` (M365).
- **`enterpriseenrollment`** / **`enterpriseregistration`** → Intune / Azure AD device MDM.
- **DKIM:** Brevo (`brevo1/2._domainkey`), HubSpot (`hs1/2-245478611._domainkey`), M365 (`selector1/2._domainkey`, via `triamsecurity1` tenant), Amazon SES (3× `…_domainkey`, labeled "HPE"), Zoho (`7192214634._domainkey`), Trend Micro (`tm-dkim-…`).
- **SPF:** `v=spf1 include:spf.protection.outlook.com include:zcsend.in include:one.zoho.in include:245478611.spf01.hubspotemail.net include:spf-us.tmes.trendmicro.com ~all`
- **DMARC:** `p=quarantine; sp=quarantine; rua/ruf=itadmin@cleanstart.com` — consider progressing to `p=reject` once confident.
- **`_index._agents`** HTTPS/SVCB → www (AI-agent discovery convention) — intentional.

---

## 🧹 Unused / redundant / cleanup candidates

| # | Record | State | Recommended action |
|---|---|---|---|
| 1 | **`demo`** | CNAME → AWS `52.203.42.211`, origin **down (HTTP 522)**, 0 repo refs | **Delete** (or restore origin). Dangling proxied record. |
| 2 | **`community-api`** | CNAME → Vercel; 404 at root; **marked unused** (no longer in use) | **Delete** the DNS record + drop the `_vercel` community-api verify TXT + remove the Vercel domain. |
| 3 | **`staging`** | `_vercel` verify TXT present but **no A/CNAME** → does not resolve | Add the record **or** remove the Vercel domain + drop the stale `_vercel` staging TXT. Reconcile with the 24 doc references. |
| 4 | **`cms-dev`** | CNAME → `…cfargotunnel.com` (cloudflared **dev tunnel**), proxied — **currently HTTP 530 (tunnel down)** | Confirm it should be publicly exposed; remove if it's a personal dev box. Dev tunnel in prod DNS = exposure risk. |
| 5 | **`console` vs `platform`** | Both render identical "CleanStart Dashboard" | Confirm canonical host; redirect/retire the other. Old KB links to `console` were flagged broken in the `unlink_broken_kb_links` migration. |
| 6 | **`lyncdiscover`, `sip`, `_sip._tls`, `_sipfederationtls._tcp`** | Skype for Business / Lync — **Microsoft retired SfB Online in 2021** | **Delete** — dead legacy M365 records. |
| 7 | **`_webflow`** TXT | One-time Webflow verification; site is off Webflow | **Delete.** |
| 8 | **`65959215` → google.com**, **`bybjp2njlugi` → googlehosted** | One-time Google verification tokens | Delete once verification is confirmed persisted elsewhere. |
| 9 | **`_visual-studio-marketplace-cleanstart`** TXT | VS Marketplace publisher verification | Delete if not publishing an extension. |
| 10 | **In-zone NS: `ns67`/`ns68.domaincontrol.com`** | GoDaddy nameservers as apex NS records — **mismatch** with the real Cloudflare delegation | **Delete** — leftover from the GoDaddy → Cloudflare migration. |
| 11 | **3× Amazon SES DKIM** (`…_domainkey`, labeled "HPE") | SES DKIM keys | Verify you actually send via SES; remove if not. |

**`sec-pkg`** (zone comment "POC") — verify it's still needed; otherwise a further cleanup item.

---

## Notes & observations (not cleanup items)

- **M365 tenant:** DKIM selectors reference a `triamsecurity1` tenant — email runs under a Triam Security M365 tenant. Relevant for identity/security audits.
- **No wildcard record** (`*.cleanstart.com`) — verified; good.
- **Cloudflare NODATA behavior:** Cloudflare answers `NOERROR`/NODATA (not `NXDOMAIN`) for names not in the zone, so external `dig` cannot distinguish a dangling record from a non-existent name. The zone export is the only reliable source for "what records exist."
- **CT-log-only hostnames** (historical certs, not in zone): `cpanel`, `webmail`, `owa`, `mail`, `mailer`, `smtpauth`, `hostmaster`, `m`, `ww1`, `ww12`, `sslvpn3`, `vpn2`, `rdp`, `att`, `hrbr`, `admin`, `login`, `portal`, `my`, `connect`, `sitemap`. Remnants of pre-Cloudflare shared/on-prem hosting; certs expire on their own.
