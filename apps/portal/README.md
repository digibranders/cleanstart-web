# CleanStart partner portal (clickable mock)

A real Next.js app with seeded mock data and no backend, built so the CleanStart team can walk through the whole partner portal and review it screen by screen. Every name, number and email is made up. Nothing is sent anywhere.

## Run it

```bash
pnpm --filter @cleanstart/portal dev      # http://localhost:3004
pnpm --filter @cleanstart/portal build
```

If a build fails with a `next/font/google` import-map error right after using `dev`, delete `apps/portal/.next` and build again.

## How to review

Open the app and use the **Walkthrough** button (bottom left). It lists the steps in order, jumps to the right screen as the right person, and highlights what to look at. Sign-in has two shortcut buttons (partner or CleanStart staff), and the walkthrough panel has links to switch role at any time.

The flows are live, so actions carry across screens: apply as a new company, approve the application as staff, register a deal as a partner, accept it as staff, then see the new status as the partner. Everything you do is also recorded in the Audit log.

State is kept in the browser's local storage so a reload does not lose your place. **Reset demo data** in the walkthrough panel restores the seeds.

## Hosting a review copy (Vercel)

1. Create a Vercel project from this repository with **Root Directory** set to `apps/portal`.
2. Add the environment variable `PORTAL_REVIEW_PASSWORD` (any shared password). With it set, every page asks for it (HTTP Basic, username ignored). Leave it unset for an open copy.
3. Search engines are blocked in three ways: `robots.txt`, an `X-Robots-Tag` header and page metadata.

## Where things live

- `src/components/screens/`: one file per screen, ported from the design boards.
- `src/data/`: seeded mock data, one persisted slice per area (`src/lib/slice.ts`).
- `src/components/shell/`: sidebar, top bar, search (Ctrl K), notifications and help, shared by every signed-in screen.
- `src/tour/`: the walkthrough steps. A screen takes part by carrying a `data-tour` attribute.
- `src/styles/portal.css`: the whole design, taken from the design boards.

## Not in this app

No real authentication, no HubSpot connection, no file storage and no email. Those belong to the real portal build.
