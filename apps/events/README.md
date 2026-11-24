# @cleanstart/events

Registration pages for CleanStart events (events.cleanstart.com). One page per event at `/<slug>`, co-branded with partner logos. Submissions go to the CMS lead API and are stored in the CMS database.

## Add an event

1. Add an entry to `src/content/events.ts` (slug, title, `formSlug`, `partners`).
2. Put partner logos in `public/logos/` and set `logo` (and `logoWidth`) on the partner. The logo bar sits on a dark band, so use white or light versions. Without a `logo` the partner name is set as a text wordmark.
3. Create the matching row in the CMS `forms` collection (below).

## CMS `forms` row for `new-year-networking`

| name | type | required | condition |
|---|---|---|---|
| `full_name` | text | yes | |
| `designation` | text | yes | |
| `company` | text | yes | |
| `phone` | tel | yes | |
| `cab_required` | select (`yes`, `no`) | yes | |
| `pickup_location` | text | yes | show when `cab_required` is `yes` |
| `drop_location` | text | yes | show when `cab_required` is `yes` |

Field names must match exactly (see `API_FIELD` in `src/lib/event-form.ts`). The form has no email field, so the CMS falls back to no email on the lead. HubSpot relay and duplicate detection need an email; leave HubSpot unticked for this form.

## CMS and Turnstile setup

- Add `https://events.cleanstart.com` to `LEAD_SUBMIT_ALLOWED_ORIGINS` on the CMS droplet. Without it every submit is refused with a 403.
- Add the hostname to the Turnstile widget and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

## Local

```bash
pnpm --filter @cleanstart/events dev   # http://localhost:3005
```

Copy `.env.example` to `.env.local`. The CMS must be running at `NEXT_PUBLIC_CMS_URL` for submits to succeed.
