# GTM Tag Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every third-party tracking tag on `www.cleanstart.com` (GA4, Apollo.io, Leadfeeder, plus new ones such as Microsoft Clarity) out of React components and into a single Google Tag Manager container, while keeping consent enforcement, host gating and the CSP under code review.

**Architecture:** GTM becomes the tag platform, but not the policy layer. Code keeps four things GTM cannot do safely: the container loader (host-gated so preview and `*.vercel.app` deploys never load it), the Consent Mode v2 defaults (queued before GTM so tags start in the correct state), the `dataLayer` event contract that application code pushes to, and the CSP allow-list. GTM owns the tags themselves: the GA4 configuration tag, one GA4 event tag per custom event, and Custom HTML tags for Clarity, Apollo and Leadfeeder, each carrying a GTM consent check that mirrors today's React gating.

**Tech Stack:** Next.js 16 (App Router, statically prerendered), React 19, TypeScript strict, Vitest, Biome, Google Tag Manager, GA4 Consent Mode v2.

---

## Background: what exists today

Read these before starting. The migration replaces them, so their behaviour is the specification.

| File | Responsibility today |
|---|---|
| `apps/web/src/lib/analytics/ga4.ts` | Validates `NEXT_PUBLIC_GA4_ID` against `^G-[A-Z0-9]+$`. |
| `apps/web/src/lib/analytics/ga4-snippet.ts` | Builds the inline head snippet: host guard, `dataLayer` bootstrap, `gtag('config', id)`, injects `gtag/js`. |
| `apps/web/src/components/analytics/Ga4HeadScript.tsx` | Server component rendering that snippet in `<head>`. |
| `apps/web/src/lib/analytics/apollo.ts` + `components/analytics/ApolloScript.tsx` | Apollo.io tracker, app id `NEXT_PUBLIC_APOLLO_APP_ID`, gated on Targeting consent and host. |
| `apps/web/src/lib/analytics/leadfeeder.ts` + `components/analytics/LeadfeederScript.tsx` | Leadfeeder tracker, account id `NEXT_PUBLIC_LEADFEEDER_ID`, gated on Targeting consent and host. |
| `apps/web/src/lib/analytics/track.ts` | `trackEvent()` / `trackPageView()`, currently calling `gtag('event', ...)`. 13 call sites. |
| `apps/web/src/components/analytics/Ga4RouteTracker.tsx` | Emits `page_view` on SPA navigation via `trackPageView()`. |
| `apps/web/src/components/consent/GatedAnalytics.tsx` | Mounts route tracker, WebVitals (Performance), Apollo + Leadfeeder (Targeting). |
| `apps/web/src/lib/consent/consent-mode-snippet.ts` | Consent Mode v2 defaults, region-scoped. **Not changed by this migration.** |
| `apps/web/src/components/consent/ConsentProvider.tsx` | Sends `gtag('consent','update', ...)` on a banner decision. **Not changed by this migration.** |
| `apps/web/src/lib/security/csp.ts` | Allow-lists vendor hosts in `img-src` / `connect-src`. |
| `apps/web/src/lib/seo/indexing.ts` | `NOINDEX_HOSTS` / `NOINDEX_HOST_SUFFIXES`, serialized into the tag host guard. |

Live production values, confirmed from the rendered page on 2026-09-18:

| Tag | Live ID |
|---|---|
| GA4 | `G-S6T47D7PZR` |
| Apollo.io | `691b73cb5443850011f553d1` |
| Leadfeeder | `kn9Eq4RXRqJ8RlvP` |

---

## File structure

**Created**

| File | Responsibility |
|---|---|
| `apps/web/src/lib/analytics/gtm.ts` | Validate the GTM container id from the environment. |
| `apps/web/src/lib/analytics/gtm.test.ts` | Tests for the above. |
| `apps/web/src/lib/analytics/gtm-snippet.ts` | Build the inline GTM loader snippet with the serialized host guard. |
| `apps/web/src/lib/analytics/gtm-snippet.test.ts` | Tests for the above. |
| `apps/web/src/components/analytics/GtmHeadScript.tsx` | Server component rendering the loader in `<head>`. |
| `docs/web/TRACKING-TAGS.md` | Single source of truth: every tag, its id, consent category, where it is configured. |

**Modified**

| File | Change |
|---|---|
| `apps/web/src/app/layout.tsx` | Swap `<Ga4HeadScript/>` for `<GtmHeadScript/>`. |
| `apps/web/src/lib/analytics/track.ts` | Emit `dataLayer.push` instead of `gtag('event')`. |
| `apps/web/src/lib/analytics/track.test.ts` | Rewrite against the dataLayer contract. |
| `apps/web/src/lib/security/csp.ts` | Add Microsoft Clarity hosts. |
| `apps/web/src/lib/security/csp.test.ts` | Assert the Clarity hosts. |
| `apps/web/src/components/consent/GatedAnalytics.tsx` | Drop Apollo and Leadfeeder mounts. |
| `apps/web/src/components/analytics/Ga4RouteTracker.tsx` | Update the comment block to the GTM model. |
| `docs/web/WEB-PRODUCTION.md` | Env table and analytics section. |
| `CLAUDE.md` | Live integrations table. |

**Deleted at cutover (Task 6)**

`ga4.ts`, `ga4.test.ts`, `ga4-snippet.ts`, `ga4-snippet.test.ts`, `Ga4HeadScript.tsx`, `apollo.ts`, `apollo.test.ts`, `ApolloScript.tsx`, `leadfeeder.ts`, `leadfeeder.test.ts`, `LeadfeederScript.tsx`.

---

## Ordering and the double-count hazard

GA4 must never be firing from code and from GTM at the same time, or every pageview and conversion counts twice and the data is unusable for the period of overlap.

> **Superseded during implementation (2026-09-18).** The code for Tasks 1 to 4 and 7 shipped as one branch, `feat/gtm-tag-migration`, so the loader and the removal of the in-code tags land in the **same** deploy. That makes the staged sequence below unnecessary. Use this one instead, which has neither a gap nor a double count:
>
> 1. Build the container (Task 5) and **publish it with every tag live**. Production does not load GTM yet, so publishing fires nothing.
> 2. Verify it with GTM Preview against a local `next start` build run with `NEXT_PUBLIC_GTM_ID` set (Preview works on any host the container loads on).
> 3. Set `NEXT_PUBLIC_GTM_ID` in Vercel, Production only.
> 4. Merge the branch and deploy. The first production build that loads GTM is also the first build without the in-code GA4, so the two never overlap.
> 5. Run Task 8's verification.
>
> The one hazard left: never deploy this branch to production **without** `NEXT_PUBLIC_GTM_ID` set, or the site sends no analytics at all until it is.

The original staged sequence, kept for reference. It guarantees a short **undercount** instead, which is recoverable, rather than a double count, which is not:

1. Tasks 1 to 3 ship code that loads GTM. `NEXT_PUBLIC_GTM_ID` stays **unset** in Vercel, so the loader renders nothing. Nothing changes in production.
2. Task 4 builds the container in the GTM UI with the GA4 tag **paused**. Nothing fires.
3. Task 5 sets `NEXT_PUBLIC_GTM_ID` in Vercel and redeploys. GTM now loads, but its GA4 tag is paused, so GA4 still comes only from code. Clarity, Apollo and Leadfeeder tags stay paused too at this point.
4. Task 6 deploys the cutover commit: in-code GA4, Apollo and Leadfeeder are removed and `track.ts` switches to `dataLayer`. For the few minutes until step 5, the site sends nothing.
5. Task 7 unpauses every tag in GTM. Tracking resumes, now entirely from GTM.

Do steps 4 and 5 back to back, in a low-traffic window, with the GTM workspace already reviewed and ready to publish.

---

### Task 1: GTM container id validator

Mirrors the existing `ga4.ts` contract: read at call time so it is stubbable, validate so a typo fails safe. Note there is deliberately no `resolveGtmContainerId(hostname)` twin of `resolveApolloAppId`. Those exist because Apollo and Leadfeeder render from client components that can read `window.location`; GTM renders from the head, where the host is unknown at build time, so its host gate lives inside the snippet instead (Task 2). One gate, not two.

**Files:**
- Create: `apps/web/src/lib/analytics/gtm.ts`
- Test: `apps/web/src/lib/analytics/gtm.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/analytics/gtm.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { gtmContainerId } from "./gtm";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("gtmContainerId", () => {
  it("returns a well-formed container id", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-ABC1234");
    expect(gtmContainerId()).toBe("GTM-ABC1234");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "  GTM-ABC1234  ");
    expect(gtmContainerId()).toBe("GTM-ABC1234");
  });

  it("returns null when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
    expect(gtmContainerId()).toBeNull();
  });

  it("rejects malformed ids", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "G-ABC1234XYZ");
    expect(gtmContainerId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "gtm-abc1234");
    expect(gtmContainerId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-ABC1234\" onload=\"x");
    expect(gtmContainerId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-");
    expect(gtmContainerId()).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics/gtm.test.ts
```

Expected: FAIL, `Failed to resolve import "./gtm"`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/analytics/gtm.ts`:

```ts
/**
 * Google Tag Manager container id, sourced from `NEXT_PUBLIC_GTM_ID`.
 *
 * Set only on the production deploy. Validated so a typo fails safe: the caller
 * renders nothing rather than injecting a broken loader. Because the id is
 * validated against this character class it is safe to interpolate into the
 * inline loader snippet and the loader URL.
 *
 * The host gate is NOT here. The Vercel production environment serves the
 * canonical site and its `*.vercel.app` aliases from the same build, so the id
 * is baked into both, and the head snippet cannot know the request host without
 * forcing every route dynamic. `lib/analytics/gtm-snippet.ts` therefore carries
 * the guard and runs it in the browser.
 */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export function gtmContainerId(): string | null {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  return id && GTM_ID_PATTERN.test(id) ? id : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics/gtm.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/analytics/gtm.ts apps/web/src/lib/analytics/gtm.test.ts
git commit -m "feat(web): add GTM container id validator"
```

---

### Task 2: GTM head snippet builder

The loader has to run in `<head>`, after the Consent Mode defaults, with the host guard inlined because the site is statically prerendered and the layout cannot read the request host without forcing every route dynamic. This mirrors `ga4-snippet.ts`.

**Files:**
- Create: `apps/web/src/lib/analytics/gtm-snippet.ts`
- Test: `apps/web/src/lib/analytics/gtm-snippet.test.ts`
- Read for reference: `apps/web/src/lib/analytics/ga4-snippet.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/analytics/gtm-snippet.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { NOINDEX_HOST_SUFFIXES } from "@/lib/seo/indexing";
import { buildGtmSnippet } from "./gtm-snippet";

describe("buildGtmSnippet", () => {
  const snippet = buildGtmSnippet("GTM-ABC1234");

  it("loads the container from googletagmanager.com", () => {
    expect(snippet).toContain(
      "https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234",
    );
  });

  it("pushes gtm.start so the container reports its own load time", () => {
    expect(snippet).toContain('"gtm.start"');
    expect(snippet).toContain('event:"gtm.js"');
  });

  it("reuses the existing dataLayer rather than replacing it", () => {
    // The consent snippet runs first and creates window.dataLayer. Replacing it
    // would drop the queued Consent Mode defaults and every tag would start in
    // the wrong state.
    expect(snippet).toContain("window.dataLayer=window.dataLayer||[]");
  });

  it("serializes the noindex host suffix guard", () => {
    for (const suffix of NOINDEX_HOST_SUFFIXES) {
      expect(snippet).toContain(JSON.stringify(suffix));
    }
  });

  it("bails out when the hostname is empty", () => {
    expect(snippet).toContain('var h=(location.hostname||"").toLowerCase()');
    expect(snippet).toContain("if(!h)return;");
  });

  it("evaluates without throwing and appends exactly one loader script", () => {
    const appended: string[] = [];
    const fakeDocument = {
      createElement: () => ({ set src(v: string) { appended.push(v); }, async: false }),
      head: { appendChild: () => undefined },
    };
    const run = new Function("window", "location", "document", snippet);
    const win: Record<string, unknown> = {};
    run(win, { hostname: "www.cleanstart.com" }, fakeDocument);
    expect(appended).toEqual([
      "https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234",
    ]);
    expect(Array.isArray(win.dataLayer)).toBe(true);
  });

  it("does not load on a noindex host", () => {
    const appended: string[] = [];
    const fakeDocument = {
      createElement: () => ({ set src(v: string) { appended.push(v); }, async: false }),
      head: { appendChild: () => undefined },
    };
    const run = new Function("window", "location", "document", snippet);
    run({}, { hostname: "cleanstart-web-git-development.vercel.app" }, fakeDocument);
    expect(appended).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics/gtm-snippet.test.ts
```

Expected: FAIL, `Failed to resolve import "./gtm-snippet"`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/analytics/gtm-snippet.ts`:

```ts
import { NOINDEX_HOSTS, NOINDEX_HOST_SUFFIXES } from "@/lib/seo/indexing";

/**
 * Builds the GTM loader that ships inside the server-rendered `<head>`.
 *
 * Emitted immediately after the Consent Mode default snippet, so
 * `gtag('consent','default', ...)` is already on the dataLayer before the
 * container boots and every tag evaluates its consent check against the right
 * state. The dataLayer is reused, never reassigned, for the same reason.
 *
 * The host guard runs in the browser because the marketing site is statically
 * prerendered: the layout cannot read `headers()` without forcing every route
 * dynamic, and the Vercel production environment serves www and the noindex
 * aliases from the same build. Serializing the list from `lib/seo/indexing.ts`
 * keeps one source of truth.
 *
 * @param containerId a `^GTM-[A-Z0-9]+$` id validated by `gtmContainerId()`,
 *   which is why it is safe to interpolate into the string literals below.
 */
export function buildGtmSnippet(containerId: string): string {
  const guards = [
    NOINDEX_HOSTS.length > 0
      ? `if(${JSON.stringify(NOINDEX_HOSTS)}.indexOf(h)>-1)return;`
      : null,
    NOINDEX_HOST_SUFFIXES.length > 0
      ? `if(${JSON.stringify(
          NOINDEX_HOST_SUFFIXES,
        )}.some(function(s){return h.slice(-s.length)===s}))return;`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `(function(){
var h=(location.hostname||"").toLowerCase();
if(!h)return;
${guards}
window.dataLayer=window.dataLayer||[];
window.dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});
var s=document.createElement("script");
s.async=true;
s.src="https://www.googletagmanager.com/gtm.js?id=${containerId}";
document.head.appendChild(s);
})();`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics/gtm-snippet.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/analytics/gtm-snippet.ts apps/web/src/lib/analytics/gtm-snippet.test.ts
git commit -m "feat(web): add host-gated GTM head snippet builder"
```

---

### Task 3: Mount the GTM loader in the document head

The loader ships now but stays dormant, because `NEXT_PUBLIC_GTM_ID` is unset everywhere until Task 5. `<Ga4HeadScript/>` stays in place, so production tracking is untouched by this commit.

There is deliberately **no `<noscript>` iframe**. It only serves tags for visitors with JavaScript disabled, which none of our tags support anyway (GA4, Clarity, Apollo and Leadfeeder are all JS trackers), and it would need a new `frame-src` entry in the CSP.

**Files:**
- Create: `apps/web/src/components/analytics/GtmHeadScript.tsx`
- Modify: `apps/web/src/app/layout.tsx` (the `<head>` block, currently lines 174 to 184)

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/analytics/GtmHeadScript.tsx`:

```tsx
import { buildGtmSnippet } from "@/lib/analytics/gtm-snippet";
import { gtmContainerId } from "@/lib/analytics/gtm";

/**
 * Server-rendered Google Tag Manager bootstrap, emitted in the document `<head>`
 * immediately after the Consent Mode default.
 *
 * A Server Component on purpose: the snippet is baked into the static HTML, so
 * the container is visible in view-source, is detectable by Tag Assistant and
 * third-party scanners, and starts loading during head parse instead of after
 * React hydration.
 *
 * Renders nothing when `NEXT_PUBLIC_GTM_ID` is unset or malformed. The
 * staging and preview exclusion is handled at runtime inside the snippet, since
 * a statically prerendered layout cannot know the request host.
 */
export function GtmHeadScript() {
  const containerId = gtmContainerId();
  if (!containerId) return null;

  return (
    <script
      id="gtm-bootstrap"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time snippet from a validated ^GTM-[A-Z0-9]+$ id (no user input); cleared by script-src 'unsafe-inline' in csp.ts.
      dangerouslySetInnerHTML={{ __html: buildGtmSnippet(containerId) }}
    />
  );
}
```

- [ ] **Step 2: Mount it in the layout**

In `apps/web/src/app/layout.tsx`, add the import next to the existing `Ga4HeadScript` import:

```tsx
import { GtmHeadScript } from "@/components/analytics/GtmHeadScript";
```

Then replace the `<head>` contents so GTM loads after the consent default and after the GA4 tag that is still live:

```tsx
      <head>
        {/* Warm the GA4 collect origin. The tag library is injected during head
            parse, so googletagmanager.com connects on its own; google-analytics.com
            is only reached once the library runs and would otherwise pay full
            DNS+TCP+TLS on the first beacon (~RTT 131ms p75 on mobile). */}
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
        {/* Order is load-bearing: the Consent Mode default must be queued before
            any tag platform boots, so tags evaluate the right consent state. */}
        <ConsentModeScript />
        <Ga4HeadScript />
        <GtmHeadScript />
      </head>
```

- [ ] **Step 3: Verify nothing renders without the env var**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics
pnpm --filter @cleanstart/web typecheck
```

Expected: PASS for both. `NEXT_PUBLIC_GTM_ID` is unset locally, so `GtmHeadScript` returns null and the rendered head is unchanged.

- [ ] **Step 4: Confirm in a local dev render**

```bash
pnpm --filter @cleanstart/web dev
```

Then in another shell:

```bash
curl -s http://localhost:3001 | grep -c "gtm.js?id=" || true
```

Expected: `0`, because the container id is unset. Stop the dev server afterwards.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/analytics/GtmHeadScript.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): mount dormant GTM loader in document head"
```

---

### Task 4: Allow Microsoft Clarity in the CSP

Clarity is the first tag that GTM will add which is not already allow-listed. Doing it now proves the point that a new vendor still needs a code change, and it lets Task 7 enable Clarity without a second deploy.

Clarity loads `https://www.clarity.ms/tag/<project-id>`, then beacons to `*.clarity.ms` and sets a pixel on `c.bing.com`.

**Files:**
- Modify: `apps/web/src/lib/security/csp.ts:30` (after the `APOLLO` constant) and the `imgSrc` / `connectSrc` arrays
- Test: `apps/web/src/lib/security/csp.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `apps/web/src/lib/security/csp.test.ts`, following the existing Apollo test at line 83:

```ts
  it('allows the Microsoft Clarity hosts in connect-src and img-src', () => {
    const d = parse(buildCsp({ isProduction: true, isDraftMode: false }));
    expect(d['connect-src']).toContain('https://*.clarity.ms');
    expect(d['img-src']).toContain('https://*.clarity.ms');
    // Clarity drops a Bing sync pixel; without this the image is blocked and
    // the console fills with CSP violations on every page.
    expect(d['img-src']).toContain('https://c.bing.com');
    // The www.clarity.ms loader is served over https: (no per-host script-src).
    expect(d['script-src']).toContain('https:');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @cleanstart/web test src/lib/security/csp.test.ts
```

Expected: FAIL on the `connect-src` assertion.

- [ ] **Step 3: Write the implementation**

In `apps/web/src/lib/security/csp.ts`, add after the `APOLLO` constant:

```ts
// Microsoft Clarity session analytics, fired from GTM. Loader is
// www.clarity.ms (served via script-src 'https:'); the recorder beacons back to
// *.clarity.ms and drops an identity-sync pixel on c.bing.com.
const CLARITY = 'https://*.clarity.ms';
const CLARITY_SYNC = 'https://c.bing.com';
```

Add to the `imgSrc` array, after the Apollo entry:

```ts
    // Clarity recorder beacon and its Bing identity-sync pixel.
    CLARITY,
    CLARITY_SYNC,
```

Add to the `connectSrc` array, after `APOLLO`:

```ts
    CLARITY,
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter @cleanstart/web test src/lib/security/csp.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/security/csp.ts apps/web/src/lib/security/csp.test.ts
git commit -m "feat(web): allow Microsoft Clarity hosts in the CSP"
```

---

### Task 5: Build the GTM container

This task is performed in the GTM UI, not in the repo. Nothing here fires until Task 7, because every tag is created **paused**.

Container: create one Web container for `cleanstart.com` under the CleanStart Google account. Record the container id, it is the value for `NEXT_PUBLIC_GTM_ID`.

- [ ] **Step 1: Create the built-in variables**

Enable these built-in variables (Variables, Configure): `Page Path`, `Page URL`, `Page Hostname`, `Referrer`, `Event`.

- [ ] **Step 2: Create the Data Layer variables**

One User-Defined Variable per event parameter, all of type **Data Layer Variable**, Version 2, with no default value. Name each one `dlv - <key>`:

| Variable name | Data layer key | Used by |
|---|---|---|
| `dlv - form_name` | `form_name` | generate_lead, job_application, newsletter_signup, thank_you_view |
| `dlv - gated` | `gated` | generate_lead, file_download |
| `dlv - job_slug` | `job_slug` | job_application |
| `dlv - marketing_opt_in` | `marketing_opt_in` | deal_registration |
| `dlv - search_term` | `search_term` | search |
| `dlv - search_results` | `search_results` | search |
| `dlv - search_scope` | `search_scope` | search |
| `dlv - resource_slug` | `resource_slug` | file_download |
| `dlv - resource_title` | `resource_title` | file_download |
| `dlv - cta` | `cta` | cta_click |
| `dlv - page` | `page` | cta_click |
| `dlv - video_id` | `video_id` | cta_click |
| `dlv - page_location` | `page_location` | page_view |
| `dlv - page_title` | `page_title` | page_view |
| `dlv - page_referrer` | `page_referrer` | page_view |
| `dlv - cs_consent_performance` | `cs_consent_performance` | Clarity trigger |
| `dlv - cs_consent_targeting` | `cs_consent_targeting` | Apollo and Leadfeeder trigger |

- [ ] **Step 3: Create the triggers**

One Custom Event trigger per event name pushed by `track.ts`. Event name must match exactly, "All Custom Events" fires on none of them.

| Trigger name | Type | Event name |
|---|---|---|
| `CE - page_view` | Custom Event | `page_view` |
| `CE - generate_lead` | Custom Event | `generate_lead` |
| `CE - file_download` | Custom Event | `file_download` |
| `CE - deal_registration` | Custom Event | `deal_registration` |
| `CE - job_application` | Custom Event | `job_application` |
| `CE - newsletter_signup` | Custom Event | `newsletter_signup` |
| `CE - thank_you_view` | Custom Event | `thank_you_view` |
| `CE - cta_click` | Custom Event | `cta_click` |
| `CE - search` | Custom Event | `search` |
| `CE - consent performance granted` | Custom Event, fires on Some Custom Events where `dlv - cs_consent_performance` equals `true` | `cs_consent_update` |
| `CE - consent targeting granted` | Custom Event, fires on Some Custom Events where `dlv - cs_consent_targeting` equals `true` | `cs_consent_update` |

The two consent triggers exist because the gated tags must NOT fire on "All Pages". `ConsentProvider` applies the visitor's decision after hydration, after "All Pages" has been evaluated, and GTM never re-fires a tag that failed a consent check. `cs_consent_update` is pushed by `ConsentProvider` on every resolved decision (see `lib/consent/consent-event.ts`).

- [ ] **Step 4: Create the GA4 configuration tag**

- Tag type: **Google Tag**
- Tag ID: `G-S6T47D7PZR`
- Trigger: `Initialization - All Pages`
- Configuration settings: leave `send_page_view` at its default (true), so the hard-load page view still fires exactly once.
- Consent Settings: **No additional consent required.** GA4 already respects Consent Mode through `analytics_storage`, which our head snippet defaults to granted outside the EEA/UK/CH and denied inside until opt-in. Adding a GTM-level check here would gate GA4 a second time and break the 2026-07-22 decision that GA4 runs unmodeled outside those regions.
- **Pause this tag.**

- [ ] **Step 5: Create one GA4 event tag per custom event**

Tag type **Google Analytics: GA4 Event**, Measurement ID `G-S6T47D7PZR`, Consent Settings "No additional consent required", each **paused**:

| Tag name | Event name | Event parameters (parameter = value) | Trigger |
|---|---|---|---|
| `GA4 - page_view` | `page_view` | `page_location` = `{{dlv - page_location}}`, `page_title` = `{{dlv - page_title}}`, `page_referrer` = `{{dlv - page_referrer}}` | `CE - page_view` |
| `GA4 - generate_lead` | `generate_lead` | `form_name` = `{{dlv - form_name}}`, `gated` = `{{dlv - gated}}` | `CE - generate_lead` |
| `GA4 - file_download` | `file_download` | `resource_slug` = `{{dlv - resource_slug}}`, `resource_title` = `{{dlv - resource_title}}`, `gated` = `{{dlv - gated}}` | `CE - file_download` |
| `GA4 - deal_registration` | `deal_registration` | `marketing_opt_in` = `{{dlv - marketing_opt_in}}` | `CE - deal_registration` |
| `GA4 - job_application` | `job_application` | `job_slug` = `{{dlv - job_slug}}` | `CE - job_application` |
| `GA4 - newsletter_signup` | `newsletter_signup` | `form_name` = `{{dlv - form_name}}` | `CE - newsletter_signup` |
| `GA4 - thank_you_view` | `thank_you_view` | `form_name` = `{{dlv - form_name}}` | `CE - thank_you_view` |
| `GA4 - cta_click` | `cta_click` | `cta` = `{{dlv - cta}}`, `page` = `{{dlv - page}}`, `video_id` = `{{dlv - video_id}}` | `CE - cta_click` |
| `GA4 - search` | `search` | `search_term` = `{{dlv - search_term}}`, `search_results` = `{{dlv - search_results}}`, `search_scope` = `{{dlv - search_scope}}` | `CE - search` |

- [ ] **Step 6: Create the Microsoft Clarity tag**

First create the Clarity project, since it does not exist yet: clarity.microsoft.com, New project, name `cleanstart.com`, site URL `https://www.cleanstart.com`, category Website. Open Settings, Overview and copy the 10-character project id. Do **not** use Clarity's own "Install manually" snippet page: it hands you the same script, but pasting it into the site would bypass GTM and the consent check below.

Then in GTM:

- Tag type: **Custom HTML**
- Trigger: `CE - consent performance granted`
- Tag firing options (Advanced Settings): **Once per page**.
- Consent Settings: **No additional consent required.** Do not use `analytics_storage` here: it is granted by default outside the EEA/UK/CH so GA4 stays un-gated, so it would let Clarity record visitors who rejected Performance. The trigger condition is the gate.
- HTML, with the real project id substituted for `CLARITY_PROJECT_ID`:

```html
<script>
(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","CLARITY_PROJECT_ID");
</script>
```

- **Pause this tag.**

- [ ] **Step 7: Create the Apollo.io tag**

- Tag type: **Custom HTML**
- Trigger: `CE - consent targeting granted`
- Tag firing options (Advanced Settings): **Once per page**.
- Consent Settings: **Require additional consent**, consent type `ad_storage`. Belt and braces: `ConsentProvider` grants `ad_storage` in the same update that sets the Targeting flag, so this only blocks the tag if the two ever drift apart.
- HTML, byte-identical to the snippet the site ships today:

```html
<script>
(function(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n;o.async=true;o.defer=true;o.onload=function(){window.trackingFunctions.onLoad({appId:"691b73cb5443850011f553d1"})};document.head.appendChild(o)})();
</script>
```

- **Pause this tag.**

- [ ] **Step 8: Create the Leadfeeder tag**

- Tag type: **Custom HTML**
- Trigger: `CE - consent targeting granted`
- Tag firing options (Advanced Settings): **Once per page**.
- Consent Settings: **Require additional consent**, consent type `ad_storage`.
- HTML:

```html
<script>
window.ldfdr=window.ldfdr||function(){(ldfdr._q=ldfdr._q||[]).push([].slice.call(arguments));};
(function(d,s){var f=d.createElement(s);f.async=true;f.src="https://sc.lfeeder.com/lftracker_v1_kn9Eq4RXRqJ8RlvP.js";d.head.appendChild(f);})(document,"script");
</script>
```

- **Pause this tag.**

- [ ] **Step 9: Lock down publish rights**

In Admin, User Management: give Publish permission to at most two named people. Everyone else gets Edit or Approve. A GTM publish puts arbitrary JavaScript on production with no code review, and it is invisible to git, so this is the only control that exists.

- [ ] **Step 10: Submit the workspace without publishing**

Leave the workspace unpublished. Nothing in the container is live yet. Record the container id for Task 6.

---

### Task 6: Enable the container in production, still with every tag paused

**Files:** none. This is a Vercel configuration change.

- [ ] **Step 1: Set the env var**

In the Vercel `cleanstart` project (`prj_VivVqaJeonKjyiXA0UamuElWdrVY`, team `digibranders-projects`), add `NEXT_PUBLIC_GTM_ID` with the container id from Task 5, **Production environment only**. Leave Preview and Development unset, so a preview deploy cannot load the container even if the host guard were ever removed.

- [ ] **Step 2: Publish the GTM workspace**

Publish the container with every tag still paused. This makes the container real and lets Tag Assistant see it, while firing nothing.

- [ ] **Step 3: Redeploy production**

Trigger a production redeploy so the new env var is baked into the build.

- [ ] **Step 4: Verify the container loads and fires nothing**

Open `https://www.cleanstart.com` and run in the browser console:

```js
[...document.scripts].map(s => s.src).filter(s => s.includes('gtm.js') || s.includes('gtag/js'))
```

Expected: both a `gtm.js?id=GTM-...` entry and the existing `gtag/js?id=G-S6T47D7PZR` entry. GA4 is still served by the in-code tag; the container is loaded but inert.

Then confirm GA4 is not double counting, in GA4 Realtime: page views should look the same as before, not doubled.

---

### Task 7: Code cutover

One commit removes the in-code tags and switches the event contract. Deploy it back to back with the GTM unpause in Task 8.

**Files:**
- Modify: `apps/web/src/lib/analytics/track.ts`
- Modify: `apps/web/src/lib/analytics/track.test.ts`
- Modify: `apps/web/src/components/consent/GatedAnalytics.tsx`
- Modify: `apps/web/src/components/analytics/Ga4RouteTracker.tsx` (comment block only)
- Modify: `apps/web/src/app/layout.tsx`
- Delete: `ga4.ts`, `ga4.test.ts`, `ga4-snippet.ts`, `ga4-snippet.test.ts`, `Ga4HeadScript.tsx`, `apollo.ts`, `apollo.test.ts`, `ApolloScript.tsx`, `leadfeeder.ts`, `leadfeeder.test.ts`, `LeadfeederScript.tsx`

- [ ] **Step 1: Write the failing test**

Replace the contents of `apps/web/src/lib/analytics/track.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { trackEvent, trackPageView } from "./track";

type Push = Record<string, unknown>;

const dataLayer = (): Push[] =>
  (window as Window & { dataLayer?: Push[] }).dataLayer ?? [];

beforeEach(() => {
  (window as Window & { dataLayer?: Push[] }).dataLayer = [];
});

afterEach(() => {
  delete (window as Window & { dataLayer?: Push[] }).dataLayer;
});

describe("trackEvent", () => {
  it("pushes the event name under the `event` key", () => {
    trackEvent("generate_lead", { form_name: "contact" });
    const last = dataLayer().at(-1);
    expect(last?.event).toBe("generate_lead");
    expect(last?.form_name).toBe("contact");
  });

  it("clears every known parameter before the event push", () => {
    // GTM data layer variables persist across pushes, so a stale `job_slug`
    // from an earlier event would be attached to a later unrelated one.
    trackEvent("job_application", { job_slug: "staff-engineer" });
    trackEvent("newsletter_signup", { form_name: "newsletter" });
    const pushes = dataLayer();
    const reset = pushes.at(-2);
    expect(reset?.job_slug).toBeNull();
    expect(reset?.form_name).toBeNull();
    const last = pushes.at(-1);
    expect(last?.event).toBe("newsletter_signup");
    expect(last?.form_name).toBe("newsletter");
    expect(last?.job_slug).toBeUndefined();
  });

  it("omits undefined parameters from the event push", () => {
    trackEvent("cta_click", { cta: "hero", page: undefined });
    const last = dataLayer().at(-1);
    expect(last).not.toHaveProperty("page");
    expect(last?.cta).toBe("hero");
  });

  it("no-ops when the data layer is absent", () => {
    delete (window as Window & { dataLayer?: Push[] }).dataLayer;
    expect(() => trackEvent("search", { search_term: "x" })).not.toThrow();
  });
});

describe("trackPageView", () => {
  it("pushes a page_view event with the location payload", () => {
    trackPageView({
      page_location: "https://www.cleanstart.com/blog",
      page_title: "Blog",
      page_referrer: "https://www.cleanstart.com/",
    });
    const last = dataLayer().at(-1);
    expect(last?.event).toBe("page_view");
    expect(last?.page_location).toBe("https://www.cleanstart.com/blog");
    expect(last?.page_title).toBe("Blog");
    expect(last?.page_referrer).toBe("https://www.cleanstart.com/");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics/track.test.ts
```

Expected: FAIL, nothing is pushed because `track.ts` still calls `gtag`.

- [ ] **Step 3: Rewrite the emitter**

Replace the body of `apps/web/src/lib/analytics/track.ts` below the `Ga4EventName` type (keep the type and its comments as they are) with:

```ts
/** Flat, primitive-valued params (GA4 rejects nested objects/arrays). */
export type Ga4EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Every parameter key any event can carry.
 *
 * GTM data layer variables persist once set, so a key left over from an earlier
 * push would silently attach itself to a later, unrelated event. Each emit
 * therefore nulls the whole set first, which is the documented GTM reset
 * pattern. Add a key here whenever a new one is introduced at a call site.
 */
const EVENT_PARAM_KEYS = [
  "form_name",
  "gated",
  "job_slug",
  "marketing_opt_in",
  "search_term",
  "search_results",
  "search_scope",
  "resource_slug",
  "resource_title",
  "cta",
  "page",
  "video_id",
  "page_location",
  "page_title",
  "page_referrer",
] as const;

type DataLayer = Array<Record<string, unknown>>;

function emit(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const dataLayer = (window as Window & { dataLayer?: DataLayer }).dataLayer;
  if (!Array.isArray(dataLayer)) return;

  const reset: Record<string, unknown> = {};
  for (const key of EVENT_PARAM_KEYS) reset[key] = null;
  dataLayer.push(reset);

  const payload: Record<string, unknown> = { event: name };
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) payload[key] = value;
    }
  }
  dataLayer.push(payload);
}

export function trackEvent(name: Ga4EventName, params?: Ga4EventParams): void {
  emit(name, params);
}

/**
 * Manual `page_view` for client-side route changes. The hard load's page_view
 * comes from the GTM Google tag on Initialization; <Ga4RouteTracker/> pushes
 * this for every subsequent soft navigation with the post-commit document.title,
 * which GTM forwards through the `GA4 - page_view` tag.
 */
export function trackPageView(params: {
  page_location: string;
  page_title: string;
  page_referrer?: string;
}): void {
  emit("page_view", params);
}
```

Also update the file's top doc comment, replacing the first paragraph with:

```ts
/**
 * Typed dataLayer event emitter.
 *
 * Pushes GTM custom events that the container maps onto GA4 event tags (see
 * docs/web/TRACKING-TAGS.md). Safe on the server, where it no-ops, and safe
 * before the container finishes loading, because the Consent Mode snippet in the
 * head creates window.dataLayer and GTM replays whatever is already queued.
 *
 * Use only for meaningful conversions and interactions. Automatic and enhanced
 * measurement events (scroll, outbound click) are already captured by GA4, so do
 * NOT re-emit them here. Two exceptions are deliberately manual because enhanced
 * measurement cannot see them on this site:
 *  - `page_view` on SPA route changes (<Ga4RouteTracker/>): the property's
 *    "history events" toggle must stay OFF or navigations double-count.
 *  - `search`: the palette and typeahead never put `?q=` in the URL, so GA4's
 *    site-search detection never fires.
 */
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter @cleanstart/web test src/lib/analytics/track.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Remove the in-code tags**

```bash
git rm apps/web/src/components/analytics/Ga4HeadScript.tsx \
       apps/web/src/components/analytics/ApolloScript.tsx \
       apps/web/src/components/analytics/LeadfeederScript.tsx \
       apps/web/src/lib/analytics/ga4.ts \
       apps/web/src/lib/analytics/ga4.test.ts \
       apps/web/src/lib/analytics/ga4-snippet.ts \
       apps/web/src/lib/analytics/ga4-snippet.test.ts \
       apps/web/src/lib/analytics/apollo.ts \
       apps/web/src/lib/analytics/apollo.test.ts \
       apps/web/src/lib/analytics/leadfeeder.ts \
       apps/web/src/lib/analytics/leadfeeder.test.ts
```

- [ ] **Step 6: Update the layout**

In `apps/web/src/app/layout.tsx`, delete the `Ga4HeadScript` import and its element, leaving:

```tsx
      <head>
        {/* Warm the GA4 collect origin. The tag library is injected during head
            parse, so googletagmanager.com connects on its own; google-analytics.com
            is only reached once the library runs and would otherwise pay full
            DNS+TCP+TLS on the first beacon (~RTT 131ms p75 on mobile). */}
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
        {/* Order is load-bearing: the Consent Mode default must be queued before
            the container boots, so every tag evaluates the right consent state. */}
        <ConsentModeScript />
        <GtmHeadScript />
      </head>
```

- [ ] **Step 7: Update GatedAnalytics**

Replace `apps/web/src/components/consent/GatedAnalytics.tsx` with:

```tsx
"use client";

import { Suspense } from "react";

import { Ga4RouteTracker } from "@/components/analytics/Ga4RouteTracker";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders the client-side analytics that still live in code.
 *
 * Third-party tags (GA4, Microsoft Clarity, Apollo.io, Leadfeeder) are no longer
 * mounted here. They are configured in the GTM container loaded by
 * <GtmHeadScript/>, and each one carries a GTM consent check that reproduces the
 * gating this component used to apply: Clarity on analytics_storage, Apollo and
 * Leadfeeder on ad_storage, which <ConsentProvider/> flips on a Targeting opt-in.
 * See docs/web/TRACKING-TAGS.md for the full inventory.
 *
 * GA4 remains UN-GATED from the cookie banner outside the EEA/UK/CH (business
 * decision, 2026-07-22): the head consent snippet defaults analytics_storage to
 * granted there, so the GA4 tag carries no extra GTM consent check.
 *
 * What is left:
 *  - <Ga4RouteTracker/> pushes a page_view dataLayer event on SPA navigation
 *    (needs useSearchParams, hence <Suspense/>).
 *  - Performance category, <WebVitals/>, Core Web Vitals to Sentry. This is our
 *    own reporting, not a vendor tag, so it stays in code.
 */
export function GatedAnalytics() {
  const { performanceGranted } = useConsent();
  return (
    <>
      <Suspense fallback={null}>
        <Ga4RouteTracker />
      </Suspense>
      {performanceGranted && <WebVitals />}
    </>
  );
}
```

- [ ] **Step 8: Update the route tracker comment**

In `apps/web/src/components/analytics/Ga4RouteTracker.tsx`, replace the second paragraph of the doc comment with:

```tsx
 * The hard page load is covered by the GTM Google tag firing on Initialization,
 * so the first effect run only records the starting URL and does not emit. Every
 * later pathname or search-params change pushes a page_view dataLayer event with
 * the post-commit document.title. This replaces GA4 Enhanced Measurement's
 * "history events" tracking, which fires before Next.js swaps the <title> and
 * therefore attributes SPA views to the previous page. Keep that toggle OFF in
 * the GA4 property or navigations double-count.
```

- [ ] **Step 9: Run the full gate**

```bash
pnpm --filter @cleanstart/web test
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Expected: all pass. If `typecheck` reports an unused import of `ApolloScript` or `LeadfeederScript`, remove it. If any test still imports a deleted module, delete that test file too.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/lib/analytics/track.ts \
        apps/web/src/lib/analytics/track.test.ts \
        apps/web/src/components/consent/GatedAnalytics.tsx \
        apps/web/src/components/analytics/Ga4RouteTracker.tsx \
        apps/web/src/app/layout.tsx
git commit -m "refactor(web): move GA4, Apollo and Leadfeeder tags into GTM"
```

---

### Task 8: Cutover deploy and verification

Do this in one sitting, in a low-traffic window. Between steps 1 and 2 the site sends no analytics at all.

- [ ] **Step 1: Deploy the cutover commit**

Merge to `main` and let Vercel deploy. Confirm the deploy is live:

```bash
curl -s https://www.cleanstart.com | grep -o "gtag/js?id=[A-Z0-9-]*" || echo "in-code GA4 gone"
```

Expected: `in-code GA4 gone`.

- [ ] **Step 2: Unpause every tag in GTM and publish**

Unpause the Google tag, the nine GA4 event tags, Clarity, Apollo and Leadfeeder. Publish the workspace with a version name of `Cutover from in-code tags`.

- [ ] **Step 3: Verify GA4 page views fire once, not twice**

Open `https://www.cleanstart.com` with GTM Preview connected. In GA4 DebugView, confirm a single `page_view` on load. Navigate to `/blog` and confirm exactly one more `page_view`, with `page_title` matching the new page, not the previous one.

- [ ] **Step 4: Verify the network calls**

In the browser console on a fresh load:

```js
performance.getEntriesByType('resource').map(r => r.name).filter(n => /googletagmanager|google-analytics|clarity|apollo|lfeeder/.test(n))
```

Expected before any consent decision (use a private window): `gtm.js`, `gtag/js` and `google-analytics.com/g/collect`. No `clarity.ms`, no `apollo.io`, no `lfeeder.com`: no decision means no `cs_consent_update` event, so no gated tag fires.

- [ ] **Step 5: Verify the consent gates, including for returning visitors**

1. Open Cookies Settings, enable Performance only, confirm. Re-run the snippet: `clarity.ms` appears, `apollo.io` and `lfeeder.com` do not.
2. Reload the page. Re-run the snippet: `clarity.ms` appears again on the fresh load. This is the returning-visitor path that an "All Pages" trigger would have missed.
3. Open Cookies Settings, enable Targeting too, confirm. `assets.apollo.io` and `sc.lfeeder.com` now appear, and `clarity.ms` is not loaded a second time (Once per page).
4. Reject all, reload. None of the three appear.

- [ ] **Step 6: Verify a conversion event end to end**

Submit the contact form on `https://www.cleanstart.com/contact` with a real business email. In GA4 DebugView, confirm one `generate_lead` with `form_name = contact`. Then trigger any other event, for example a search, and confirm `form_name` is **absent** from it, which proves the parameter reset in `track.ts` works.

- [ ] **Step 7: Verify preview deploys stay clean**

Open the latest `*.vercel.app` preview URL and run:

```js
[...document.scripts].map(s => s.src).filter(s => s.includes('gtm.js'))
```

Expected: `[]`. The host guard keeps the container off non-production hosts.

- [ ] **Step 8: Check for new CSP violations**

Watch `/api/csp-report` traffic (or Sentry, if reports are forwarded) for 30 minutes. Any `clarity.ms`, `bing.com`, `apollo.io` or `lfeeder.com` blocked-URI report means a missing CSP entry. Add the host to `csp.ts` with a test, following Task 4.

---

### Task 9: Documentation

The original problem this migration solves is that nobody could answer "what tags are on the site" without reading the source and the live HTML. Write the inventory down.

**Files:**
- Create: `docs/web/TRACKING-TAGS.md`
- Modify: `docs/web/WEB-PRODUCTION.md` (the Analytics section around line 518, and the env table around line 732)
- Modify: `CLAUDE.md` (Live integrations table)

- [ ] **Step 1: Write the tag inventory**

Create `docs/web/TRACKING-TAGS.md`:

```markdown
# Tracking tags

Canonical inventory of every third-party tag on www.cleanstart.com. Update this
file in the same PR as any tag change, whether the change is in code or in GTM.

## How tags are loaded

One GTM container, loaded by `apps/web/src/components/analytics/GtmHeadScript.tsx`
in the document head, immediately after the Consent Mode v2 defaults from
`apps/web/src/lib/consent/consent-mode-snippet.ts`.

Code owns four things GTM cannot:

1. **The loader and its host gate.** `lib/analytics/gtm.ts` refuses to load the
   container on any host in `lib/seo/indexing.ts`, so preview deploys and
   `*.vercel.app` aliases never fire a tag.
2. **Consent Mode defaults.** Queued before the container so every tag evaluates
   the correct state. Region-scoped: denied inside the EEA, UK and Switzerland,
   `analytics_storage` granted elsewhere.
3. **The dataLayer contract.** `lib/analytics/track.ts` is the only place
   application code pushes events. Adding a parameter means adding its key to
   `EVENT_PARAM_KEYS` there and a Data Layer Variable in GTM.
4. **The CSP.** `lib/security/csp.ts` allow-lists vendor hosts. A new vendor in
   GTM still needs a code change here, or its beacons are blocked.

## Live tags

| Tag | ID | Configured in | Consent requirement |
|---|---|---|---|
| Google Tag Manager | `GTM-XXXXXXX` | `NEXT_PUBLIC_GTM_ID`, Vercel production only | None, the container itself sets no cookies |
| GA4 | `G-S6T47D7PZR` | GTM, Google tag on Initialization | Consent Mode only. No extra GTM check, so it stays unmodeled outside the EEA/UK/CH per the 2026-07-22 decision |
| Microsoft Clarity | see GTM | GTM, Custom HTML on All Pages | `analytics_storage` |
| Apollo.io | `691b73cb5443850011f553d1` | GTM, Custom HTML on All Pages | `ad_storage` (Targeting) |
| Leadfeeder / Dealfront | `kn9Eq4RXRqJ8RlvP` | GTM, Custom HTML on All Pages | `ad_storage` (Targeting) |

Cloudflare Turnstile is not a tracking tag. It is bot protection on forms, loaded
by `components/TurnstileWidget.tsx`.

## GA4 events

Pushed by `lib/analytics/track.ts`, mapped to GA4 event tags in GTM:
`page_view`, `generate_lead`, `file_download`, `deal_registration`,
`job_application`, `newsletter_signup`, `thank_you_view`, `cta_click`, `search`.

The GA4 property's Enhanced Measurement "history events" toggle must stay OFF, or
SPA navigations count twice.

## Adding a tag

1. Add the vendor's hosts to `lib/security/csp.ts` with a test. Deploy that first.
2. Build the tag in a GTM workspace with the right consent check, paused.
3. Verify it in GTM Preview.
4. Unpause, publish, then add a row to the table above.

## Publish rights

GTM publish permission is limited to named individuals. A publish puts arbitrary
JavaScript on production with no code review and leaves no trace in git.
```

- [ ] **Step 2: Update WEB-PRODUCTION.md**

In the Analytics section (around line 518), replace the GA4 bullet with:

```markdown
- **GA4** via Google Tag Manager, not `next/script`. The container is loaded in the
  document head by `GtmHeadScript`, host-gated to production. Consent Mode v2, see
  §11. Full tag inventory: `docs/web/TRACKING-TAGS.md`.
```

In the env table (around line 732), add below the `NEXT_PUBLIC_GA4_ID` row:

```markdown
| `NEXT_PUBLIC_GTM_ID` | Production only | `GTM-XXXXXXX` |
```

and change the `NEXT_PUBLIC_GA4_ID` row's note to `Read by the CMS dashboard only; the live tag is configured in GTM`.

- [ ] **Step 3: Update CLAUDE.md**

In the Live integrations table, add a row after the Cloudflare Turnstile row:

```markdown
| Google Tag Manager | Loads GA4, Microsoft Clarity, Apollo.io and Leadfeeder. Tags are configured in the GTM UI, not in code; the loader, consent defaults, host gate and CSP stay in code. See `docs/web/TRACKING-TAGS.md`. | `NEXT_PUBLIC_GTM_ID` |
```

- [ ] **Step 4: Run the docs gate and commit**

```bash
pnpm --filter @cleanstart/web lint
```

Expected: PASS.

```bash
git add docs/web/TRACKING-TAGS.md docs/web/WEB-PRODUCTION.md CLAUDE.md
git commit -m "docs(web): document the GTM tag inventory and ownership split"
```

---

### Task 10: Rollback procedure

Write this down before you need it. Keep the cutover commit hash to hand.

- [ ] **Step 1: Record the rollback triggers**

Roll back if any of these appear within 24 hours of cutover:

- GA4 pageviews roughly double or roughly halve against the previous week.
- `generate_lead` count drops to zero while forms still submit successfully.
- New CSP violation reports for a vendor host that cannot be fixed by an allow-list entry.
- Apollo or Leadfeeder fire before a Targeting opt-in.

- [ ] **Step 2: Fast rollback, GTM only**

Fastest path, no deploy needed: in GTM, publish the previous container version. This stops any misbehaving tag within seconds. The site keeps loading the container and keeps pushing dataLayer events, they simply map to nothing.

- [ ] **Step 3: Full rollback, back to in-code tags**

If the code side is at fault:

```bash
git revert <cutover-commit-sha>
```

Push and deploy. That restores `Ga4HeadScript`, `ApolloScript`, `LeadfeederScript` and the `gtag('event')` emitter. Immediately pause the GA4 tags in GTM, or GA4 will double count.

- [ ] **Step 4: Note the one-way door**

Nothing here is a one-way door. The GTM container can stay published with all tags paused indefinitely, costing nothing, while the in-code tags run as before.
