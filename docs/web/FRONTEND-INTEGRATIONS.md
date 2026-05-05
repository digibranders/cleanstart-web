# FRONTEND-INTEGRATIONS.md — apps/web

Third-party scripts, embeds, and APIs the web app loads in the browser. The
backend integrations dashboard (Teams, Zoho, GA4 server-side, etc.) lives
in CMS — see [`docs/INTEGRATIONS-RESEARCH.md`](../INTEGRATIONS-RESEARCH.md).

This file covers **Tier 5** from that research note (frontend integrations).

> **Hard rules** (CLAUDE.md):
> - Never load 3rd-party scripts before consent unless strictly necessary.
> - Never expose CMS secrets to the browser (only `NEXT_PUBLIC_*` are
>   browser-safe).
> - Forms always proxy through `apps/cms /api/leads/submit`.

---

## 1 · Third-party JavaScript budget

**Cap: 80 KB compressed total** for all third-party scripts loaded on a
single route, including the strategically-loaded ones below. Per
[`WEB-ARCHITECTURE.md §13`](./WEB-ARCHITECTURE.md#13--performance-budget--a-contract).
This is enforced by a CI report that walks `webpack-bundle-analyzer`
(or Next equivalent) per-route and lists every chunk imported from a
non-`/apps/web/` source.

Adding any new integration on this list requires:
1. Measuring its compressed size on the slowest expected route.
2. Confirming the route still meets the budget after addition.
3. If it doesn't: ship a trade-off ticket that removes another
   integration first, OR justify the breach in the PR description.

**Loading-strategy hierarchy** (cheapest first; pick the lowest tier
that still works):

1. **Server-side only** — render markup or fetch data on the server,
   ship zero JS to the client. Default for things like JSON-LD,
   metadata, sitemap.
2. **`<Script strategy="lazyOnload">`** — wait for the load event +
   first idle. Default for chat widgets, non-critical analytics.
3. **`<Script strategy="afterInteractive">`** — runs after hydration,
   before idle. Default for GTM, Turnstile.
4. **`<Script strategy="beforeInteractive">`** — blocking; only for
   safety-critical inline scripts (rare). Document the why in code.
5. **`<Script strategy="worker">`** — Partytown for analytics that hold
   up INP. Available but not the default; evaluate per integration.

## 2 · Consent gate

GDPR-style consent-mode v2. Implementation:

1. First load → consent default `denied` for `analytics_storage`,
   `ad_storage`, `personalization_storage`. `functionality_storage` and
   `security_storage` granted (necessary for preview cookie + Turnstile).
2. `<CookieBanner>` renders if no consent cookie. Three buttons:
   "Accept all", "Reject", "Customize".
3. On accept/customize → write `consent` cookie (1y) +
   `gtag('consent', 'update', { … })` → analytics scripts allowed to fire.
4. Until consent given:
   - GA4 + GTM **do not load** at all.
   - Intercom / Drift / Crisp **do not load**.
   - Calendly inline embed **lazy-loads** (functional, not analytic — but
     respect Calendly's own privacy posture).
   - Sentry browser SDK loads in a *minimum* mode (no Replay, no PII).

`lib/consent.ts` exports `useConsent()` hook + `<ConsentGate>` wrapper.
Components that need analytics consent declare it explicitly.

---

## 3 · Google Analytics 4 + Tag Manager

### Strategy

GA4 is loaded **client-side via GTM** (single Tag Manager container). The
CMS also fires server-side GA4 events via Measurement Protocol for
high-fidelity events (lead submit, gated download); see
`docs/INTEGRATIONS-RESEARCH.md` Tier 3.

### Loader

```tsx
// app/layout.tsx
<Script
  id="gtm"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
    `,
  }}
/>
{consent.analytics && process.env.NEXT_PUBLIC_GTM_ID && (
  <Script
    id="gtm-loader"
    strategy="afterInteractive"
    src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
  />
)}
```

GTM container loaded only when consent granted. Datalayer initialised
unconditionally (no PII in it).

### Events

`lib/analytics.ts` exports a typed `track()` helper. All events:

| Event | Trigger | Payload |
|---|---|---|
| `page_view` | Route change | `path`, `title`, `referrer` |
| `cta_click` | Any `<Button data-cta="…">` click | `cta_label`, `cta_location` |
| `lead_submit` | LeadForm success | `form_id`, `page_path` (no PII) |
| `lead_submit_error` | LeadForm error | `form_id`, `error_code` |
| `search` | Search submit | `query` (≤ 32 chars, no PII) |
| `search_result_click` | SERP click | `query`, `result_path`, `position` |
| `404_view` | not-found render | `path`, `referrer` |
| `download` | Resource download | `resource_id`, `gated: bool` |
| `video_play` | Embed play | `video_id`, `provider` |
| `outbound_click` | Anchor to non-cleanstart.com host | `target_host`, `target_path` |

PII scrubbing is centralised: `track()` rejects payloads with keys
matching `/email|phone|name|company|address/i` — fails the build in dev,
silently scrubs in prod.

### Consent-mode v2

```ts
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500,
});
```

On consent update, GTM picks up the changed state automatically.

---

## 4 · Cloudflare Turnstile

CAPTCHA on lead-submit, Book-a-Demo, gated resource forms.

### Why Turnstile

Already chosen for CMS (`apps/cms/.env.example` lists `TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY`). Frontend uses the same site key.

### Loader

```tsx
// components/integrations/Turnstile.tsx
'use client';
import Script from 'next/script';

export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-callback="__onTurnstile"
        data-theme="light"
      />
    </>
  );
}
```

Script hosted on `challenges.cloudflare.com` (CSP allow-listed in
WEB-ARCHITECTURE §10).

### Server-side verification

Token submitted with the lead body to `/api/leads/submit` proxy → CMS
verifies via Cloudflare API. **Never** verify client-side.

---

## 5 · Calendly (book-a-demo, sales scheduling)

### Loader

```tsx
// components/integrations/CalendlyEmbed.tsx
'use client';

export function CalendlyEmbed({ url }: { url: string }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://assets.calendly.com/assets/external/widget.css"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <div
        className="calendly-inline-widget min-h-[700px]"
        data-url={url}
      />
    </>
  );
}
```

Variants: inline (book-a-demo), popup (CTA-triggered), badge (always-on).

### Privacy

Calendly sets cookies; consider it functional-grade. Document in privacy
policy. CSP allow-listed for `*.calendly.com`.

### Pre-fill

When LeadForm completes, redirect to Calendly with prefilled `name` /
`email` URL params:

```ts
const url = new URL(calendlyUrl);
url.searchParams.set('name', lead.firstName + ' ' + lead.lastName);
url.searchParams.set('email', lead.email);
url.searchParams.set('a1', lead.company);  // custom Q1
window.location.assign(url.toString());
```

---

## 6 · Intercom (live chat / support)

Loader gated by consent:

```tsx
// components/integrations/IntercomLoader.tsx
'use client';
import { useConsent } from '@/lib/consent';

export function IntercomLoader() {
  const { analytics } = useConsent();
  if (!analytics || !process.env.NEXT_PUBLIC_INTERCOM_APP_ID) return null;

  // boot only after first interaction (FCP-friendly)
  return (
    <Script
      id="intercom"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function(){var w=window;var ic=w.Intercom;
          if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}
          else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;
            var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;
              s.src='https://widget.intercom.io/widget/${process.env.NEXT_PUBLIC_INTERCOM_APP_ID}';
              var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};
            if(d.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
        `,
      }}
    />
  );
}
```

Drift/Crisp follow the same pattern; only one chat tool active at a time —
configurable via CMS `siteSettings.chatProvider` enum.

---

## 7 · IndexNow

Search-engine push notifications on publish. **Primary path is CMS-side**
(arch doc Phase G) — `apps/cms` afterChange hook fires the IndexNow ping.

`apps/web` only does this client-side **as fallback** if a content-only
revalidation occurred without CMS firing (rare). Wired via:

```ts
// app/api/revalidate/route.ts (after revalidateTag)
fetch(`https://api.indexnow.org/indexnow?url=${encodedPathOnHost}&key=${process.env.INDEXNOW_KEY}`)
  .catch(() => {});  // non-blocking
```

`INDEXNOW_KEY` is published at `https://cleanstart.com/<key>.txt` (Next
route handler returns the key as plain text).

---

## 8 · Embed providers (allow-list)

Editors can drop an `Embed` block with a URL. The web component allow-lists
the host before rendering an iframe. Anything else falls back to a
labelled link.

| Provider | Pattern | Treatment |
|---|---|---|
| YouTube | `youtube.com`, `youtu.be` | Use `youtube-nocookie.com`; lazy-load with poster thumbnail |
| Vimeo | `vimeo.com`, `player.vimeo.com` | Direct iframe; `dnt=1` query |
| Calendly | `calendly.com` | Direct iframe |
| Loom | `loom.com` | Direct iframe |
| internal media | `${R2_PUBLIC_HOST}` | `<video controls>` |
| Twitter / X | — | Renders as a link card; iframe skipped (privacy) |
| LinkedIn | — | Link card |

Allow-list lives in `lib/embed-allowlist.ts`. Adding a host requires:
1. Update the allow-list.
2. Update `next.config.ts` `headers()` CSP `frame-src`.
3. Update WEB-ARCHITECTURE §10 CSP example.

---

## 9 · Sentry (error tracking)

Browser SDK from `@sentry/nextjs`.

```ts
// instrumentation-client.ts
import * as Sentry from '@sentry/nextjs';
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.05,
  replaysSessionSampleRate: 0,    // off until consent + decision
  replaysOnErrorSampleRate: 0,
  beforeSend(event) {
    return scrubPII(event);  // shared with CMS scrubber
  },
});
```

Replay disabled by default. If enabled later, gate behind consent and
PII-mask mode.

---

## 10 · OpenGraph / Twitter cards

Implemented via Next 16 `generateMetadata` API; static OG image fallback at
`app/opengraph-image.tsx`. Per-page custom OG via the `seo` field group on
each collection.

See [`SEO-PLAYBOOK.md`](./SEO-PLAYBOOK.md) §opengraph.

---

## 11 · Social sharing

Native `navigator.share()` first; fallback to a link grid (Twitter/X,
LinkedIn, copy-link). No third-party social SDKs loaded.

---

## 12 · Schema-org / JSON-LD

Authored by `lib/seo/jsonld.ts` builders; injected via `<JsonLd>`
component (`Script` with `type='application/ld+json'`). Per-collection
recipes in [`SEO-PLAYBOOK.md`](./SEO-PLAYBOOK.md).

---

## 13 · Things explicitly NOT integrated client-side

- **HubSpot, Salesforce, Pipedrive** — CRM is Zoho (locked in
  [`docs/INTEGRATIONS-RESEARCH.md`](../INTEGRATIONS-RESEARCH.md) Tier 2).
  Even Zoho is a backend integration; the web side never talks directly
  to a CRM.
- **Marketo, Pardot, Eloqua** — same; tracking pixels would defeat the
  consent gate.
- **Twitter/X, LinkedIn, FB pixels** — not loaded.
- **Hotjar, FullStory** — not loaded.
- **Brevo widgets** — Brevo handles backend email only.
- **Teams Workflows** — backend, fired from CMS Phase G.

---

## 14 · CSP allow-list summary

The CSP defined in [`WEB-ARCHITECTURE.md §10`](./WEB-ARCHITECTURE.md#10--security-headers)
must include every host enabled here:

- `script-src`: `googletagmanager.com`, `*.intercom.io`,
  `*.intercomcdn.com`, `challenges.cloudflare.com`, `assets.calendly.com`
- `frame-src`: `calendly.com`, `*.calendly.com`, `youtube-nocookie.com`,
  `player.vimeo.com`, `loom.com`, `challenges.cloudflare.com`
- `connect-src`: `${CMS_HOST}`, `${MEILI_HOST}`,
  `www.google-analytics.com`, `*.intercom.io`, `api.calendly.com`,
  `api.indexnow.org`
- `img-src`: `${R2_PUBLIC_HOST}`, `www.google-analytics.com`,
  `*.intercom-mail.com`

When adding any integration here, the CSP and this list update together.
