# @cleanstart/events

events.cleanstart.com. One registration page per event, co-branded with partner logos. Events and their registration forms are managed in the CMS; registrations are saved there as leads.

## Add an event (no code)

In the CMS, open **Marketing > Event Registrations > Create new**:

- Title and slug (the slug is the URL: `events.cleanstart.com/<slug>`).
- Partners: name, website and a logo for each co-host. CleanStart is added automatically as the first logo. Upload logos that read on a dark background (white or light). Without one the name is shown as text.
- Optional date label, venue and description.
- Registration form: leave empty for the default form (`event-registration`), or pick another form from **Forms** for different questions. Fields can show only when another answer matches (for example pick up and drop only when a cab is needed).
- Set **Status** to Published. Changes show on the site within a minute.

Open an event to see who registered, and to export the list as CSV.

## How it fits together

- The site reads published events from `GET {CMS}/api/eventPages/site` and `/site/<slug>`, which also return the event's form definition.
- Registrations post to `{CMS}/api/leads/submit` with `source: event:<slug>`. That tag is what the CMS uses to count and list an event's registrations.
- The CMS allows the origin through `LEAD_SUBMIT_ALLOWED_ORIGINS`, and Cloudflare Turnstile protects the form.

## First-time setup in an environment

Run `apps/cms/scripts/seed-event-form.ts` once to create the default form and the first event (see its header for how to run it against production).

## Local

```bash
pnpm --filter @cleanstart/events dev   # http://localhost:3005
```

Copy `.env.example` to `.env.local`. The CMS must be running at `NEXT_PUBLIC_CMS_URL`, with this site's origin in its `LEAD_SUBMIT_ALLOWED_ORIGINS`.
