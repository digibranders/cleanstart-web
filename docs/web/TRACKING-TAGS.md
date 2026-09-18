# Tracking tags

Canonical inventory of every third-party tag on www.cleanstart.com. Update this
file in the same change as any tag change, whether the change is in code or in
GTM.

## How tags are loaded

One Google Tag Manager container, loaded by
`apps/web/src/components/analytics/GtmHeadScript.tsx` in the document head,
immediately after the Consent Mode v2 defaults from
`apps/web/src/lib/consent/consent-mode-snippet.ts`.

GTM owns the tags. Code owns four things GTM cannot do safely:

1. **The loader and its host gate.** `lib/analytics/gtm-snippet.ts` refuses to
   load the container on any host listed in `lib/seo/indexing.ts`, so
   `*.vercel.app` preview deploys never fire a tag, even though they share the
   production build and its `NEXT_PUBLIC_GTM_ID`.
2. **Consent Mode defaults.** Queued before the container boots, so every tag
   evaluates the correct state. Region-scoped: `analytics_storage` is denied
   inside the EEA, UK and Switzerland until opt-in and granted elsewhere. All
   advertising signals (`ad_storage` and friends) are denied everywhere until a
   Targeting opt-in. `ConsentProvider.tsx` sends the update when the visitor
   decides.
3. **The dataLayer contract.** `lib/analytics/track.ts` is the only place
   application code pushes events. Params are typed against its
   `EVENT_PARAM_KEYS` list, which it nulls before every push because GTM data
   layer variables otherwise persist into later events.
4. **The CSP.** `lib/security/csp.ts` allow-lists each vendor's hosts. A new
   vendor added in GTM still needs a code change here first, or its beacons are
   blocked.

## Live tags

| Tag | ID | Where it is configured | Consent requirement |
|---|---|---|---|
| Google Tag Manager | set in Vercel | `NEXT_PUBLIC_GTM_ID`, Vercel Production only | None. The container itself sets no cookies. |
| GA4 | `G-S6T47D7PZR` | GTM: Google tag on Initialization, plus one GA4 event tag per event | Consent Mode only, no extra GTM check. GA4 stays unmodeled outside the EEA/UK/CH (business decision, 2026-07-22). |
| Microsoft Clarity | see GTM | GTM: Custom HTML on All Pages | `analytics_storage` |
| Apollo.io | `691b73cb5443850011f553d1` | GTM: Custom HTML on All Pages | `ad_storage` (Targeting) |
| Leadfeeder / Dealfront | `kn9Eq4RXRqJ8RlvP` | GTM: Custom HTML on All Pages | `ad_storage` (Targeting) |

Not tracking tags, listed so nobody goes looking for them:

- **Cloudflare Turnstile** is bot protection on forms,
  `components/TurnstileWidget.tsx`.
- **Web Vitals to Sentry** is our own performance reporting, mounted in
  `components/consent/GatedAnalytics.tsx` behind the Performance category.
- **GA4 Data API, Search Console, Clarity Data Export, Cloudflare Web
  Analytics** in `apps/cms` are server-side reads for the admin dashboard. They
  put nothing in the visitor's browser.

## GA4 events

Pushed by `lib/analytics/track.ts`. Each needs a Custom Event trigger and a GA4
event tag in GTM.

| Event | Params | Pushed from |
|---|---|---|
| `page_view` | `page_location`, `page_title`, `page_referrer` | `Ga4RouteTracker.tsx` (SPA navigations only; the hard load comes from the Google tag) |
| `generate_lead` | `form_name`, `gated` | Book a demo, contact, become a partner, gated download forms |
| `file_download` | `resource_slug`, `resource_title`, `gated` | `ResourceDownloadButton.tsx`, `ResourceGateModal.tsx` |
| `deal_registration` | `marketing_opt_in` | `DealRegistrationForm.tsx` |
| `job_application` | `job_slug` | `JobApplyForm.tsx` |
| `newsletter_signup` | `form_name` | `useNewsletterSignup.ts` |
| `thank_you_view` | `form_name` | `ThankYouTracker.tsx` |
| `cta_click` | `cta`, `page`, `video_id` | `LibrariesHero.tsx` |
| `search` | `search_term`, `search_results`, `search_scope` | `SearchCommandPalette.tsx`, `SearchAutocomplete.tsx` |

The GA4 property's Enhanced Measurement "page changes based on browser history
events" toggle must stay OFF, or every SPA navigation counts twice.

## Adding a tag

1. Add the vendor's hosts to `lib/security/csp.ts` with a test in
   `csp.test.ts`, and deploy that first.
2. Build the tag in a GTM workspace with the right consent check, paused.
3. Verify it in GTM Preview against www.cleanstart.com.
4. Unpause, publish, and add a row to the table above.

## Adding an event or parameter

1. Add the event name to `Ga4EventName`, or the parameter key to
   `EVENT_PARAM_KEYS`, in `lib/analytics/track.ts`.
2. In GTM, add the Data Layer Variable, the Custom Event trigger and the GA4
   event tag.
3. Add it to the events table above.

## Publish rights

GTM publish permission is limited to named individuals. A publish puts
arbitrary JavaScript on production with no code review and leaves no trace in
git.
