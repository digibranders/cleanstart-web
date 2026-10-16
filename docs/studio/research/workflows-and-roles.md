# Workflows, roles and rules (research, 2026-10-16)

## 10 most important constraints for the rebuild

1. **Pass the user to every Local API call.** Every rule is enforced only when `overrideAccess:false` and `user:req.user` are set. Local API defaults to `overrideAccess=true` and ignores document locks (`node_modules/payload/dist/collections/operations/local/update.js:7`, `utilities/checkDocumentLockStatus.js:3`).
2. **Publish permission is the same as update permission.** Payload works it out by calling update access with `_status:'published'` (`@payloadcms/next/dist/views/Document/getDocumentPermissions.js:30-37`).
3. **The `seo` role cannot get into the admin.** `Users.access.admin` leaves it out (`collections/Users.ts:47-57`).
4. **The `author` role has no write access at all,** even though the role description says "own drafts" (`Users.ts:101`). It can still mint preview tokens and create media through `/media-ingest-url` (`endpoints/media-ingest-url.ts:78,190`).
5. **Departmental nav scoping is visual only** (`lib/wire-scoped-nav.ts:59-148`). The real limits come from the access functions.
6. **The publish gate's hard blockers are only "slug present, no spaces" and "valid JSON-LD override",** and they apply to 9 collections only (`hooks/publish-gate.ts:93-136`, `lib/wire-publish-gate.ts:17-27`).
7. **Keep the `payload-token` cookie name.** The CMS proxy (`proxy.ts:45`) treats that cookie as the sign of a logged-in request, and the planned Cloudflare cache bypass is keyed on it.
8. **Password-reset mail links to `/admin/reset/:token`** (`auth/operations/forgotPassword.js:93-96`). Override `generateEmailHTML` or keep that route.
9. **Scheduled publishes run as the user who scheduled them,** through jobs that only fire when `PAYLOAD_AUTO_RUN=true` (`payload.config.ts:594-604`, `versions/schedule/job.js`).
10. **Duplicate and delete must go through Payload's own operations** so the `beforeDuplicate`, audit and search/revalidate hooks still fire.

Paths without a prefix are relative to `apps/cms/src/payload/`. Paths starting `node_modules/` or `@payloadcms/` are relative to `apps/cms/node_modules/`.

---

# CleanStart CMS: editorial workflows and rules to reproduce in "Studio"

The installed Payload is **3.84.1** (`apps/cms/node_modules/payload/package.json`), not 3.81 as the plan doc says.

## 0. How Payload enforces rules, and what Studio must mirror

- **Local API skips checks by default.** `overrideAccess` defaults to `true` in every local op (`node_modules/payload/dist/collections/operations/local/update.js:7`, `delete.js:6`, `count.js:5`). Studio server actions must pass `overrideAccess:false, user` or every access and field-access rule below is bypassed.
- **Locks are also ignored by default.** `checkDocumentLockStatus` defaults `overrideLock = true` and a 300 s lock duration (`node_modules/payload/dist/utilities/checkDocumentLockStatus.js:3,12,57`). Studio must pass `overrideLock:false` to honour locks.
- **Publish permission:** `hasPublishPermission` comes from the update access call with `data:{_status:'published'}` (`@payloadcms/next/dist/views/Document/getDocumentPermissions.js:13,30-37,87-90`). No CleanStart access function looks at `data`, so **publish = update** everywhere.
- **The collection list is post-processed** by wrappers applied in this order (`apps/cms/src/payload.config.ts:451-460`):
  1. `wirePublishGate`
  2. `wirePreviewControls`
  3. `wireCustomListView`
  4. `wireExportButton`
  5. `wireScopedNav`
  6. `wireCustomFields`

  Globals get `wireCustomFields` then `wireScopedNavGlobal` (`:466-468`).
- **GraphQL is disabled** (`payload.config.ts:650-652`).
- **CORS and CSRF** both use `adminAllowedOrigins()` (`payload.config.ts:156-170,613-614`).

## 1. Users, roles, RBAC

### 1.1 Users collection (`collections/Users.ts`)

**Fields**
- `name`: text, required (`:73-77`).
- `enabled`: checkbox, default true. Field update is admin-only (`isAdminFieldLevel`). Sidebar (`:78-89`).
- `roles`: select, hasMany, required, default `['author']`. Options come from `ROLES`. Field update is admin-only (`:90-103`).
- `preferences`: json, hidden. Holds saved views and column widths (`:104-138`; used by `admin/lib/saved-views.ts` and `admin/lib/column-widths.ts`).
- Built-in auth fields: email, password, API key.
- `timestamps: true` (`:140`).

**Access**
- create: `isAdmin`. read and update: `isAdminOrSelf`. delete: `isAdmin` (`:42-46`).
- `access.admin` (who may enter the panel) is `admin`, `editor`, `author`, `hr`, `events`, `legal`. **`seo` is not included** (`:47-57`).

**Hooks**
- `beforeLogin` rejects users with `enabled===false`, with the message "This account has been disabled…" (`:59-71`).
- Disabling a user does **not** revoke existing sessions or JWTs. Only new logins are blocked.

**Edit-menu actions**
- `DisableUserAction` sends `PATCH /api/users/:id {enabled:false}`. It is hidden for the user themself and for already-disabled users (`admin/components/DisableUserAction.tsx:25-58`).
- `ReassignContentAction` sends `POST /api/users/reassign-content` (`Users.ts:20-21`).
- The audit action `user_disabled` exists (`collections/audit-log.ts:54`) but **nothing writes it**.

### 1.2 Role values

`ROLES = ['admin','editor','author','seo','hr','events','legal']` (`packages/types/src/index.ts:20`). Comments in that file describe hr/events as "departmental" roles (`:7-19`).

The `typed-user.ts` helpers `userRoles`, `hasRole`, `hasAnyRole` and `userId` read `user.roles[]` (`access/typed-user.ts:17-43`).

### 1.3 Access functions (`access/index.ts`)

| Function | Line | Rule |
|---|---|---|
| `isAuthenticated` | 8 | any user |
| `isAdmin` / `isAdminFieldLevel` | 10 / 12 | admin |
| `isAdminOrEditor` | 14 | admin, editor |
| `isAdminOrSeo` / `isAdminOrSeoFieldLevel` | 23 / 25 | admin, seo |
| `isAdminEditorOrSeo` | 29 | admin, editor, seo |
| `isAdminEditorOrHr` | 45 | admin, editor, hr |
| `isAdminEditorOrEvents` | 53 | admin, editor, events |
| `isAdminEditorOrLegal` | 62 | admin, editor, legal |
| `publishedOrAuthenticated` | 79 | any user sees everything including drafts; anonymous gets `{_status:{equals:'published'}}` |
| `isAdminOrSelf` | 84 | admin, or `{id: equals self}` |

Two endpoints have a broken role check. `topic-suggestions.ts:16-17` and `canonical-check.ts:23-24` test `user.role === 'admin'|'editor'` (singular), but users only have `roles[]`. The result is that **both always return 403**.

### 1.4 Nav hiding and dashboard scoping (`lib/wire-scoped-nav.ts`)

- **Domains**
  - hr: `jobs`, `career-applications`, `resumes`, `departments`, `jobLocations`, `emailSignatures` (`:16-25`).
  - events: `events`, `webinars`, `webinarTypes`, `podcastEpisodes` (`:27-32`).
  - legal: `legalDocuments` (`:34`).
- **Who is "scoped-only":** a user with at least one departmental role and no general role (admin/editor/author/seo) (`:59-66`).
- **Collections:** for a scoped-only user, `admin.hidden` hides every collection outside their domains. Any existing `hidden` setting is kept (`:95-126`).
- **Globals:** all hidden for scoped-only users (`:136-148`).
- **Dashboard:** limited to the same slugs via `scopedCollectionSlugsForUser` (`:74-83`; `admin/components/Dashboard/Dashboard.tsx:492`).
- **This is visual only.** The comment at `:12-14` says so. For example, an hr user can still read draft blogs through the API, because `publishedOrAuthenticated` lets any logged-in user read.

### 1.5 Field-level access that Studio must honour

**Users**
- `roles` and `enabled` are admin-only (`Users.ts:82-84,97-99`).

**`seo.additionalSchema`** on every content document
- read: public. create/update: admin or seo (`fields/seo.ts:375-390`).
- Validated against an allowlist and capped at 16 KB. Hidden in the form; it is edited through `SchemaPreviewField`.
- That UI shows the override editor only to **admin** (`admin/components/SchemaPreviewField.tsx:163-164`).
- Editors cannot write it. An seo-only user cannot reach the content form anyway.

**`seo.schemaHistory`**
- read: authenticated. create/update: never (`fields/seo.ts:418-428`).

**`publishedAt`**
- update: never, readOnly, hidden. `beforeDuplicate` sets it to null (`fields/published-at.ts:38-56`).

**Computed fields locked with `update:()=>false`**
- `readingMinutes`, `wordCount`, `tableOfContents`: Blogs `:244,250,270`; Guides `:200,206,212`; KnowledgeBase `:156,162,168`; News `:217,223`.
- Pages `path` and `breadcrumb` (`:113,122`).
- Jobs `closedAt` (`:275`).
- Events and Webinars `cancelledAt` (`:263`, `:248`).
- Forms `schemaVersion` (`:271`).
- Resources `downloadCount` (`:183`).
- PodcastEpisodes `youtubeVideoId` (`:159`).
- Authors `legacyBio` (`:164`).

**Redirects**
- `from`, `status` and `to` are locked when `source==='slug-change'` (`collections/Redirects.ts:14,56-58,74-76,87-89`).
- `source`, `hitCount` and `lastHitAt` are never editable (`:110,128,139`).

**PageRegistry**
- `path`, `title`, `kind`, `order`, `backingCollection`: never editable (`:110-150`).
- `schemaHistory`: read requires auth; never editable (`:233-238`).
- `additionalSchema`: admin or seo (`:243-247`).

**PreviewAudit**
- `collection`, `docId`, `actor`, `ttlSeconds`, `expiresAt`: never editable (`:39-74`).
- Only `label` and `revokedAt` can be edited.

**EmailSignatures**
- `phoneE164` and `phoneDisplay` can only be read by authenticated users (`:112,140`).

### 1.6 Role × collection matrix

Legend:
- R = read (* = anonymous sees published only; pub = public).
- C, U, D = create, update, delete.
- P = publish (same as U on draft-enabled collections).
- "-" = denied.
- seo-only users cannot open the admin (§1.1), so their column shows what the API allows.

| Collection (file:access lines) | admin | editor | author | seo | hr | events | legal |
|---|---|---|---|---|---|---|---|
| blogs, news, guides, case-studies, knowledgeBase, resources, pages (R `publishedOrAuthenticated`*, CUD `isAdminOrEditor`; e.g. `Blogs.ts:44-48`) | RCUDP | RCUDP | R | R | R | R | R |
| events, webinars, podcastEpisodes (`Events.ts:36-40`, `Webinars.ts:66-70`, `PodcastEpisodes.ts:128-132`) | RCUDP | RCUDP | R | R | R | RCUDP | R |
| jobs (`Jobs.ts:61-65`) | RCUDP | RCUDP | R | R | RCUDP | R | R |
| legalDocuments (`Legal.ts:58-62`) | RCUDP | RCUDP | R | R | R | R | RCUDP |
| webinarTypes (pub; `WebinarTypes.ts:22-26`) | RCUD(P) | RCUD(P) | R | R | R | RCUD(P) | R |
| departments, jobLocations, emailSignatures (pub; `Departments.ts:25-29`, `JobLocations.ts:16-20`, `EmailSignatures.ts:76-80`) | RCUD | RCUD | R | R | RCUD | R | R |
| aboutGalleries, authors, categories, newsCategories, knowledgeCategories, industries, resourceTypes, regions, pressTypes, media, redirects (pub; CUD `isAdminOrEditor`) | RCUD(P) | RCUD(P) | R | R | R | R | R |
| forms (`Forms.ts:21-30`) | RCUD(P) | RCUD(P) |: |: |: |: |: |
| leads, partner-applications, deal-registrations (`Leads.ts:107-115`, `PartnerApplications.ts:49-53`, `DealRegistrations.ts:40-44`) | R C D (no U) | R |: |: |: |: |: |
| career-applications (`CareerApplications.ts:24-28`) | R D | R |: |: | R |: |: |
| resumes (`Resumes.ts:23-27`; no C) | R U D | R U D |: |: | R U D |: |: |
| signatureTemplates (R pub-or-auth; `SignatureTemplates.ts:65-73`) | RCUDP | R | R | R | R | R | R |
| emailAssets (pub; `EmailAssets.ts:90-96`) | RCUD | R | R | R | R | R | R |
| pageRegistry (pub; C never; `PageRegistry.ts:84-88`) | R U D | R U | R | R U | R | R | R |
| brokenLinks (`BrokenLinks.ts:31-35`) | R D | R |: |: |: |: |: |
| previewAudit (`PreviewAudit.ts:26-33`; C never) | R U D | R U |: |: |: |: |: |
| searchLog (`SearchLog.ts:30-36`) | RCUD | R |: |: |: |: |: |
| users (`Users.ts:42-46`) | RCUD | R/U self | R/U self | R/U self | R/U self | R/U self | R/U self |
| integrations, analyticsCache (`Integrations.ts:517-521`, `AnalyticsCache.ts:35-39`) | RCUD |: |: |: |: |: |: |
| consentLog (`ConsentLog.ts:37-41`), webhooks_dead_letter (`WebhookDeadLetter.ts:38-42`) | R D |: |: |: |: |: |: |
| audit-log (`audit-log.ts:25-29`) | R |: |: |: |: |: |: |
| Global siteSettings, legal (R auth; U admin; `globals/siteSettings.ts:10-12`, `globals/legal.ts:9-11`) | RU | R | R | R | R* | R* | R* |
| Global seoDefaults (R pub; U admin; `globals/seoDefaults.ts:12-18`) | RU | R | R | R | R* | R* | R* |
| Global impactStats, spotlights (R pub; U admin/editor; `impactStats.ts:13-15`, `spotlights.ts:40-42`) | RU | RU | R | R | R* | R* | R* |

R* = API-readable but hidden from scoped-only users' navigation.

**Gaps between the stated design and the code**
- **author:** the stated intent "own drafts" is **not implemented**; the role is read-only. It still gets: checklist and preview endpoints (`publish-checklist.ts:24`, `preview.ts:60,267`), and media creation through `/media-ingest-url`. That endpoint calls `payload.create` without `overrideAccess:false`, so it bypasses `Media.access.create` (`media-ingest-url.ts:78,190-194`).
- **Architecture doc:** it describes Editor/Publisher/Admin roles (`docs/architecture/cleanstart-cms-architecture.html` ~lines 2988-3010). The **code has no Publisher role**: editor = publisher. Treat the code as authoritative.

## 2. Auth

**Users auth config** (`Users.ts:26-41`)
- `tokenExpiration` 8 h (`:27`).
- `maxLoginAttempts` 5, `lockTime` 10 min (`:28-29`).
- `useAPIKey: true`. The web app's read-only `preview-bot` uses `Authorization: users API-Key …` to read drafts (`:30-36`).
- Cookies: `sameSite:'Lax'`, `secure` in production (`:37-40`).

**Payload defaults that also apply**
- `useSessions` defaults to true (`node_modules/payload/dist/collections/config/defaults.js:128,142`), so the JWT is tied to a server-side session and logout invalidates it.
- Auth collections get `disableDuplicate` by default (`collections/config/sanitize.js:217-220`).
- Cookie name is `payload-token`; the config has no `cookiePrefix` override.

**`payload-token` is load-bearing.** The CMS proxy (`apps/cms/src/proxy.ts:44-45,79,91`) only adds edge-cache headers to requests *without* that cookie. The planned Cloudflare cache bypass is also keyed on it (`:15-21`).

**Login**
- Stock Payload login form, with `CmsLoginHero` before it and `CmsLoginFooter` after (`payload.config.ts:322-325`).
- The comment at `:322-323` says a full login replacement waits on 2FA.

**Logout:** stock Payload.

**Forgot / reset password**
- No `forgotPassword` override on Users, so Payload's default template is used.
- The reset link is `serverURL + adminRoute + admin.routes.reset/<token>`, i.e. `/admin/reset/:token` (`node_modules/payload/dist/auth/operations/forgotPassword.js:88-110`).
- Default expiry is 1 h (`:78`).
- **Studio must keep that route or set `auth.forgotPassword.generateEmailHTML`.**

**Brevo email adapter** (`lib/email/payload-adapter.ts:53-94`, wired at `payload.config.ts:618`)
- Default from address: `BREVO_SENDER_EMAIL` or `no-reply@cleanstart.com`.
- Converts nodemailer-style addresses (`:27-48`).
- Wraps text-only bodies as HTML (`:63-70`).
- Logs an error when Brevo's status is not `synced` (`:86-91`).

**Account view** (`CmsAccountView`, `payload.config.ts:335-340`; form at `admin/components/auth/CmsAccountForm.tsx:51-80`)
- Sends `PATCH /api/users/:id` with `{name, email, password?}` and checks that the confirmation matches.
- **No current-password check**; `isAdminOrSelf` allows it.
- The 12-character minimum is HTML `minLength` only (`:134,145,149`). **There is no server-side password policy.**

**2FA**
- Deferred: placeholder fieldset at `CmsAccountForm.tsx:153-157`.
- `docs/BACKLOG.md:47` (A9) defers it to "Phase I hardening"; the plugin choice (`payload-2fa-plugin` vs a custom TOTP strategy) is still open.
- The architecture HTML says the same at `:4292` and `:5601`.

## 3. Publishing lifecycle

### 3.1 Drafts, autosave, versions

**There is no autosave anywhere.** No collection sets `autosave`; grep finds none. The architecture doc's 800 ms autosave (~html line 3040) is not implemented.

| Collection | versions config (file:line) |
|---|---|
| blogs, news, guides, resources, jobs, pages, knowledgeBase, events, podcastEpisodes, webinars, case-studies | `drafts:{schedulePublish:true}, maxPerDoc:25` (Blogs `:350`, News `:262`, Guides `:277`, Resources `:210`, Jobs `:332`, Pages `:210`, KB `:232`, Events `:347`, Podcast `:260`, Webinars `:330`, CaseStudies `:258`) |
| legalDocuments | `drafts:{schedulePublish:true}`, no cap. Comment: keeps full amendment history (`Legal.ts:138-140`) |
| aboutGalleries, authors, categories, departments, forms, industries, knowledgeCategories, newsCategories, pressTypes, regions, resourceTypes, signatureTemplates, webinarTypes | `drafts:true` (Payload default cap of 100: `collections/config/sanitize.js:159-162`) |
| Globals siteSettings, legal, seoDefaults | `drafts:false, max:50` |

**Trash / soft delete:** not enabled anywhere. Grep finds no `trash`, so it defaults to off.

**Unpublish**
- `CmsPublishButton` sends `PATCH /api/:coll/:id?unpublishAllLocales=true {_status:'draft'}` behind a confirm dialog. It does not submit the form (`admin/components/CmsPublishButton.tsx:142-202`).
- Unpublish is available only when `hasPublishPermission && hasPublishedDoc && !isTrashed && drafts` (`:93-98`).
- Publish is enabled only when `hasPublishPermission && (modified || unpublishedVersionCount>0 || !hasPublishedDoc) && not uploading` (`:100-103`).
- Publish submits with `overrides:{_status:'published'}` (`:105-124`).
- This button replaces the stock publish button through `docStatusBarEditConfig` (`admin/doc-status-bar-mount.ts:55-60`).

**Discard changes** (`admin/components/DocKebabExtras.tsx:79-104,113-120`)
- Re-fetches `GET /api/:coll/:id?draft=true&depth=0` and resets the form.
- Shown only when autosave is off.
- The same menu also links to `/versions` and `/api`.

### 3.2 Scheduled publish

**Studio dialog** (`admin/components/SchedulePublishDialog.tsx`)
- Calls the `schedulePublish` server function (`:107,231-238`).
- The `minDate` is now (`:334`).
- Has a timezone selector (`:109-115`).
- Lists upcoming jobs via `POST /api/payload-jobs` with method override GET, filtered by `taskSlug=schedulePublish`, `waitUntil>now`, `input.doc.value/relationTo` (`:152-211`).
- Deletes a job via `schedulePublish({deleteID})` (`:259`).
- Shortcut ⌘⇧S opens it (`CmsPublishButton.tsx:206-221`).

**Server function** (`@payloadcms/ui/dist/utilities/schedulePublishHandler.js`)
- Checks `canAccessAdmin` first, so seo-only users fail.
- Queues `payload.jobs.queue({task:'schedulePublish', input:{type,doc,global,locale,timezone,user:user.id}, waitUntil:date})`.
- When `deleteID` is passed it deletes the `payload-jobs` row, then **also queues an empty job** (no doc → no-op). Studio should simply delete the row.

**Job** (`node_modules/payload/dist/versions/schedule/job.js:4-45`)
- Runs `payload.update({data:{_status}, user, overrideAccess: user===null})`.
- So it **runs as the user who scheduled it**: access rules and the publish gate apply at run time.

**Runner**
- The `default` queue cron runs every minute (`payload.config.ts:594-597`).
- All auto-run cron schedules register only when `PAYLOAD_AUTO_RUN==='true'` (`:604`).

### 3.3 Publishing checklist and gates

**Gated collections:** `blogs`, `news`, `guides`, `resources`, `knowledgeBase`, `events`, `webinars`, `jobs`, `pages` (`lib/wire-publish-gate.ts:17-27`).
- **Not gated:** case-studies, podcastEpisodes, legalDocuments, taxonomies.
- The wrapper puts `publishGateHook(slug)` *first* in `beforeChange`, and adds the banner, override guard and slug guard to `beforeDocumentControls` (`:38-72`).

**Checks** (`hooks/publish-gate.ts:52-152`)

| Check | Severity | Rule (lines) |
|---|---|---|
| seo-title | warn | 30-60 characters, from `seo.title`, falling back to `title` then `name` (`:59-74`) |
| meta-description | warn | 120-160 characters, from `seo.description`, falling back to `abstract` (`:76-91`) |
| slug | **blocker** | present and no whitespace (`:93-107`) |
| featured-image | warn | `featuredImage`, `heroImage`, `coverImage` or `image`; applies to `HAS_FEATURED_IMAGE` collections (`:20-31,109-123`) |
| jsonld-override | **blocker** | only when `seo.additionalSchema` is set (`:125-136`) |
| word-count | warn | `readingMinutes > 0`; blogs, news, guides only (`:18,138-149`) |

- **Hard gate:** `publishGateHook` runs only when `data._status==='published'`. Blockers throw a `ValidationError` with message `[Publish gate] …` and `path` set to the check id (`:162-178`).
- **Checklist endpoint:** `GET /api/:collection/:id/checklist` (`endpoints/publish-checklist.ts:20-53`). Allowed for admin, editor and author. Reads the *saved* document with `findByID(overrideAccess:false, depth 0)` and returns `{ok, checks, blockerCount, warnCount}`.

**`PublishChecklistBanner`** (`admin/components/PublishChecklistBanner.tsx:44-138`)
- Fetches the checklist on mount and whenever the id changes; advisory only.
- Summary text is one of:
  - "Ready to publish"
  - "N blocker(s) must be fixed…"
  - "N warning(s): publishing is allowed"

**`PublishOverrideGuard`** (`PublishOverrideGuard.tsx:44-154`)
- Intercepts clicks on `#action-save` during the capture phase.
- If the *live form* title or description is outside 30-60 / 120-160 characters, it shows a confirm dialog: "SEO recommendations not met" with a "Publish anyway" button.
- This is a client-side nag only.

**`SlugRequirementGuard`** (`SlugRequirementGuard.tsx:16-129`)
- Disables `#action-save` and `#action-save-draft` while the slug status is `empty`, `checking`, `collision` or `invalid`, with the reason as a tooltip and a toast on click.
- Status comes from `SlugField` through `admin/lib/slug-status-store`.
- `SlugField` checks collisions via `GET /api/:coll?where[slug]…` (`SlugField.tsx:205-209`).

**Slug field, server side** (`fields/slug.ts:82-150`)
- Required, unique (except Pages, which use a unique `(slug, parent)` index: `fields/slug.ts:86`, `collections/Pages.ts:50-54`).
- Maximum 120 characters, with a hint at 80 (`:21-34`).
- Async validation checks collisions with `overrideAccess` (`:98-135`).
- A `beforeValidate` hook slugifies the value, or falls back to the source field (`:136-148`).

### 3.4 Side effects on save, publish and delete

All of these are fail-soft (log, never throw), and most are deferred until after commit via `runAfterCommit` / `revalidateWebAfterCommit` keyed on `req.transactionID`.

**`slugChangeRedirectHook`** (`hooks/slug-change-redirect.ts:11-141`, afterChange)
- Fires when the URL changes and the document was or is published.
- Upserts a redirect row `{from, to, status:'301', source:'slug-change'}` with `overrideAccess`.
- Then collapses chains: rows pointing at the old URL are re-pointed, and reverse self-cycles are deleted.

**`revalidateWebPublishAfterChangeHook`** (`hooks/revalidate-web-publish.ts:37-77`)
- Fires if the document is published now or was before.
- Revalidates the listing, current URL and previous URL, plus the sitemap tag.
- The afterDelete version is at `:83-112`.
- The transport needs `WEB_REVALIDATE_URL` and `WEB_REVALIDATE_SECRET`; it does nothing when `WEB_REVALIDATE_SUPPRESS` is set (`lib/web-revalidate.ts:8-11,98-136`).

**`indexNowPublishAfterChangeHook`** (`hooks/indexnow-publish.ts:20-78`)
- Fires on the first draft→published transition only.
- Requires `isIndexingAllowed()` and `INDEXNOW_KEY`.

**`webhooksPublishAfterChangeHook`** (`hooks/webhooks-publish.ts:29-37`): fires on the first publish only.

**`searchSyncAfterChangeHook` / `AfterDelete`** (`hooks/search-sync.ts:12-45,52-80`)
- Meilisearch, deferred until after commit.
- Drafts and noindex documents are removed from the index (`lib/search/sync.ts:77-92`).
- A nightly `meiliReindex` repairs drift (`payload.config.ts:562-565`).

**Other hooks:** `firstPublishHook` (stamps `publishedAt`; `hooks/first-publish.ts:38-73`), `contentUpdatedAt`, `bodyStats`, `schemaOverrideAuditHook` and `displayPublishedAtAuditHook` (both write audit-log rows).

**Which collection has which hooks**

| Collection (hooks block) | slugRedirect | revalidateWeb | IndexNow | webhooks | search |
|---|---|---|---|---|---|
| blogs (`Blogs.ts:324`), news (`News.ts:237`), guides (`:251`), knowledgeBase (`:203`), resources (`:193`), events (`:335`), webinars (`:312`), jobs (`:314`), case-studies (`:243`), legalDocuments (`Legal.ts:123`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| authors (`Authors.ts:222-232`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| **pages** (`Pages.ts:198-208`), **podcastEpisodes** (`PodcastEpisodes.ts:243-258`) | ✓ | **✗** | ✓ | ✓ | ✓ |
| taxonomies (categories, newsCategories, knowledgeCategories, industries, departments, regions, pressTypes, webinarTypes) | ✓ (plus a parent cycle guard) | resourceTypes only |: |: |: |
| emailSignatures (`EmailSignatures.ts:202`) |: | ✓ |: |: |: |
| pageRegistry (`PageRegistry.ts:90`) |: | own `revalidatePageRegistryHook` |: |: | ✓ |

### 3.5 Cache purge

`POST /api/cache-purge` (`endpoints/cache-purge.ts:15-135`)
- `scope:'page'` needs *any authenticated* user (`:44-57`). The doc comment says "editor+", but the code does not check a role.
- `scope:'all'` and `scope:'custom'` are admin-only (`:59-76`).
- Purgeable collections are listed in `lib/web-pages.ts:16-35`.

UI
- `PurgePageButton` is mounted through `showPurge` (`doc-status-bar-mount.ts:43-47`).
- `CacheView` at `/admin/cache` (`payload.config.ts:357-361`) is shown to admins only (`admin/components/cache/CacheClient.tsx:24-25`).
- `GET /api/cache-search` requires authentication (`endpoints/cache-search.ts:64-67`).

## 4. Preview

**Previewable collections:** blogs, news, pages, jobs, events, webinars, guides, knowledgeBase, podcastEpisodes, resources, legalDocuments (`lib/preview/paths.ts:19-31`). Case-studies is not included. Paths are built by `previewPathForDoc` (`:47-67`).

**Wiring** (`lib/wire-preview.ts:34-90`)
- Live preview URL and preview button both go to `/api/preview/redirect?collection=…&docId=…` (`:53-60,79-83`).
- Live preview breakpoints: Mobile 375×667, Tablet 768×1024, Laptop 1280×800, Desktop 1440×900 (`:11-16`).
- `PreviewMenu` is added to `beforeDocumentControls`.

**Endpoints** (`endpoints/preview.ts`)
- `POST /preview/token`
  - Allowed for admin, editor, author (`:57-61`).
  - Body: `{collection, docId, ttlSeconds, label≤120}` (`:23-24`).
  - TTL must be one of 1 h, 24 h, 72 h, 7 d, 30 d (`lib/preview/jwt.ts:58-64`).
  - Returns 409 if the document has no slug.
  - Writes a `previewAudit` row, then signs an HS256 JWT with `PREVIEW_JWT_SECRET` (≥32 characters; `jwt.ts:14,44-47`).
  - Returns `{token, url:${WEB}/preview/<coll>/<slug>?token=, auditId, expiresAt}` (`:63-136`).
- `POST /preview/verify`
  - No auth; the token is the credential.
  - Checks the JWT, that the audit row exists and is not revoked, and that it matches the token; returns the path (`:149-212`).
  - Called by the web app at `apps/web/src/app/preview/[collection]/[slug]/page.tsx:39`.
- `POST /preview/revoke`: admin and editor only; sets `revokedAt` (`:223-245`).
- `GET /preview/redirect`
  - Allowed for admin, editor, author.
  - Mints a 24 h token with the label `auto · "Preview" button`, then redirects 302 (`:261-333`).

**UI**
- `PreviewMenu` items: Open in new tab, Toggle live preview pane (clicks Payload's hidden `#live-preview-toggler`), Copy shareable link (`admin/components/PreviewMenu.tsx:47-135`).
- `CopyPreviewLink` dialog: TTL presets (default 24 h), optional label, copies the link to the clipboard (`CopyPreviewLink.tsx:12-75`).

**PreviewAudit collection** (`collections/PreviewAudit.ts:16-86`)
- Rows are created only by the endpoints (create is `()=>false`).
- Editors can set `revokedAt`.
- The `purgePreviewAudit` job deletes rows 90 days after expiry, daily at 03:30 (`payload.config.ts:546-549`).

## 5. Locking, duplicate, trash, bulk, export

**Document locking**
- No collection sets `lockDocuments`, so the **Payload default is on for every collection, with a 300 s lock** (`checkDocumentLockStatus.js:12,57`), stored in `payload-locked-documents`.
- Local API ignores locks unless `overrideLock:false` is passed (§0).
- The architecture doc also plans a 30 s `updatedAt` polling "stale-edit banner" (html ~3075-3098). It is not found in code.

**Duplicate**
- Enabled by default on non-auth collections.
- Field `beforeDuplicate` hooks:
  - `title` gets " (copy)" appended (`fields/title.ts:11-22`).
  - `publishedAt`, `displayPublishedAt` and `contentUpdatedAt` are set to null (`fields/published-at.ts:55`, `display-published-at.ts:48`, `content-updated-at.ts:25`).
  - Payload's default appends " - Copy" to unique text fields such as `slug`; the slug `beforeValidate` hook then slugifies it (`node_modules/payload/dist/fields/setDefaultBeforeDuplicate.js:5-30`).
- Bulk duplicate calls `POST /api/:coll/:id/duplicate` one row at a time and sets `_status:'draft'` when drafts are enabled. It requires create permission and `!disableDuplicate` (`views/list/BulkActionBar.tsx:56-101,124-125`).
- **Studio must use `payload.duplicate()`** so these hooks run.

**Trash:** not configured, so deletes are hard deletes.

**Bulk actions** (`BulkActionBar.tsx:195-243`)
- Clear.
- Edit: deep-links to Payload's edit-many with `#edit-many`.
- Duplicate.
- Delete: `DELETE /api/:coll?where[id][in]=…` behind a confirm dialog; requires `hasDeletePermission && !disableBulkDelete` (`:18-50`).
- **There is no bulk publish or unpublish.**

**Generic export** (`GET /api/:coll/export`)
- Collections: blogs, news, guides, case-studies, knowledgeBase, resources, events, webinars, podcastEpisodes, jobs, pages, aboutGalleries, authors, forms, deal-registrations, career-applications, legalDocuments (`lib/export/exportable-collections.ts:20-38`; wired in `lib/wire-export-button.ts:27-42`).
- Date field is `news.publicationDate`; otherwise `publishedAt` if present, else `createdAt` (`:17-34`).

Handler (`lib/export/build-export-endpoint.ts:86-241`)
- **Admin or editor only.** HR cannot export career-applications.
- Uses `overrideAccess:true`.
- Query parameters (zod): `fields` (required), `format` csv or xlsx, `from`, `to` (a date-only `to` covers the whole day), `where` (JSON), `search` (merged with `mergeListSearchAndWhere`), `sort` (`:19-32,112-149`).
- Pages of 200, capped at 100 pages = 20 000 rows; when truncated it adds a marker row (`:15-17,198-209`).
- The `__schemaTypes` virtual column triggers depth 2 (`:155-177`).
- Header labels come from field labels (`:215-216`).
- Field denylist is only `ip` and `userAgent` (`lib/export/serialize-field.ts:17`).
- UI: `ExportDrawer`, opened from the list kebab menu (`views/list/CmsListView.tsx:98,126,388-399`).
- Plan doc: `docs/superpowers/plans/2026-07-07-list-export.md` (header `:1-12`, UI task `:841+`).

**Leads CSV** (`GET /api/leads/export-csv`)
- Admin or editor (`endpoints/export-leads-csv.ts:161-167`).
- Filters `formId`, `since`, `until` (`:112-121`).
- Cap 200×100 = 20 000 rows (`:25-31`).
- Writes a `lead_exported` audit-log row.
- Sets `x-leads-truncated` / `x-leads-truncated-at` headers (`:254-256`).
- `LeadsCsvTruncationBanner` patches `window.fetch` to read those headers (`admin/components/LeadsCsvTruncationBanner.tsx:31-57`).

**Partners CSV** (`GET /api/partner-applications/export-csv`)
- Admin or editor; writes a `partner_exported` audit row; sets `x-partners-truncated` (`export-partners-csv.ts:78-151`).
- Triggered by `PartnersExportButton` (`PartnerApplications.ts:44-46`).

## 6. Special and immutable collections

**Leads** (`collections/Leads.ts`)
- Append-only: update is `()=>false`, create is admin-only (public submissions go through `/api/leads/submit` with `overrideAccess`) (`:107-115`).
- "Create New" is hidden with CSS (`:91-96`).
- Components above the list (`:97-104`): `LeadsImmutableBanner`, `LeadsCsvTruncationBanner`, `DsarActionsPanel`, `FlaggedLeadsTab`.
  - `FlaggedLeadsTab` lists leads where the honeypot is non-empty or `turnstilePassed=false`, and bulk-deletes them with `DELETE /api/leads/:id` (`FlaggedLeadsTab.tsx:77-121`).
- `afterDelete` writes a `lead_deleted` audit row (`:14-76`).
- Endpoints: `submit`, `submit OPTIONS`, `export-csv` (`:116`).

**DSAR** (`endpoints/leads-dsar.ts`)
- `GET /api/leads/dsar/find?email=`
  - Admin only, rate limited to 5/min and 50/day per IP.
  - Writes a `dsar_export` audit row; returns matches (`:81-135`).
- `POST /api/leads/dsar/delete {email}`
  - Admin only, same rate limit.
  - Runs HubSpot GDPR delete (fail-soft), deletes leads and career-applications for that email, and writes a `dsar_erasure` audit row for each (`:20-22,140-230`).

**Retry sync:** `POST /api/leads/:id/retry-sync`. Admin only, 5/min and 100/day. Re-runs only the failed secondary handlers; returns 400 `no_failed_syncs` otherwise (`endpoints/retry-lead-sync.ts:16,52-130`).

**ConsentLog**
- Read and delete: admin. Create and update: never (`ConsentLog.ts:37-41`).
- Rows come from `POST /api/consentLog/ingest`, authorised by `CONSENT_INGEST_SECRET` (`:106-112`; `endpoints/consent-ingest.ts:41`).
- Purged after 24 months.

**audit-log**
- Read: admin. Create, update, delete: never (`audit-log.ts:25-29`).
- Actions: `lead_deleted`, `lead_exported`, `partner_exported`, `dsar_export`, `dsar_erasure`, `schema_override_changed`, `user_disabled` (never written), `content_reassigned`, `display_publish_date_overridden` (`:48-56`).

**SearchLog**
- Read: admin and editor. Create, update, delete: admin. Writes come from `/api/search/analytics` (`SearchLog.ts:30-36`).
- Purged after 90 days.

**WebhookDeadLetter** (`webhooks_dead_letter`)
- Read and delete: admin. Create and update: never; all fields read-only (`WebhookDeadLetter.ts:38-122`).
- The `retryWebhook` job runs every 5 minutes.

**BrokenLinks**
- Written by cron; read by admin and editor; deleted by admin only (`BrokenLinks.ts:22-35`).
- The nightly scan runs at 04:30.

**AnalyticsCache**
- Admin only; server-managed (`AnalyticsCache.ts:25-39`).
- Pruned after 90 days.

**Integrations** (`collections/Integrations.ts`)
- Admin only (`:517-521`).
- `kind` cannot change after create, and reserved kinds (zohoCrm) cannot be created (`:112-124`).
- Per-row secrets are AES-256-GCM encrypted in `beforeChange`. A blank value or the mask sentinel keeps the previous ciphertext (`:105-155`).
- `afterRead` masks secrets with the sentinel `••••••• (saved: paste a new value to replace)` unless `context.skipSecretMask` is set (`:157-181`).
- **Studio must send the sentinel or an empty string back unchanged.**
- Endpoints (`:528-532`; `endpoints/integrations-actions.ts:72,182,248`), all admin only:
  - `POST /api/integrations/:id/test`
  - `GET /api/integrations/:id/health`
  - `GET /api/integrations/:id/audit`
- Inbound: `POST /api/integrations/calcom` (signature checked, rate limited).

**Redirects**
- Public read; admin and editor write (`Redirects.ts:39-44`).
- Field locks are listed in §1.5.
- `to` is required unless status is 410, and cannot equal `from` (`:79-101`).
- `redirectCycleGuardHook` (`:157`).
- `POST /api/redirects/import`
  - Admin or editor, rate limited.
  - Body: `{rows≤5000:[{from,to?,status?,notes?}], dryRun?}`.
  - Never overwrites `slug-change` rows (`endpoints/redirects-import.ts:27-78`).
- `POST /api/redirects/record-hit`: authorised by the `x-redirect-hit-secret` header when `REDIRECT_HIT_SECRET` is set (`redirects-record-hit.ts:15,38-43`).

**Media**
- Public read; admin and editor write (`Media.ts:75-82`).

Upload config (`:83-99`)
- MIME allowlist.
- Images resized to at most 2400 px wide and converted to webp at quality 82.
- Sizes: thumb 400, card 800, hero 1600.

Fields
- `folder`, `decorative`.
- `alt` is required unless the image is decorative.
- `caption`, `credit`, `prefix`, `focalPoint`.

`beforeValidate` (`:212+`)
- Size limits (images 25 MB, PDF 50 MB, video 200 MB, zip 100 MB; `lib/upload-limits.ts:10-16`).
- Sanitises SVGs.
- Keeps the filename unchanged on update.
- On create, builds a canonical filename from alt / name / `x-media-context-hint`, with collision suffixes.

`beforeChange`
- `rejectFilenameRename` (`:45,332`): you cannot rename by editing the field.
- Prefix is taken from the folder.

Endpoints
- Rename via `POST /api/media/:id/rename {filename}`. Admin or editor. Copies the R2 objects, updates the document, then deletes the old keys (`endpoints/media-rename.ts:109-135`).
- `POST /api/media-ingest-url {url, folder?, alt?}`. Admin, editor or author; SSRF guard; 25 MB maximum (`media-ingest-url.ts:19-24,61-78`).

Storage
- R2 through `@payloadcms/storage-s3`, only when all four `R2_*` variables are set (`payload.config.ts:137-143,186-232`).
- `media` and `emailAssets` are served straight from the CDN (`disablePayloadAccessControl`).
- **Resumes go through Payload's access control** (private).

**EmailAssets**
- Admin only for writes; PNG, JPEG or GIF; filename rename rejected (`EmailAssets.ts:88-123`).

**PageRegistry**
- Rows are seeded only; create is `()=>false`. Admin, editor and seo may update; admin deletes (`PageRegistry.ts:84-88`).
- `defaultSort: 'order'`; `PageSchemaFilters` sits above the list.
- `GET /api/pageRegistry/live-schema` requires authentication (`endpoints/page-live-schema.ts:75,137`).

**DealRegistrations and PartnerApplications**
- Append-only: read by admin and editor, create admin-only, update never, delete admin-only.
- Public `/apply` (+ OPTIONS) endpoints use Turnstile and rate limiting (`DealRegistrations.ts:40-46`; `PartnerApplications.ts:49-55`).
- PII is redacted after 365 days (`piiRedactedAt`).

**CareerApplications**
- Read: admin, editor, hr. Create and update: never. Delete: admin.
- Public `/apply` endpoint (`CareerApplications.ts:24-30`).
- PII is purged after 365 days, daily at 03:45.

**Resumes**
- Private upload. Read, update and delete: admin, editor, hr. Create: never.
- MIME types PDF, DOC, DOCX; 10 MB limit (`Resumes.ts:23-50`; `upload-limits.ts:14,20`).

**SignatureTemplates:** an `afterChange` hook clears `isDefault` on other templates when a published template becomes the default (`SignatureTemplates.ts:163+`).

**Forms:** a `beforeChange` hook runs `formsCoerceHook` then `formSchemaVersionHook` (consent required, unsafe regex rejected) (`Forms.ts:299`).

## 7. Endpoints called by the admin UI

| Method and path | Auth | Purpose / file |
|---|---|---|
| GET `/api/:coll/:id/checklist` | admin, editor, author | Publish checklist (`publish-checklist.ts:20`) |
| POST `/api/preview/token` | admin, editor, author | Mint a share link (`preview.ts:57`) |
| POST `/api/preview/verify` | token | Web app verifies a token (`preview.ts:149`) |
| POST `/api/preview/revoke` | admin, editor | Revoke a link (`preview.ts:223`) |
| GET `/api/preview/redirect` | admin, editor, author | 24 h token, then 302 (`preview.ts:264`) |
| POST `/api/cache-purge` | page: any user; all/custom: admin | ISR purge (`cache-purge.ts:87`) |
| GET `/api/cache-search` | authenticated | Find pages to purge (`cache-search.ts:64`) |
| POST `/api/media/:id/rename` | admin, editor | R2 rename (`media-rename.ts:132`) |
| POST `/api/media-ingest-url` | admin, editor, author | Server-side image fetch (`media-ingest-url.ts:75`) |
| POST `/api/redirects/import` | admin, editor | Bulk upsert (`redirects-import.ts:66`) |
| POST `/api/users/reassign-content` | admin | `{fromAuthorId,toAuthorId}`; writes a `content_reassigned` audit row (`user-offboard.ts:13-15,39-42`) |
| GET `/api/leads/dsar/find`, POST `/api/leads/dsar/delete` | admin | DSAR (`leads-dsar.ts:81,140`) |
| POST `/api/leads/:id/retry-sync` | admin | CRM retry (`retry-lead-sync.ts:52`) |
| GET `/api/leads/export-csv`, GET `/api/partner-applications/export-csv` | admin, editor | PII CSV with audit row |
| GET `/api/:coll/export` | admin, editor | Generic CSV/XLSX |
| POST `/api/integrations/:id/test`, GET `…/health`, GET `…/audit` | admin | Integrations |
| GET `/api/jsonld/:collection/:id` | public, rate limited | JSON-LD (`jsonld.ts:89`) |
| POST `/api/jsonld/:collection/:id` | admin | JSON-LD preview (`jsonld.ts:206-209`) |
| GET `/api/pageRegistry/live-schema` | authenticated | Live schema (`page-live-schema.ts:137`) |
| GET `/api/blog-cta-suggestion` | admin, editor | CTA auto-pick (`blog-cta-suggestion.ts:64,101`) |
| GET `/api/topic-suggestions` | broken: always 403 (`user.role` bug) | Keywords field |
| GET `/api/canonical/health-check` | broken: always 403 (`user.role` bug) | Canonical field |
| GET `/api/dashboards/{ga4-overview,gsc-overview,crux,ga4-realtime,:provider,per-doc/gsc-queries}`, POST `/api/dashboards/per-doc/gsc-inspect` | admin, editor | Analytics (`dashboards*.ts`) |
| GET `/api/content-insights`, GET `/api/lead-attribution` | admin, editor | Report views |
| POST `/api/payload-jobs` (method-override GET) | authenticated (Payload default) | List scheduled jobs |
| Server function `schedulePublish` | `canAccessAdmin` | Queue or delete a scheduled publish |
| Standard REST: `PATCH/DELETE /api/:coll[/:id]`, `POST /:id/duplicate`, `GET ?draft=true`, `/api/users/:id` (preferences, account, disable) | collection access | Various components (full list from grep of `admin/` fetches) |
| GET `/api/access` | Payload built-in | Permissions map |

Public, not admin: `sitemap*.xml`, `robots.txt`, `/search`, `/search/analytics`, `leads/submit`, `*/apply`, `consentLog/ingest`, `redirects/record-hit`, `resources/:slug/{token,download}`, `emailSignatures/:slug/render`, `integrations/calcom`.

## 8. Architecture HTML constraints

`docs/architecture/cleanstart-cms-architecture.html`. These describe the intended design; where they differ from the code, that is noted.

**#authoring (`:2685-3120`)**
- Paste pipeline: Word, Google Docs and Notion are detected and sanitised (`:2685-2760`).
- Editor duties after paste (`:2860-2867`): alt text (described as "publish blocked until filled"; in code `Media.alt` is required on upload instead), internal-link conversion, heading-hierarchy review, code-language hints.
- Heading governance (`:2914-2920`): no skipped levels, as a soft inline warning; TOC built automatically from H2/H3.
- RBAC (`:2988-3010`) describes Editor/Publisher/Admin. **Not the code.**
- Collection-scoped permissions are deferred to v1.5.
- Globals are always admin-only per the doc. **The code lets editors update impactStats and spotlights.**
- Workflow states draft / scheduled / published / archived (`:3020-3030`). **Code has only draft and published; "archived" is not implemented.**
- Versions (`:3033-3040`): 800 ms autosave, 50 versions, revert, diff, "Compared to live" badge, "Last edited by" column. Code has no autosave and maxPerDoc 25.
- Stale-edit banner with 30 s polling and a recovery draft in localStorage (`:3075-3098`).
- Slug-change cascade (`:3100-3110`): redirect, revalidation, and no `document.published` event.

**#preview-workflow (`:3121-3215`)**
- Two tracks: in-admin live preview (postMessage, breakpoints) and shareable JWT links.
- Shareable links: TTL presets, audit row, revocation, and a planned "Revoke all" (not in code).
- Preview responses are noindex.
- CSP `frame-ancestors` must allow the CMS origin, so **a new Studio origin must be added to the web app's CSP and to `PAYLOAD_CORS_ORIGINS`.**

**#publishing-checklist (`:3217-3330`)**
- Intended model: draft-permissive, publish-strict, with block / warn / auto tiers.
- Intended per-collection rule registry (`lib/publishing/rules/*`) and atomic check-plus-publish transaction. **Neither exists in code.**
- The block-tier list (required fields, alt-text graph, internal links, render simulation, circular redirect, …) is far larger than the implemented gate (§3.3).
- "Ship anyway" with an optional reason.

**#new-fields (`:1043+`)**
- Field-mode legend: Manual / Auto-fill / Auto / Cond.
- `_status` is system-set by actions, "not an editable select".
- `publishedAt` is automatic.
- `scheduledFor` is conditional.
- Authors are said to default to the current user. **Not implemented**: Blogs authors only has `filterOptions` (`Blogs.ts:77`).
- FAQ row UX (`~:2268-2310`): collapsed rows labelled with the question, keyboard reordering, duplicate-question rejection, a restricted answer toolbar.
- Redirects: fields locked when `source=slug-change`; `to` hidden for 410 (`~:1394-1420`).
- JSON-LD Layer 2 structured forms (`~:1902-1930`).

---

Not checked: the full `#new-fields` table for collections after guides; the field lists of the per-domain collections in Integrations/Forms; and the web-side `/api/preview/share` route. Two risks for you: author-role media creation through `/media-ingest-url` bypasses collection access, and `topic-suggestions` and `canonical-check` currently return 403 for everyone.