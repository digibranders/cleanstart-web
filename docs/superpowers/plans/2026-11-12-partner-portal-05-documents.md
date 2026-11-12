# Partner portal documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the mock Documents screen (partner library) and Manage documents screen (staff library, upload, replace, edit, delete, request material) into the real thing, backed by a private R2 bucket: presigned browser uploads, an audience-checked download route that answers 404 (never 403) to a partner who may not open a file, versioned replace with 30 day old-key retention, open counts, a daily purge job, and a read-only list of public datasheets pulled from the CMS.

**Architecture:** One storage interface (`FileStorage`) with a Cloudflare R2 adapter (AWS SDK v3, presigned PUT and GET) and an in-memory fake for tests. Every document read goes through `repo/documents.ts` inside `withViewer`, which filters by audience in SQL and relies on the `documents_select` RLS policy as the backstop. Uploads never pass through the app: a server action validates name, size and type and returns a presigned PUT; the browser PUTs the file to R2; a second action verifies the object (exists, size, content type, magic bytes) before it records the document or the new version. Downloads go through `/api/files/[id]`, which checks the audience, records the open, and answers `302` to a 60 second presigned GET. The action bodies live in a plain module (`document-service.ts`) so tests call them without Next; the `'use server'` file is a thin wrapper over `runViewerAction`. Public datasheets come from the CMS REST API through a server-only fetch with a 10 minute revalidate and are never uploaded to R2.

**Tech Stack:** Next.js 16.2.5 route handlers and server actions, React 19, TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Drizzle ORM on Postgres 16 with RLS, Zod 3, `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (already installed by W0-a), Vitest 2 against the real local Postgres, Biome.

**Track and scope:** Track D (BUILD-HANDOFF). Tasks in order: M3.1, M3.2, M3.3. Starts at the `portal-w0` tag. Branch `feat/portal-d`, worktree `portal-d`, database `cleanstart_portal_d` (test `cleanstart_portal_d_test`), dev port 3234. Owned paths: `Documents`, `AdminDocuments`, `src/components/documents/**`, `src/server/files/**`, `src/server/repo/documents.ts`, `src/app/api/files/**`, `src/server/actions/documents.ts`, `src/server/jobs/document-purge.ts`, plus the small new files listed in "File Structure". Nothing else is edited; shared-file needs are in "Contract change requests".

---

## Reading order and what this plan relies on

Read first: `docs/partner-portal/BUILD-HANDOFF.md`, then `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md` sections C.1 (documents tables), C.3 (documents RLS), D (permissions), E (errors), F (repo and action conventions, F.7 `runViewerAction`), H.0 (`DocumentDto`), H.11 and H.14 (this track's interfaces), H.15 (`buildDocumentMaterialRequest`, `buildNewDocumentNotice`), H.17 (`document-purge` job), J (test helpers), L (routes), M (known unknowns). Then the mock files named in each task.

Modules from Wave 0 that this plan imports and does not define (all exist at `portal-w0`): `@/env`, `@/lib/{clock,dates,domain,dto,routes}`, `@/db/{schema,test-helpers}`, `@/server/{errors,log,rate-limit,notify,urls}`, `@/server/audit/record`, `@/server/auth/{types,policies,viewer}`, `@/server/repo/{context,isolation.registry}`, `@/server/actions/{run,result}`, `@/server/email/{send,fake,transport}`, `@/server/email/templates` (which already contains `buildDocumentMaterialRequest` and `buildNewDocumentNotice` from W0-g; this track writes no email builder, it calls those two and tests the calls), `@/server/jobs/document-purge.ts` (a stub `export const runDocumentPurge = async (): Promise<void> => {}` that M3.2 replaces). If any of these is missing, write a `blocked` line and stop that step.

Test run command used in every step: `pnpm --filter @cleanstart/portal exec vitest run <path>`. Gate A is the handoff block (repeated in full in each task).

## Verified facts (checked 12 November 2026, recorded so nobody re-derives them)

These were checked by running the installed `@aws-sdk/client-s3@3.1042.0` and `@aws-sdk/s3-request-presigner@3.1042.0` offline with fake credentials (contracts unknown 13) and by reading the Next 16.2.5 docs shipped in `node_modules/next/dist/docs`.

1. `getSignedUrl` never signs `content-type` unless it is passed in `signableHeaders` (the presigner adds it to `unsignableHeaders` by default). With `signableHeaders: new Set(['content-type'])` and a `PutObjectCommand` that has `ContentType` and `ContentLength`, the signed headers are `content-length;content-type;host`. A browser sets `Content-Length` itself from the body, so only `Content-Type` is returned in `PresignedPut.headers`.
2. With the SDK default `requestChecksumCalculation` (`WHEN_SUPPORTED`) the presigned PUT carries `x-amz-checksum-crc32=AAAAAA%3D%3D` and `x-amz-sdk-checksum-algorithm=CRC32` in its query string, a checksum of an empty body, which makes a real upload fail. The client must be built with `requestChecksumCalculation: 'WHEN_REQUIRED'` and `responseChecksumValidation: 'WHEN_REQUIRED'`; with them the query string has neither parameter. `r2.test.ts` pins this.
3. R2 needs `region: 'auto'`, the account endpoint and `forcePathStyle: true`; the URL path is `/<bucket>/<key>`.
4. Next 16 route handlers receive `(request: Request, ctx: { params: Promise<{ id: string }> })`; `GET` is dynamic by default; a `Response` with status 302 and a `Location` header is a valid redirect (also to another origin).
5. `exactOptionalPropertyTypes` is on (`packages/config/tsconfig.base.json`): an optional property cannot be assigned `undefined`. Zod `.optional()` output is `T | undefined`, so action code builds repo inputs with conditional spreads, never by passing the parsed object through.

## Decisions made by this plan

Each is the smallest option that satisfies the contracts and the mock. The orchestrator can overturn any of them through a contract change.

1. **The R2 key of a new document embeds the new document's id.** `createUploadTicketAction` (mode `create`) generates `crypto.randomUUID()` server side and `documentKey` puts it in the key; `createDocument` parses the id back out of the verified key and inserts the row with that id (a key whose id already exists is rejected). So the key scheme `documents/<documentId>/v<version>/<uuid>-<name>` is true for every key, and `replaceDocumentFile` can require `key.documentId === id` and `key.version === current.version + 1`, which also rejects a stale ticket after a concurrent replace.
2. **The server derives the content type from the file extension**, never from the browser's `File.type` (Windows reports `application/x-zip-compressed` for zip). The ticket returns the header to send. R2 stores it and `verifyUpload` compares it with `head()`.
3. **Magic bytes are checked after upload**, because the file goes straight to R2. `verifyUpload` asks `presignGet` for a 60 second URL and does a `Range: bytes=0-15` read of it through an injectable `fetch`. PDF starts `%PDF-`; pptx, docx, xlsx and zip start `PK\x03\x04`; mp4 has `ftyp` at byte 4. A mismatch is `ConflictError('file_type_not_allowed')`.
4. **No cleanup delete on a failed confirm.** A bad or reused key could belong to a live document, so `verifyUpload` and the actions never delete the object. An abandoned upload leaves an unreferenced private object (listed in Known unknowns).
5. **A hard-deleted document row is impossible** (`portal_app` has no DELETE on `documents` or `document_opens`, C.3). The purge job therefore tombstones a soft-deleted document older than 30 days: it deletes its versions and audience rows, returns every key for deletion from R2, and sets `file_key = 'purged/<id>'` and `file_size = 0`. The row, its title and its open history stay; the audit log keeps referring to it.
6. **Rate limits** (in process, `rateLimit` from W0-c): upload tickets 30 per hour per user, material requests 5 per hour per user, file opens 60 per minute per user.
7. **The audience picker for named partners stays a comma separated text field** (the mock's markup and copy). The client matches each name, case insensitively, against the partner list the page passes in and sends ids; an unknown name is an inline error. The page gets the list from `listAudiencePartners` (own function in `repo/documents.ts`, staff only) so the marketing role, which cannot call `listPartners`, can use the screen.
8. **`updateDocumentAction` has a UI.** The mock drawer is read only, but the contract lists the action and the audit events `document.edited` and `document.audience_changed`, so the drawer gets a title field and the same audience picker as the upload form (same classes). Type and product stay read only in the drawer; the action still accepts them.
9. **Videos are downloaded, not streamed, in v1.** `FileStorage.presignGet` forces `attachment`. The preview drawer keeps the mock's 16:9 placeholder and shows the Download button for videos too (the mock hid it). Inline playback is a contract change request.
10. **Copy changes forced by real behaviour** (each is also in the task's manual checks): the upload hint reads "PDF, PPTX, DOCX, XLSX, MP4 or ZIP, up to 100 MB" (decision 14 in the contracts); the demo pre-filled values of the upload form are removed (the form starts empty); "Just now" in the admin table becomes "Today" (there is no "uploaded this session" state); new validation messages "Choose a file to upload.", "Pick at least one category.", "No partner named X.".

## File Structure

Paths are relative to `apps/portal`. "Create" files are new; "Modify" files exist in the mock.

| Path | Task | Responsibility |
|---|---|---|
| `src/server/files/storage.ts` | M3.1 | `FileStorage` and `PresignedPut` exactly as contracts H.14 |
| `src/server/files/r2.ts` | M3.1 | `buildR2Client`, `createR2Storage` (testable), `createFileStorage` (reads env), `contentDisposition` |
| `src/server/files/fake.ts` | M3.1 | `FakeFileStorage` and `fakeRangeFetch` |
| `src/server/files/instance.ts` | M3.1 | `getFileStorage()` process wide singleton |
| `src/server/files/open-route.ts` | M3.1 | `handleFileOpen` and `fileErrorResponse`: audience check, open record, 302 to a 60 second GET |
| `src/app/api/files/[id]/route.ts` | M3.1 | Thin `GET`: viewer, rate limit, `handleFileOpen` |
| `src/server/repo/documents.ts` | M3.1 (open functions), M3.2 (the rest) | Every document query; `isolation` export |
| `src/server/files/rules.ts` | M3.2 | Limits, allow list, `canPartnerOpen`, `formatLabel`, `documentKey`, `parseDocumentKey`, `assertUploadAllowed`, `audienceLabel` (pure, client safe) |
| `src/server/files/upload.ts` | M3.2 | `createUploadTicket`, `verifyUpload` (head, magic bytes) |
| `src/lib/document-upload.ts` | M3.2 | Client safe types: `AudienceInput`, `AudiencePartnerDto`, `UploadTicketDto`, `UploadedFileRef` |
| `src/server/files/document-service.ts` | M3.2 | Zod schemas and the six action bodies (`handle*`) |
| `src/server/files/test-ctx.ts` | M3.2 | `makeActionCtx` for handler tests |
| `src/server/actions/documents.ts` | M3.2 | `'use server'` wrappers: `createUploadTicketAction`, `createDocumentAction`, `replaceDocumentFileAction`, `updateDocumentAction`, `deleteDocumentAction`, `requestMaterialAction` |
| `src/server/jobs/document-purge.ts` | M3.2 | `purgeDocumentFiles` and `runDocumentPurge` (replaces the W0-c stub body) |
| `src/components/documents/doc-view.ts` | M3.2 | Pure helpers: labels, freshness, audience draft, partner name matching |
| `src/components/documents/upload-client.ts` | M3.2 | `putFile` (XHR with progress) and `uploadFile` (ticket, PUT) |
| `src/components/documents/AudiencePicker.tsx` | M3.2 | The audience controls extracted from `UploadDocumentForm` |
| `src/components/documents/{doc-style.ts, DocumentPreview.tsx, DocumentEditDrawer.tsx, RequestMaterialDialog.tsx, UploadDocumentForm.tsx}` | M3.2 | Converted mock components |
| `src/components/screens/{Documents.tsx, AdminDocuments.tsx}` | M3.2, M3.3 | Converted screens |
| `src/app/partner/documents/page.tsx`, `src/app/admin/documents/page.tsx` | M3.2, M3.3 | Server Components |
| `src/server/files/public-resources.ts` | M3.3 | `listPublicDatasheets`: CMS REST read, 10 minute revalidate |
| `docs/partner-portal/R2-DOCUMENTS-BUCKET.md` | M3.2 | Bucket name, CORS rules, lifecycle note (operator task) |

Tests sit next to their file (`*.test.ts`). `loading.tsx` for both routes is inherited from `src/app/partner/loading.tsx` and `src/app/admin/loading.tsx` (the existing `LoadingSkeleton`), and the error state is the existing `src/app/error.tsx`; neither is edited.

---

### Task M3.1: Private storage, the file route and the 404 rule

Master plan task 3.1. Covers the `FileStorage` interface, the R2 adapter (presigned PUT and presigned GET with a 60 second expiry), the `/api/files/[id]` route, `FakeFileStorage`, and the rule that a partner outside a document's audience gets 404, never 403.

**Files:**
- Create: `apps/portal/src/server/files/storage.ts`
- Create: `apps/portal/src/server/files/r2.ts`
- Create: `apps/portal/src/server/files/fake.ts`
- Create: `apps/portal/src/server/files/instance.ts`
- Create: `apps/portal/src/server/files/open-route.ts`
- Create: `apps/portal/src/app/api/files/[id]/route.ts`
- Create: `apps/portal/src/server/repo/documents.ts` (the two open functions only; M3.2 completes the file)
- Test: `apps/portal/src/server/files/r2.test.ts`
- Test: `apps/portal/src/server/files/fake.test.ts`
- Test: `apps/portal/src/server/repo/documents.open.test.ts`
- Test: `apps/portal/src/server/files/open-route.test.ts`
- Test: `apps/portal/src/app/api/files/[id]/route.test.ts`

**Gate A (this task):** the standard block in the last step of this task, all green, plus the isolation matrix (`src/server/repo/isolation.test.ts`) picking up `documents.ts` with both functions registered. **Gate B:** an independent reviewer with the handoff checklist, with extra attention to: the route never returns an R2 key, a missing id and a forbidden id are byte-identical 404s, the open is recorded only for partner viewers, no R2 call inside a transaction.

- [ ] **Step 1: Write the failing R2 adapter test**

This test is also the verification of contracts unknown 13: it runs the real SDK presigner offline (no network, fake credentials) and pins the request shape.

Create `apps/portal/src/server/files/r2.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { IntegrationError } from '@/server/errors';

const mockEnv = vi.hoisted(() => ({
  R2_ENDPOINT: undefined as string | undefined,
  R2_BUCKET: undefined as string | undefined,
  R2_ACCESS_KEY_ID: undefined as string | undefined,
  R2_SECRET_ACCESS_KEY: undefined as string | undefined,
}));
vi.mock('@/env', () => ({ env: mockEnv }));

import { buildR2Client, contentDisposition, createFileStorage, createR2Storage } from './r2';

const CLOCK = fixedClock('2026-11-06T14:02:00Z');

const setup = () => {
  const client = buildR2Client({
    endpoint: 'https://acct.r2.cloudflarestorage.com',
    accessKeyId: 'AKIATEST',
    secretAccessKey: 'secret-test',
  });
  return { client, storage: createR2Storage({ client, bucket: 'test-bucket', clock: CLOCK }) };
};

describe('createR2Storage.presignPut', () => {
  it('signs content type and length and adds no checksum parameters', async () => {
    const { storage } = setup();
    const put = await storage.presignPut({
      key: 'documents/d1/v1/u1-a.pdf',
      contentType: 'application/pdf',
      contentLength: 1234,
    });
    const url = new URL(put.url);
    expect(url.host).toBe('acct.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/test-bucket/documents/d1/v1/u1-a.pdf');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(url.searchParams.has('x-amz-checksum-crc32')).toBe(false);
    expect(url.searchParams.has('x-amz-sdk-checksum-algorithm')).toBe(false);
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(put.expiresAt.toISOString()).toBe('2026-11-06T14:12:00.000Z');
  });

  it('caps the expiry at one hour', async () => {
    const { storage } = setup();
    const put = await storage.presignPut({
      key: 'k',
      contentType: 'application/pdf',
      contentLength: 1,
      expiresInSeconds: 99_999,
    });
    expect(new URL(put.url).searchParams.get('X-Amz-Expires')).toBe('3600');
  });
});

describe('createR2Storage.presignGet', () => {
  it('expires in 60 seconds by default and forces a download with the file name', async () => {
    const { storage } = setup();
    const got = await storage.presignGet({ key: 'documents/d1/v1/u1-a.pdf', filename: 'Q3 "plan".pdf' });
    const url = new URL(got.url);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('60');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
    expect(url.searchParams.get('response-content-disposition')).toBe(
      `attachment; filename="Q3 plan.pdf"; filename*=UTF-8''Q3%20plan.pdf`,
    );
    expect(got.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
  });
});

describe('createR2Storage.head and delete', () => {
  it('returns size and content type', async () => {
    const { client, storage } = setup();
    vi.spyOn(client, 'send').mockImplementation(
      async () => ({ ContentLength: 12, ContentType: 'application/pdf' }) as never,
    );
    expect(await storage.head('k')).toEqual({ size: 12, contentType: 'application/pdf' });
  });

  it('returns null when the object does not exist', async () => {
    const { client, storage } = setup();
    vi.spyOn(client, 'send').mockImplementation(async () => {
      throw Object.assign(new Error('NotFound'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
    });
    expect(await storage.head('missing')).toBeNull();
  });

  it('wraps any other failure in IntegrationError', async () => {
    const { client, storage } = setup();
    vi.spyOn(client, 'send').mockImplementation(async () => {
      throw Object.assign(new Error('boom'), { name: 'InternalError', $metadata: { httpStatusCode: 500 } });
    });
    await expect(storage.head('k')).rejects.toBeInstanceOf(IntegrationError);
  });

  it('sends a DeleteObject for the bucket and key', async () => {
    const { client, storage } = setup();
    const send = vi.spyOn(client, 'send').mockImplementation(async () => ({}) as never);
    await storage.delete('documents/d1/v1/u1-a.pdf');
    const command = send.mock.calls[0]?.[0] as unknown as { input: Record<string, unknown> };
    expect(command.input).toEqual({ Bucket: 'test-bucket', Key: 'documents/d1/v1/u1-a.pdf' });
  });
});

describe('contentDisposition', () => {
  it('strips quotes and control characters and keeps an ASCII fallback plus the encoded name', () => {
    expect(contentDisposition('a"b\\c\nd.pdf')).toBe(`attachment; filename="abcd.pdf"; filename*=UTF-8''abcd.pdf`);
    expect(contentDisposition('Résumé (v2).pdf')).toBe(
      `attachment; filename="R_sum_ (v2).pdf"; filename*=UTF-8''R%C3%A9sum%C3%A9%20%28v2%29.pdf`,
    );
    expect(contentDisposition('   ')).toBe(`attachment; filename="download"; filename*=UTF-8''download`);
  });
});

describe('createFileStorage', () => {
  it('throws IntegrationError naming R2 when the variables are unset', () => {
    expect(() => createFileStorage()).toThrowError(IntegrationError);
    expect(() => createFileStorage()).toThrowError(/R2/);
  });

  it('builds a storage when every variable is set', () => {
    Object.assign(mockEnv, {
      R2_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
      R2_BUCKET: 'test-bucket',
      R2_ACCESS_KEY_ID: 'AKIATEST',
      R2_SECRET_ACCESS_KEY: 'secret-test',
    });
    expect(typeof createFileStorage().presignGet).toBe('function');
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/r2.test.ts`
Expected: FAIL with `Failed to resolve import "./r2" from "src/server/files/r2.test.ts". Does the file exist?`

- [ ] **Step 3: Create the storage interface**

Create `apps/portal/src/server/files/storage.ts` (verbatim from contracts H.14):

```ts
export interface PresignedPut {
  url: string;
  /** Headers the browser must send with the PUT, exactly. */
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface FileStorage {
  /** A URL the browser PUTs the file to. Content type and length are signed, so a different file is rejected by R2. */
  presignPut(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<PresignedPut>;
  /** A GET URL that forces download with `filename`. 60 seconds unless told otherwise. */
  presignGet(input: { key: string; filename: string; expiresInSeconds?: number }): Promise<{ url: string; expiresAt: Date }>;
  /** Size and content type of the stored object, or null when it does not exist. */
  head(key: string): Promise<{ size: number; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
```

- [ ] **Step 4: Create the R2 adapter**

Create `apps/portal/src/server/files/r2.ts`:

```ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/env';
import { type Clock, systemClock } from '@/lib/clock';
import { IntegrationError } from '@/server/errors';
import type { FileStorage } from './storage';

export const PUT_EXPIRES_SECONDS = 600;
export const GET_EXPIRES_SECONDS = 60;
const MAX_EXPIRES_SECONDS = 3600;

export interface R2ClientConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface R2StorageDeps {
  client: S3Client;
  bucket: string;
  clock?: Clock;
}

/**
 * R2 needs region 'auto' and path style. WHEN_REQUIRED stops SDK v3 adding a CRC32 checksum (of an empty body) to a
 * presigned PUT, which makes a real upload fail. Verified offline against @aws-sdk/client-s3 3.1042.0.
 */
export function buildR2Client(config: R2ClientConfig): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

const printable = (value: string): string =>
  Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f && char !== '"' && char !== '\\';
    })
    .join('');

const asciiOnly = (value: string): string =>
  Array.from(value)
    .map((char) => ((char.codePointAt(0) ?? 0) > 0x7e ? '_' : char))
    .join('');

/** Content-Disposition that forces a download: an ASCII fallback plus the RFC 5987 encoded name. */
export function contentDisposition(filename: string): string {
  const cleaned = printable(filename).trim() || 'download';
  const encoded = encodeURIComponent(cleaned).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiOnly(cleaned)}"; filename*=UTF-8''${encoded}`;
}

const clampExpiry = (seconds: number): number => Math.min(Math.max(Math.floor(seconds), 1), MAX_EXPIRES_SECONDS);

const isNotFound = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === 'NotFound' || candidate.name === 'NoSuchKey' || candidate.$metadata?.httpStatusCode === 404;
};

export function createR2Storage(deps: R2StorageDeps): FileStorage {
  const clock = deps.clock ?? systemClock;
  const expiresAt = (seconds: number): Date => new Date(clock.now().getTime() + seconds * 1000);

  return {
    async presignPut({ key, contentType, contentLength, expiresInSeconds = PUT_EXPIRES_SECONDS }) {
      const seconds = clampExpiry(expiresInSeconds);
      try {
        const url = await getSignedUrl(
          deps.client,
          new PutObjectCommand({ Bucket: deps.bucket, Key: key, ContentType: contentType, ContentLength: contentLength }),
          { expiresIn: seconds, signableHeaders: new Set(['content-type']) },
        );
        return { url, headers: { 'Content-Type': contentType }, expiresAt: expiresAt(seconds) };
      } catch (cause) {
        throw new IntegrationError('r2', 'could not sign an upload URL', { cause });
      }
    },

    async presignGet({ key, filename, expiresInSeconds = GET_EXPIRES_SECONDS }) {
      const seconds = clampExpiry(expiresInSeconds);
      try {
        const url = await getSignedUrl(
          deps.client,
          new GetObjectCommand({
            Bucket: deps.bucket,
            Key: key,
            ResponseContentDisposition: contentDisposition(filename),
          }),
          { expiresIn: seconds },
        );
        return { url, expiresAt: expiresAt(seconds) };
      } catch (cause) {
        throw new IntegrationError('r2', 'could not sign a download URL', { cause });
      }
    },

    async head(key) {
      try {
        const out = await deps.client.send(new HeadObjectCommand({ Bucket: deps.bucket, Key: key }));
        return { size: out.ContentLength ?? 0, contentType: out.ContentType ?? 'application/octet-stream' };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw new IntegrationError('r2', 'head request failed', { cause: error });
      }
    },

    async delete(key) {
      try {
        await deps.client.send(new DeleteObjectCommand({ Bucket: deps.bucket, Key: key }));
      } catch (error) {
        throw new IntegrationError('r2', 'delete request failed', { cause: error });
      }
    },
  };
}

/** The private documents bucket. Throws IntegrationError('r2') when any R2_* variable is unset (development without R2). */
export function createFileStorage(): FileStorage {
  const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new IntegrationError('r2', 'R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must all be set');
  }
  const client = buildR2Client({ endpoint: R2_ENDPOINT, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY });
  return createR2Storage({ client, bucket: R2_BUCKET });
}
```

- [ ] **Step 5: Run the adapter test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/r2.test.ts`
Expected: PASS. If the `X-Amz-SignedHeaders` or checksum assertions fail on a newer SDK, that is the unknown-13 fallback: sign `PutObjectCommand` without `ContentLength` (drop `content-length` from the expected header list), keep the `head()` size check in `verifyUpload`, and record the change in the progress log. If the `Résumé` case differs only in the underscore count, the test and `asciiOnly` are the source of truth: one underscore per non-ASCII code point.

- [ ] **Step 6: Write the failing fake test**

Create `apps/portal/src/server/files/fake.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage, fakeRangeFetch } from './fake';

describe('FakeFileStorage', () => {
  it('records presigned URLs and expiries', async () => {
    const storage = new FakeFileStorage(fixedClock('2026-11-06T14:02:00Z'));
    const put = await storage.presignPut({ key: 'k1', contentType: 'application/pdf', contentLength: 5 });
    const got = await storage.presignGet({ key: 'k1', filename: 'a.pdf' });
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(put.expiresAt.toISOString()).toBe('2026-11-06T14:12:00.000Z');
    expect(got.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
    expect(got.url).toBe('https://fake-r2.test/get/k1');
    expect(storage.presigned).toEqual([
      { kind: 'put', key: 'k1', expiresAt: put.expiresAt },
      { kind: 'get', key: 'k1', expiresAt: got.expiresAt, filename: 'a.pdf' },
    ]);
  });

  it('head sees only simulated uploads and delete removes them', async () => {
    const storage = new FakeFileStorage();
    expect(await storage.head('k')).toBeNull();
    storage.simulateUpload('k', 10, 'application/pdf', [0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(await storage.head('k')).toEqual({ size: 10, contentType: 'application/pdf' });
    await storage.delete('k');
    expect(await storage.head('k')).toBeNull();
    expect(storage.deleted).toEqual(['k']);
  });

  it('fakeRangeFetch serves the first bytes for a presigned get URL', async () => {
    const storage = new FakeFileStorage();
    storage.simulateUpload('documents/a b/x.pdf', 99, 'application/pdf', [1, 2, 3, 4, 5, 6]);
    const { url } = await storage.presignGet({ key: 'documents/a b/x.pdf', filename: 'x.pdf' });
    const res = await fakeRangeFetch(storage)(url, { headers: { Range: 'bytes=0-3' } });
    expect(res.status).toBe(206);
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual([1, 2, 3, 4]);
    const missing = await fakeRangeFetch(storage)('https://fake-r2.test/get/nope');
    expect(missing.status).toBe(404);
  });
});
```

- [ ] **Step 7: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/fake.test.ts`
Expected: FAIL with `Failed to resolve import "./fake"`.

- [ ] **Step 8: Create FakeFileStorage**

Create `apps/portal/src/server/files/fake.ts`:

```ts
import { type Clock, systemClock } from '@/lib/clock';
import type { FileStorage, PresignedPut } from './storage';

const PUT_SECONDS = 600;
const GET_SECONDS = 60;
const FAKE_HOST = 'fake-r2.test';

/** In memory FileStorage for tests (contracts J.4). No timers, no network. */
export class FakeFileStorage implements FileStorage {
  /** key -> stored object. Tests put objects here to simulate a finished browser upload. */
  objects = new Map<string, { size: number; contentType: string }>();
  /** The first bytes of each simulated object, read back by fakeRangeFetch for the magic byte check. */
  heads = new Map<string, number[]>();
  deleted: string[] = [];
  /** Every presigned URL handed out. `filename` is set for 'get'. */
  presigned: Array<{ kind: 'put' | 'get'; key: string; expiresAt: Date; filename?: string }> = [];
  private readonly clock: Clock;

  constructor(clock: Clock = systemClock) {
    this.clock = clock;
  }

  async presignPut(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<PresignedPut> {
    const expiresAt = new Date(this.clock.now().getTime() + (input.expiresInSeconds ?? PUT_SECONDS) * 1000);
    this.presigned.push({ kind: 'put', key: input.key, expiresAt });
    return {
      url: `https://${FAKE_HOST}/put/${encodeURIComponent(input.key)}`,
      headers: { 'Content-Type': input.contentType },
      expiresAt,
    };
  }

  async presignGet(input: { key: string; filename: string; expiresInSeconds?: number }): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date(this.clock.now().getTime() + (input.expiresInSeconds ?? GET_SECONDS) * 1000);
    this.presigned.push({ kind: 'get', key: input.key, expiresAt, filename: input.filename });
    return { url: `https://${FAKE_HOST}/get/${encodeURIComponent(input.key)}`, expiresAt };
  }

  async head(key: string): Promise<{ size: number; contentType: string } | null> {
    return this.objects.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
    this.heads.delete(key);
    this.deleted.push(key);
  }

  /** Simulates the browser PUT: adds the object so verifyUpload passes. `head` is the file's first bytes. */
  simulateUpload(key: string, size: number, contentType: string, head: ArrayLike<number> = []): void {
    this.objects.set(key, { size, contentType });
    this.heads.set(key, Array.from(head));
  }
}

/** A `fetch` for verifyUpload: answers a Range request on a presigned get URL of the fake from the stored head bytes. */
export const fakeRangeFetch =
  (storage: FakeFileStorage): typeof fetch =>
  async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const prefix = '/get/';
    if (url.hostname !== FAKE_HOST || !url.pathname.startsWith(prefix)) return new Response('bad url', { status: 400 });
    const key = decodeURIComponent(url.pathname.slice(prefix.length));
    const head = storage.heads.get(key);
    if (!storage.objects.has(key) || head === undefined) return new Response('missing', { status: 404 });
    const range = new Headers(init?.headers).get('range') ?? '';
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    const end = match ? Number(match[2]) + 1 : head.length;
    return new Response(new Uint8Array(head.slice(0, end)), { status: match ? 206 : 200 });
  };
```

- [ ] **Step 9: Run the fake test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/fake.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 10: Write the failing repo test for the open functions (the 404 rule at the data layer)**

Create `apps/portal/src/server/repo/documents.open.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import type { PartnerCategory } from '@/lib/domain';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { getDocumentForOpen, recordDocumentOpen } from './documents';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const partnerFixture = async (category: PartnerCategory) => {
  const partner = await makePartner(db, { category });
  const user = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, viewer: await viewerFor(db, user) };
};

describe('getDocumentForOpen', () => {
  it('returns the file key, name and mime for a document open to everyone', async () => {
    const { viewer } = await partnerFixture('channel');
    const doc = await makeDocument(db, { originalName: 'sheet.pdf', mime: 'application/pdf' });
    const target = await withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, doc.id));
    expect(target).toEqual({ fileKey: doc.fileKey, originalName: 'sheet.pdf', mime: 'application/pdf' });
  });

  it('answers NotFoundError (404, never 403) outside the category audience', async () => {
    const channel = await partnerFixture('channel');
    const distributor = await partnerFixture('distributor');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['distributor'] });
    await expect(withViewer(channel.viewer, (tx) => getDocumentForOpen(tx, channel.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(distributor.viewer, (tx) => getDocumentForOpen(tx, distributor.viewer, doc.id))).resolves.toMatchObject({ fileKey: doc.fileKey });
  });

  it('answers NotFoundError for a partner that is not on the named list', async () => {
    const listed = await partnerFixture('channel');
    const other = await partnerFixture('channel');
    const doc = await makeDocument(db, { audienceKind: 'named', partnerIds: [listed.partner.id] });
    await expect(withViewer(other.viewer, (tx) => getDocumentForOpen(tx, other.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(listed.viewer, (tx) => getDocumentForOpen(tx, listed.viewer, doc.id))).resolves.toMatchObject({ fileKey: doc.fileKey });
  });

  it('answers the same NotFoundError for an unknown id and for a malformed id', async () => {
    const { viewer } = await partnerFixture('channel');
    const unknown = await withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, '00000000-0000-4000-8000-000000000000')).catch((e: unknown) => e);
    const malformed = await withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, 'not-a-uuid')).catch((e: unknown) => e);
    expect(unknown).toBeInstanceOf(NotFoundError);
    expect(malformed).toBeInstanceOf(NotFoundError);
    expect((unknown as NotFoundError).safeMessage).toBe((malformed as NotFoundError).safeMessage);
  });

  it('hides a soft deleted document from partners and from staff', async () => {
    const { viewer } = await partnerFixture('channel');
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, {});
    await db.update(documents).set({ deletedAt: new Date('2026-11-01T00:00:00Z') }).where(eq(documents.id, doc.id));
    await expect(withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staff, (tx) => getDocumentForOpen(tx, staff, doc.id))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('recordDocumentOpen', () => {
  it('records one open for a partner user with the user and partner ids', async () => {
    const { partner, viewer } = await partnerFixture('channel');
    const doc = await makeDocument(db, {});
    await withViewer(viewer, (tx) => recordDocumentOpen(tx, viewer, { id: doc.id }, clock));
    const rows = await db.select().from(documentOpens);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ documentId: doc.id, userId: viewer.id, partnerId: partner.id });
    expect(rows[0]?.openedAt.toISOString()).toBe('2026-11-06T14:02:00.000Z');
  });

  it('records nothing for staff', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, {});
    await withViewer(staff, (tx) => recordDocumentOpen(tx, staff, { id: doc.id }, clock));
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('refuses, and records nothing, for a document outside the partner audience', async () => {
    const { viewer } = await partnerFixture('channel');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['integrator'] });
    await expect(withViewer(viewer, (tx) => recordDocumentOpen(tx, viewer, { id: doc.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });
});
```

- [ ] **Step 11: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/documents.open.test.ts`
Expected: FAIL with `Failed to resolve import "./documents"`.

- [ ] **Step 12: Create the repo file with the two open functions**

Create `apps/portal/src/server/repo/documents.ts` (M3.2 replaces this file with the complete version, which contains these two functions unchanged):

```ts
import { and, eq, isNull, type SQL, sql } from 'drizzle-orm';
import { documentOpens, documents } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { DocumentOpenTarget } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The audience rule in SQL for one partner. Keep in step with documents_select in src/db/rls.sql and with
 * canPartnerOpen in src/server/files/rules.ts (a test in M3.2 runs all three on the same cases).
 */
const audienceAllows = (partnerId: string): SQL =>
  sql`(
    ${documents.audienceKind} = 'all'
    or (${documents.audienceKind} = 'categories'
        and (select p.category from partners p where p.id = ${partnerId}::uuid) = any (${documents.audienceCategories}))
    or (${documents.audienceKind} = 'named'
        and exists (select 1 from document_audience a where a.document_id = ${documents.id} and a.partner_id = ${partnerId}::uuid))
  )`;

/** Not deleted, and for a partner inside the audience. RLS enforces the same; this is the repo layer's own filter. */
const visibleTo = (viewer: Viewer): SQL | undefined =>
  viewer.kind === 'staff' ? isNull(documents.deletedAt) : and(isNull(documents.deletedAt), audienceAllows(viewer.partnerId));

async function findVisible(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await tx
    .select({ fileKey: documents.fileKey, originalName: documents.originalName, mime: documents.mime })
    .from(documents)
    .where(and(eq(documents.id, id), visibleTo(viewer)))
    .limit(1);
  return row ?? null;
}

/** The file key for a signed URL. NotFoundError for a non-audience partner, a deleted document and an unknown id alike (404, never 403). */
export async function getDocumentForOpen(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget> {
  const found = await findVisible(tx, viewer, id);
  if (!found) throw new NotFoundError('document');
  return found;
}

/** Partner users only: records document_opens. Staff opens are ignored. The document must be visible to the viewer. */
export async function recordDocumentOpen(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<void> {
  if (viewer.kind !== 'partner') return;
  const found = await findVisible(tx, viewer, input.id);
  if (!found) throw new NotFoundError('document');
  await tx.insert(documentOpens).values({
    documentId: input.id,
    userId: viewer.id,
    partnerId: viewer.partnerId,
    openedAt: clock.now(),
  });
}

export const isolation = defineIsolation<'getDocumentForOpen' | 'recordDocumentOpen'>({
  getDocumentForOpen: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => getDocumentForOpen(tx, viewer, ctx.documentForBOnly),
  },
  recordDocumentOpen: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => recordDocumentOpen(tx, viewer, { id: ctx.documentForBOnly }, systemClock),
  },
});
```

- [ ] **Step 13: Run the repo test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/documents.open.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 14: Run the isolation matrix and see `documents` picked up**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts -t documents`
Expected: PASS, the two `documents` cases (`registers every exported function in isolation`, `leaks nothing across tenants`).

- [ ] **Step 15: Write the failing route handler test**

Create `apps/portal/src/server/files/open-route.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { IntegrationError } from '@/server/errors';
import { FakeFileStorage } from './fake';
import { handleFileOpen } from './open-route';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const channelViewer = async () => {
  const partner = await makePartner(db, { category: 'channel' });
  return viewerFor(db, await makeUser(db, { partnerId: partner.id, role: 'sales' }));
};

describe('handleFileOpen', () => {
  it('redirects a partner in the audience to a 60 second download URL and records the open', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, { originalName: 'Battlecard.pdf' });
    const storage = new FakeFileStorage(clock);
    const res = await handleFileOpen(doc.id, { viewer, storage, clock });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(`https://fake-r2.test/get/${encodeURIComponent(doc.fileKey)}`);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(storage.presigned).toHaveLength(1);
    expect(storage.presigned[0]).toMatchObject({ kind: 'get', key: doc.fileKey, filename: 'Battlecard.pdf' });
    expect(storage.presigned[0]?.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
    expect(await db.select().from(documentOpens)).toHaveLength(1);
  });

  it('answers 404 with the same body for a non-audience partner, an unknown id and a malformed id, and signs nothing', async () => {
    const viewer = await channelViewer();
    const restricted = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['distributor'] });
    const storage = new FakeFileStorage(clock);
    const bodies: string[] = [];
    for (const id of [restricted.id, '00000000-0000-4000-8000-000000000000', 'nope']) {
      const res = await handleFileOpen(id, { viewer, storage, clock });
      expect(res.status).toBe(404);
      bodies.push(await res.text());
    }
    expect(new Set(bodies).size).toBe(1);
    expect(bodies[0]).toBe(JSON.stringify({ error: 'We could not find that.' }));
    expect(storage.presigned).toHaveLength(0);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('lets staff open any live document without recording an open', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['integrator'] });
    const res = await handleFileOpen(doc.id, { viewer: staff, storage: new FakeFileStorage(clock), clock });
    expect(res.status).toBe(302);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('never puts the R2 key in a failure body, and answers 502 when R2 cannot sign', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, {});
    const storage = new FakeFileStorage(clock);
    storage.presignGet = async () => {
      throw new IntegrationError('r2', `sign failed for ${doc.fileKey}`);
    };
    const res = await handleFileOpen(doc.id, { viewer, storage, clock });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(doc.fileKey);
  });
});
```

- [ ] **Step 16: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/open-route.test.ts`
Expected: FAIL with `Failed to resolve import "./open-route"`.

- [ ] **Step 17: Create the handler and the instance getter**

Create `apps/portal/src/server/files/open-route.ts`:

```ts
import { type Clock, systemClock } from '@/lib/clock';
import type { DocumentOpenTarget } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { describeError, isPortalError } from '@/server/errors';
import { log } from '@/server/log';
import { withViewer } from '@/server/repo/context';
import { getDocumentForOpen, recordDocumentOpen } from '@/server/repo/documents';
import type { FileStorage } from './storage';

export interface FileOpenDeps {
  viewer: Viewer;
  storage: FileStorage;
  clock?: Clock;
}

/** A JSON error with a user safe message. Unknown errors become a generic 500; the cause is logged, never returned. */
export function fileErrorResponse(error: unknown): Response {
  if (!isPortalError(error)) log.error({ err: error }, 'file open failed unexpectedly');
  const described = describeError(error);
  const status = isPortalError(error) ? error.httpStatus : 500;
  return Response.json({ error: described.message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Audience check, open record, then a 302 to a 60 second presigned GET. The database work is one transaction; the R2
 * signing happens after it commits. The R2 key is never in the response body or headers except inside the signed URL.
 */
export async function handleFileOpen(id: string, deps: FileOpenDeps): Promise<Response> {
  const clock = deps.clock ?? systemClock;
  let target: DocumentOpenTarget;
  try {
    target = await withViewer(deps.viewer, async (tx) => {
      const found = await getDocumentForOpen(tx, deps.viewer, id);
      await recordDocumentOpen(tx, deps.viewer, { id }, clock);
      return found;
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
  try {
    const { url } = await deps.storage.presignGet({ key: target.fileKey, filename: target.originalName });
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
}
```

Create `apps/portal/src/server/files/instance.ts`:

```ts
import { createFileStorage } from './r2';
import type { FileStorage } from './storage';

let cached: FileStorage | null = null;

/** The process wide R2 storage. Throws IntegrationError('r2') when R2_* is unset, which actions and routes turn into a safe message. */
export function getFileStorage(): FileStorage {
  cached ??= createFileStorage();
  return cached;
}
```

- [ ] **Step 18: Run the handler test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/open-route.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 19: Write the failing route test (signed out and rate limit)**

Create `apps/portal/src/app/api/files/[id]/route.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ viewer: null as unknown, handled: [] as string[] }));
vi.mock('@/server/auth/viewer', () => ({ getViewer: vi.fn(async () => state.viewer) }));
vi.mock('@/server/files/instance', () => ({ getFileStorage: vi.fn(() => ({})) }));
vi.mock('@/server/files/open-route', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/server/files/open-route')>();
  return {
    ...original,
    handleFileOpen: vi.fn(async (id: string) => {
      state.handled.push(id);
      return new Response(null, { status: 302, headers: { Location: 'https://fake-r2.test/get/x' } });
    }),
  };
});

import { GET } from './route';

const call = (id: string) => GET(new Request(`http://localhost:3004/api/files/${id}`), { params: Promise.resolve({ id }) });

describe('GET /api/files/[id]', () => {
  it('sends a signed out visitor to sign in and returns to the file afterwards', async () => {
    state.viewer = null;
    const res = await call('abc');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/sign-in?next=%2Fapi%2Ffiles%2Fabc');
    expect(state.handled).toHaveLength(0);
  });

  it('hands a signed in viewer to the open handler', async () => {
    state.viewer = { id: 'user-1', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'P', email: 'a@b.co', name: 'A' };
    const res = await call('doc-1');
    expect(res.status).toBe(302);
    expect(state.handled).toEqual(['doc-1']);
  });

  it('answers 429 with Retry-After after 60 opens in a minute', async () => {
    state.viewer = { id: 'user-rate', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'P', email: 'a@b.co', name: 'A' };
    for (let n = 0; n < 60; n += 1) expect((await call('doc-1')).status).toBe(302);
    const res = await call('doc-1');
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 20: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run "src/app/api/files/[id]/route.test.ts"`
Expected: FAIL with `Failed to resolve import "./route"`.

- [ ] **Step 21: Create the route**

Create `apps/portal/src/app/api/files/[id]/route.ts`:

```ts
import { ROUTES } from '@/lib/routes';
import { getViewer } from '@/server/auth/viewer';
import { RateLimitError } from '@/server/errors';
import { fileErrorResponse, handleFileOpen } from '@/server/files/open-route';
import { getFileStorage } from '@/server/files/instance';
import { rateLimit } from '@/server/rate-limit';

const OPENS_PER_MINUTE = 60;

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer) {
    const next = encodeURIComponent(new URL(request.url).pathname);
    return new Response(null, {
      status: 302,
      headers: { Location: `${ROUTES.signIn}?next=${next}`, 'Cache-Control': 'no-store' },
    });
  }
  try {
    rateLimit(`files:user:${viewer.id}`, { limit: OPENS_PER_MINUTE, windowSeconds: 60 });
    return await handleFileOpen(id, { viewer, storage: getFileStorage() });
  } catch (error) {
    const response = fileErrorResponse(error);
    if (error instanceof RateLimitError) response.headers.set('Retry-After', String(error.retryAfterSeconds));
    return response;
  }
}
```

- [ ] **Step 22: Run the route test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run "src/app/api/files/[id]/route.test.ts"`
Expected: PASS, 3 tests.

- [ ] **Step 23: Run Gate A**

Run from the track worktree (the byte escapes stand for the em-dash and en-dash characters, so this plan stays free of them):

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
# only one `next build` runs at a time on this machine; take the lock
until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
rmdir /tmp/portal-build.lock
[ "$BUILD_STATUS" -eq 0 ]
# no em-dashes or en-dashes, and nothing outside the allowed paths
git diff feat/portal-build -- . | grep '^+' | grep -nE $'\xe2\x80\x94|\xe2\x80\x93' && exit 1
git diff --name-only feat/portal-build
```

Expected: lint, typecheck, test and build exit 0; the dash grep prints nothing; the name list contains only the paths in this task's Files block and the plan file.

- [ ] **Step 24: Manual check (no screen in this task; the route is checked with seed-dev data)**

1. `lsof -nP -iTCP:3234 -sTCP:LISTEN` shows nothing, then `pnpm --filter @cleanstart/portal exec next dev --port 3234`. With `R2_*` unset (development default) the checks below show the 502 case.
2. Find two ids (read with the system setting, because `portal_app` sees nothing without an identity): `PGOPTIONS='-c app.kind=system' psql "$DATABASE_URL" -c "select id, title from documents where title in ('Competitive battlecard','Gulf region price list')"`.
3. Sign in as the Kestrel admin from seed-dev (Aditi Rao, password `DEV_SEED_PASSWORD` in `src/db/fixtures.ts`), copy the session cookie from DevTools, then: `curl -s -o /dev/null -w '%{http_code}\n' -H 'Cookie: <name>=<value>' http://localhost:3234/api/files/<Gulf price list id>`. Expected: `404` (Kestrel is a channel partner and the Gulf list is named for two other partners).
4. Same call with the Competitive battlecard id (open to Distributors and Channel partners). Expected with `R2_*` unset: `502` and body `{"error":"A connected service is not responding. Try again in a moment."}`; with a dev R2 bucket configured: `302` and a `Location` starting with the bucket host and containing `X-Amz-Expires=60`. A person with dev R2 keys runs the second case (handoff: no real R2 overnight).
5. `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3234/api/files/<any id>` with no cookie. Expected: `302` to `/sign-in?next=%2Fapi%2Ffiles%2F<id>`.
6. `PGOPTIONS='-c app.kind=system' psql "$DATABASE_URL" -c "select count(*) from document_opens"` is unchanged after steps 3 and 5 and grows by one only after a `302` for a partner.

- [ ] **Step 25: Commit**

```bash
git add apps/portal/src/server/files/storage.ts apps/portal/src/server/files/r2.ts apps/portal/src/server/files/r2.test.ts apps/portal/src/server/files/fake.ts apps/portal/src/server/files/fake.test.ts apps/portal/src/server/files/instance.ts apps/portal/src/server/files/open-route.ts apps/portal/src/server/files/open-route.test.ts apps/portal/src/server/repo/documents.ts apps/portal/src/server/repo/documents.open.test.ts "apps/portal/src/app/api/files/[id]/route.ts" "apps/portal/src/app/api/files/[id]/route.test.ts" docs/superpowers/plans/2026-11-12-partner-portal-05-documents.md
git commit -m "feat(portal): M3.1 private file storage and audience-checked download route"
```

Append the `done` line to the progress log with the short sha, `A ok, B <result>`, and the note "R2 adapter verified offline; real upload not tested".

---

### Task M3.2: Audience rules, the document library, upload and replace, and the two screens

Master plan task 3.2. Covers `rules.canPartnerOpen` moved from the mock, `repo/documents.ts` (versions, 30 day old-key retention, open events and "opened by" counts), the upload limits and allow list, the six server actions, the daily purge job body, and the conversion of `Documents`, `AdminDocuments`, `UploadDocumentForm`, `DocumentEditDrawer`, `DocumentPreview` and `RequestMaterialDialog`.

**Files:**
- Create: `apps/portal/src/server/files/rules.ts`, `upload.ts`, `document-service.ts`, `test-ctx.ts`
- Create: `apps/portal/src/lib/document-upload.ts`
- Create: `apps/portal/src/server/actions/documents.ts`
- Modify (body only): `apps/portal/src/server/jobs/document-purge.ts` (the W0-c stub; the file exists and this track owns its body)
- Create: `apps/portal/src/components/documents/doc-view.ts`, `upload-client.ts`, `AudiencePicker.tsx`
- Create: `docs/partner-portal/R2-DOCUMENTS-BUCKET.md`
- Modify: `apps/portal/src/server/repo/documents.ts` (replace with the complete file)
- Modify: `apps/portal/src/components/documents/{doc-style.ts, DocumentPreview.tsx, DocumentEditDrawer.tsx, RequestMaterialDialog.tsx, UploadDocumentForm.tsx}`
- Modify: `apps/portal/src/components/screens/{Documents.tsx, AdminDocuments.tsx}`
- Modify: `apps/portal/src/app/partner/documents/page.tsx`, `apps/portal/src/app/admin/documents/page.tsx`
- Test: `apps/portal/src/server/files/{rules,upload,document-service}.test.ts`, `apps/portal/src/server/repo/documents.test.ts`, `apps/portal/src/server/jobs/document-purge.test.ts`, `apps/portal/src/components/documents/{doc-view,upload-client}.test.ts`

**Gate A (this task):** the standard block in the last step of this task, plus the isolation matrix with all 13 `documents` functions registered, plus the manual list at the end of the task with seed-dev data. **Gate B:** an independent reviewer with the handoff checklist, extra attention to: every action calls `assertCan` first; the upload ticket and the confirm are the only paths that put a key in the database and the key is parsed and verified; no R2 or email call inside a transaction; the repo never returns the file key to a partner (only `getDocumentForOpen` does, and only the route calls it); audit entry for every state change; the three audience implementations agree.

**Before starting:** merge `feat/portal-build` into the track branch (BUILD-HANDOFF, "Merging") and confirm M3.1 is merged.

#### Part A: the pure rules

- [ ] **Step 1: Write the failing rules test**

Create `apps/portal/src/server/files/rules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ConflictError } from '@/server/errors';
import {
  ALLOWED_DOCUMENT_TYPES,
  assertUploadAllowed,
  audienceLabel,
  canPartnerOpen,
  cleanOriginalName,
  DOCUMENT_MAX_BYTES,
  documentKey,
  extensionOf,
  formatLabel,
  mimeForFileName,
  parseDocumentKey,
  sanitiseFileName,
} from './rules';

describe('canPartnerOpen', () => {
  const partner = { id: 'p1', category: 'channel' as const };
  it('lets everyone open an "all" document', () => {
    expect(canPartnerOpen({ kind: 'all', categories: [], partnerIds: [] }, partner)).toBe(true);
  });
  it('matches the partner category for a categories document', () => {
    expect(canPartnerOpen({ kind: 'categories', categories: ['distributor', 'channel'], partnerIds: [] }, partner)).toBe(true);
    expect(canPartnerOpen({ kind: 'categories', categories: ['distributor'], partnerIds: [] }, partner)).toBe(false);
    expect(canPartnerOpen({ kind: 'categories', categories: [], partnerIds: [] }, partner)).toBe(false);
  });
  it('matches the partner id for a named document', () => {
    expect(canPartnerOpen({ kind: 'named', categories: [], partnerIds: ['p1', 'p2'] }, partner)).toBe(true);
    expect(canPartnerOpen({ kind: 'named', categories: [], partnerIds: ['p2'] }, partner)).toBe(false);
    expect(canPartnerOpen({ kind: 'named', categories: ['channel'], partnerIds: [] }, partner)).toBe(false);
  });
});

describe('formatLabel', () => {
  const cases: Array<[Parameters<typeof formatLabel>[0], string]> = [
    [{ mime: 'application/pdf', fileSize: 1_153_434, durationMinutes: null }, 'PDF, 1.1 MB'],
    [{ mime: 'application/pdf', fileSize: 655_360, durationMinutes: null }, 'PDF, 640 KB'],
    [{ mime: 'application/pdf', fileSize: 100, durationMinutes: null }, 'PDF, 1 KB'],
    [{ mime: 'application/zip', fileSize: 18 * 1024 * 1024, durationMinutes: null }, 'ZIP, 18 MB'],
    [{ mime: 'video/mp4', fileSize: 80_000_000, durationMinutes: 14 }, 'MP4, 14 min'],
    [{ mime: 'video/mp4', fileSize: 14 * 1024 * 1024, durationMinutes: null }, 'MP4, 14 MB'],
  ];
  it.each(cases)('%j reads %s', (input, expected) => {
    expect(formatLabel(input)).toBe(expected);
  });
});

describe('file names and keys', () => {
  it.each([
    ['Q3 plan (final).PDF', 'Q3-plan-final.pdf'],
    ['../../etc/passwd.pdf', 'passwd.pdf'],
    ['C:\\fakepath\\x.pdf', 'x.pdf'],
    ['résumé.pdf', 'resume.pdf'],
    ['....pdf', 'file.pdf'],
    ['a.b.c.zip', 'a-b-c.zip'],
    ['noext', 'noext'],
  ])('sanitises %s to %s', (input, expected) => {
    expect(sanitiseFileName(input)).toBe(expected);
  });

  it('cuts a very long stem and keeps the extension', () => {
    const name = sanitiseFileName(`${'a'.repeat(300)}.pdf`);
    expect(name).toBe(`${'a'.repeat(60)}.pdf`);
  });

  it('builds a key from the document id, the version and a random id, never from the raw name', () => {
    const documentId = '11111111-1111-4111-8111-111111111111';
    const key = documentKey({ documentId, version: 3, originalName: '../Secret plan.pdf' });
    expect(key).toMatch(/^documents\/11111111-1111-4111-8111-111111111111\/v3\/[0-9a-f-]{36}-Secret-plan\.pdf$/);
    expect(parseDocumentKey(key)).toEqual({ documentId, version: 3 });
    expect(documentKey({ documentId, version: 3, originalName: 'x.pdf' })).not.toBe(documentKey({ documentId, version: 3, originalName: 'x.pdf' }));
  });

  it.each([
    'documents/x/v1/y',
    'documents/11111111-1111-4111-8111-111111111111/v0/22222222-2222-4222-8222-222222222222-a.pdf',
    'documents/11111111-1111-4111-8111-111111111111/v01/22222222-2222-4222-8222-222222222222-a.pdf',
    'documents/11111111-1111-4111-8111-111111111111/v1/22222222-2222-4222-8222-222222222222-a/b.pdf',
    'seed/slug.pdf',
    'purged/11111111-1111-4111-8111-111111111111',
    '',
  ])('refuses the key %s', (key) => {
    expect(parseDocumentKey(key)).toBeNull();
  });

  it('reads the extension case insensitively and maps it to a content type', () => {
    expect(extensionOf('A.PDF')).toBe('pdf');
    expect(extensionOf('noext')).toBe('');
    expect(mimeForFileName('deck.PPTX')).toBe(ALLOWED_DOCUMENT_TYPES.find((t) => t.ext === 'pptx')?.mime);
    expect(mimeForFileName('virus.exe')).toBeNull();
  });

  it('cleans a display name: no path, no control characters, at most 200 characters, extension kept', () => {
    expect(cleanOriginalName('C:\\x\\Report\u0007 Q3.pdf')).toBe('Report Q3.pdf');
    const long = cleanOriginalName(`${'b'.repeat(400)}.pdf`);
    expect(long).toHaveLength(200);
    expect(long.endsWith('.pdf')).toBe(true);
    expect(cleanOriginalName('   ')).toBe('file');
  });
});

describe('assertUploadAllowed', () => {
  const pdf = { size: 1000, mime: 'application/pdf', originalName: 'a.pdf' };
  const reasonOf = (input: Parameters<typeof assertUploadAllowed>[0]): string | undefined => {
    try {
      assertUploadAllowed(input);
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      return (error as ConflictError).reason;
    }
    return undefined;
  };
  it('accepts every allow listed type with its own content type', () => {
    for (const type of ALLOWED_DOCUMENT_TYPES) {
      expect(reasonOf({ size: 1, mime: type.mime, originalName: `file.${type.ext}` })).toBeUndefined();
    }
  });
  it('accepts exactly 100 MB and refuses one byte more with file_too_large', () => {
    expect(reasonOf({ ...pdf, size: DOCUMENT_MAX_BYTES })).toBeUndefined();
    expect(reasonOf({ ...pdf, size: DOCUMENT_MAX_BYTES + 1 })).toBe('file_too_large');
  });
  it('refuses an empty file, an unknown extension and a content type that does not match the extension', () => {
    expect(reasonOf({ ...pdf, size: 0 })).toBe('file_missing');
    expect(reasonOf({ ...pdf, originalName: 'a.exe', mime: 'application/x-msdownload' })).toBe('file_type_not_allowed');
    expect(reasonOf({ ...pdf, mime: 'video/mp4' })).toBe('file_type_not_allowed');
    expect(reasonOf({ ...pdf, originalName: 'a.pdf.exe' })).toBe('file_type_not_allowed');
  });
});

describe('audienceLabel', () => {
  const cases: Array<[Parameters<typeof audienceLabel>[0], string]> = [
    [{ kind: 'all', categories: [], partners: [] }, 'All partners'],
    [{ kind: 'categories', categories: ['distributor', 'channel'], partners: [] }, 'Distributors, channel'],
    [{ kind: 'categories', categories: ['channel'], partners: [] }, 'Channel'],
    [{ kind: 'categories', categories: [], partners: [] }, 'No one yet'],
    [{ kind: 'named', categories: [], partners: [{}] }, '1 partner'],
    [{ kind: 'named', categories: [], partners: [{}, {}, {}, {}, {}] }, '5 partners'],
  ];
  it.each(cases)('%j reads %s', (audience, expected) => {
    expect(audienceLabel(audience)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/rules.test.ts`
Expected: FAIL with `Failed to resolve import "./rules"`.

- [ ] **Step 3: Create `rules.ts`**

Create `apps/portal/src/server/files/rules.ts`. This module is pure and client safe on purpose (no `node:` imports, no database, no env): client components import `formatLabel`, `audienceLabel` and `UPLOAD_ACCEPT` from it.

```ts
import { type AudienceKind, PARTNER_CATEGORY_PLURAL, type PartnerCategory } from '@/lib/domain';
import { ConflictError } from '@/server/errors';

export const DOCUMENT_MAX_BYTES = 100 * 1024 * 1024;
/** A replaced file stays in R2 and in document_versions this long (master plan 3.2). */
export const OLD_KEY_RETENTION_DAYS = 30;
/** A soft deleted document is purged (tombstoned) after this long. */
export const DELETED_DOCUMENT_RETENTION_DAYS = 30;
/** documents.file_key of a purged document: 'purged/<document id>'. */
export const PURGED_KEY_PREFIX = 'purged/';

/** Allow list. Extension, mime and the label shown in the library ("PDF"). */
export const ALLOWED_DOCUMENT_TYPES: ReadonlyArray<{ ext: string; mime: string; label: string }> = [
  { ext: 'pdf', mime: 'application/pdf', label: 'PDF' },
  { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PPTX' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLSX' },
  { ext: 'mp4', mime: 'video/mp4', label: 'MP4' },
  { ext: 'zip', mime: 'application/zip', label: 'ZIP' },
];

/** Value for the `accept` attribute of the file inputs. */
export const UPLOAD_ACCEPT = ALLOWED_DOCUMENT_TYPES.map((type) => `.${type.ext}`).join(',');

export interface AudienceView {
  kind: AudienceKind;
  categories: readonly PartnerCategory[];
  partnerIds: readonly string[];
}

/** Moved from the mock's canPartnerOpen. Must agree with the documents_select policy in rls.sql; documents.test.ts checks both on the same cases. */
export function canPartnerOpen(audience: AudienceView, partner: { id: string; category: PartnerCategory }): boolean {
  switch (audience.kind) {
    case 'all':
      return true;
    case 'categories':
      return audience.categories.includes(partner.category);
    case 'named':
      return audience.partnerIds.includes(partner.id);
  }
}

/** The Audience column and badge text. Mock wording: "All partners", "Distributors, channel", "2 partners", "No one yet". */
export function audienceLabel(audience: {
  kind: AudienceKind;
  categories: readonly PartnerCategory[];
  partners: readonly unknown[];
}): string {
  switch (audience.kind) {
    case 'all':
      return 'All partners';
    case 'categories':
      if (audience.categories.length === 0) return 'No one yet';
      return audience.categories
        .map((category, index) => {
          const plural = PARTNER_CATEGORY_PLURAL[category];
          const word = plural.split(' ')[0] ?? plural;
          return index === 0 ? word : word.toLowerCase();
        })
        .join(', ');
    case 'named':
      return `${audience.partners.length} ${audience.partners.length === 1 ? 'partner' : 'partners'}`;
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? Math.round(megabytes) : (Math.round(megabytes * 10) / 10).toFixed(1)} MB`;
};

/** "PDF, 1.1 MB" or "MP4, 14 min" for videos with a duration. */
export function formatLabel(input: { mime: string; fileSize: number; durationMinutes: number | null }): string {
  const known = ALLOWED_DOCUMENT_TYPES.find((type) => type.mime === input.mime);
  const label = known?.label ?? (input.mime.split('/')[1] ?? 'file').toUpperCase();
  if (input.mime === 'video/mp4' && input.durationMinutes !== null) return `${label}, ${input.durationMinutes} min`;
  return `${label}, ${formatBytes(input.fileSize)}`;
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const KEY_RE = new RegExp(`^documents/(${UUID})/v([1-9][0-9]{0,3})/${UUID}-[A-Za-z0-9-]{1,60}(?:\\.[a-z0-9]{1,8})?$`);

const baseName = (name: string): string => name.split(/[\\/]/).pop() ?? '';

/** Lower case extension without the dot, or '' when there is none. */
export function extensionOf(name: string): string {
  const base = baseName(name);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

/** The content type for an allow listed extension, or null. The server decides the type; the browser's File.type is never trusted. */
export function mimeForFileName(name: string): string | null {
  const ext = extensionOf(name);
  return ALLOWED_DOCUMENT_TYPES.find((type) => type.ext === ext)?.mime ?? null;
}

/** The name stored in documents.original_name and shown to people: no path, no control characters, at most 200 characters, extension kept. */
export function cleanOriginalName(name: string): string {
  const visible = Array.from(baseName(name).normalize('NFC'))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join('')
    .trim();
  if (visible === '') return 'file';
  if (visible.length <= 200) return visible;
  const ext = extensionOf(visible);
  const suffix = ext === '' ? '' : `.${ext}`;
  return `${visible.slice(0, visible.length - suffix.length).slice(0, 200 - suffix.length)}${suffix}`;
}

/** The only part of a user's file name that reaches an R2 key: letters, digits and hyphens in the stem, a short lower case extension. */
export function sanitiseFileName(name: string): string {
  const base = baseName(name);
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) : '';
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${stem || 'file'}${ext ? `.${ext}` : ''}`;
}

/** Key scheme: documents/<documentId>/v<version>/<uuid>-<sanitised filename>. Never user controlled beyond the sanitised name. */
export function documentKey(input: { documentId: string; version: number; originalName: string }): string {
  return `documents/${input.documentId}/v${input.version}/${crypto.randomUUID()}-${sanitiseFileName(input.originalName)}`;
}

/** The document id and version inside a key made by documentKey, or null for any other string. */
export function parseDocumentKey(key: string): { documentId: string; version: number } | null {
  const match = KEY_RE.exec(key);
  if (!match) return null;
  const [, documentId, version] = match;
  if (documentId === undefined || version === undefined) return null;
  return { documentId, version: Number(version) };
}

/** Throws ConflictError('file_too_large') or ConflictError('file_type_not_allowed'); an empty file is ConflictError('file_missing'). */
export function assertUploadAllowed(input: { size: number; mime: string; originalName: string }): void {
  if (input.size <= 0) throw new ConflictError('file_missing', 'That file is empty.');
  if (input.size > DOCUMENT_MAX_BYTES) throw new ConflictError('file_too_large', 'Files can be up to 100 MB.');
  const ext = extensionOf(input.originalName);
  const allowed = ALLOWED_DOCUMENT_TYPES.find((type) => type.ext === ext);
  if (!allowed || allowed.mime !== input.mime.toLowerCase()) {
    throw new ConflictError('file_type_not_allowed', 'Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file.');
  }
}
```

- [ ] **Step 4: Run the rules test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/rules.test.ts`
Expected: PASS (every `it` and `it.each` row in the file).

#### Part B: the repository

- [ ] **Step 5: Write the failing repository test**

Create `apps/portal/src/server/repo/documents.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, documentVersions, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import type { PartnerCategory } from '@/lib/domain';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { canPartnerOpen, documentKey } from '@/server/files/rules';
import { withSystem, withViewer } from './context';
import {
  createDocument,
  deleteDocument,
  getDocument,
  listAudiencePartners,
  listDocumentRecipients,
  listDocuments,
  listMaterialRequestRecipients,
  listNewDocuments,
  type NewDocumentInput,
  replaceDocumentFile,
  updateDocument,
} from './documents';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const partnerFixture = async (category: PartnerCategory = 'channel') => {
  const partner = await makePartner(db, { category });
  const user = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, user, viewer: await viewerFor(db, user) };
};

const fileFor = (documentId = crypto.randomUUID(), version = 1) => ({
  key: documentKey({ documentId, version, originalName: 'a.pdf' }),
  size: 1000,
  mime: 'application/pdf',
  originalName: 'a.pdf',
});

const newInput = (overrides: Partial<NewDocumentInput> = {}): NewDocumentInput => ({
  title: 'Pricing guide',
  type: 'datasheet',
  product: 'libraries',
  summary: null,
  durationMinutes: null,
  audience: { kind: 'all' },
  file: fileFor(),
  ...overrides,
});

describe('listDocuments', () => {
  it('shows a partner only the live documents its audience allows, newest first', async () => {
    const channel = await partnerFixture('channel');
    await makeDocument(db, { title: 'Open, old', updatedAt: new Date('2026-10-01T00:00:00Z') });
    await makeDocument(db, { title: 'Open, new', updatedAt: new Date('2026-11-01T00:00:00Z') });
    await makeDocument(db, { title: 'Distributors only', audienceKind: 'categories', audienceCategories: ['distributor'] });
    await makeDocument(db, { title: 'Named for me', audienceKind: 'named', partnerIds: [channel.partner.id], updatedAt: new Date('2026-10-15T00:00:00Z') });
    await makeDocument(db, { title: 'Named for someone else', audienceKind: 'named', partnerIds: [(await makePartner(db, {})).id] });
    await makeDocument(db, { title: 'Deleted', deletedAt: new Date('2026-11-01T00:00:00Z') });
    const rows = await withViewer(channel.viewer, (tx) => listDocuments(tx, channel.viewer, {}));
    expect(rows.map((d) => d.title)).toEqual(['Open, new', 'Named for me', 'Open, old']);
  });

  it('shows staff every live document and applies the title, type and product filters', async () => {
    const staff = await asStaff(db, 'marketing');
    await makeDocument(db, { title: 'Alpha sheet', type: 'datasheet', product: 'images' });
    await makeDocument(db, { title: '100% battlecard', type: 'battlecard', product: 'cleansight' });
    await makeDocument(db, { title: 'Gone', deletedAt: new Date('2026-11-01T00:00:00Z') });
    const all = await withViewer(staff, (tx) => listDocuments(tx, staff, {}));
    expect(all).toHaveLength(2);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { q: '100%' }))).map((d) => d.title)).toEqual(['100% battlecard']);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { q: 'alph' }))).map((d) => d.title)).toEqual(['Alpha sheet']);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { type: 'battlecard' }))).map((d) => d.title)).toEqual(['100% battlecard']);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { product: 'images' }))).map((d) => d.title)).toEqual(['Alpha sheet']);
  });

  it('returns file details but never the file key, and hides the audience from partners', async () => {
    const channel = await partnerFixture('channel');
    await makeDocument(db, { originalName: 'x.pdf', mime: 'application/pdf', fileSize: 2048, audienceKind: 'categories', audienceCategories: ['channel'] });
    const [row] = await withViewer(channel.viewer, (tx) => listDocuments(tx, channel.viewer, {}));
    expect(row).toMatchObject({ originalName: 'x.pdf', mime: 'application/pdf', fileSize: 2048, version: 1 });
    expect(JSON.stringify(row)).not.toContain('fileKey');
    expect(row?.audience).toEqual({ kind: 'categories', categories: [], partners: [] });
  });
});

describe('the three audience implementations agree', () => {
  const CASES: Array<{ name: string; kind: 'all' | 'categories' | 'named'; categories: PartnerCategory[]; listed: boolean; category: PartnerCategory }> = [
    { name: 'all, channel', kind: 'all', categories: [], listed: false, category: 'channel' },
    { name: 'categories include me', kind: 'categories', categories: ['distributor', 'channel'], listed: false, category: 'channel' },
    { name: 'categories exclude me', kind: 'categories', categories: ['distributor'], listed: false, category: 'channel' },
    { name: 'categories, integrator', kind: 'categories', categories: ['integrator'], listed: false, category: 'integrator' },
    { name: 'named, listed', kind: 'named', categories: [], listed: true, category: 'channel' },
    { name: 'named, not listed', kind: 'named', categories: [], listed: false, category: 'channel' },
  ];

  it.each(CASES)('$name', async ({ kind, categories, listed, category }) => {
    const me = await partnerFixture(category);
    const other = await makePartner(db, {});
    const doc = await makeDocument(db, {
      audienceKind: kind,
      audienceCategories: categories,
      ...(kind === 'named' ? { partnerIds: [listed ? me.partner.id : other.id] } : {}),
    });
    const expected = canPartnerOpen(
      { kind, categories, partnerIds: kind === 'named' ? [listed ? me.partner.id : other.id] : [] },
      { id: me.partner.id, category },
    );
    const throughRepo = (await withViewer(me.viewer, (tx) => listDocuments(tx, me.viewer, {}))).some((d) => d.id === doc.id);
    const throughRlsOnly = (await withViewer(me.viewer, (tx) => tx.select({ id: documents.id }).from(documents))).some((d) => d.id === doc.id);
    expect(throughRepo).toBe(expected);
    expect(throughRlsOnly).toBe(expected);
  });
});

describe('open counts', () => {
  it('gives staff total opens and distinct partners, and partners only their own company opens', async () => {
    const a = await partnerFixture('channel');
    const b = await partnerFixture('channel');
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, {});
    await db.insert(documentOpens).values([
      { documentId: doc.id, userId: a.user.id, partnerId: a.partner.id },
      { documentId: doc.id, userId: a.user.id, partnerId: a.partner.id },
      { documentId: doc.id, userId: b.user.id, partnerId: b.partner.id },
    ]);
    const asStaffRow = await withViewer(staff, (tx) => getDocument(tx, staff, doc.id));
    expect(asStaffRow).toMatchObject({ opens: 3, partnerCount: 2, ownOpens: null });
    const asPartnerRow = await withViewer(a.viewer, (tx) => getDocument(tx, a.viewer, doc.id));
    expect(asPartnerRow).toMatchObject({ opens: null, partnerCount: null, ownOpens: 2 });
    const untouched = await makeDocument(db, {});
    expect(await withViewer(staff, (tx) => getDocument(tx, staff, untouched.id))).toMatchObject({ opens: 0, partnerCount: 0 });
  });
});

describe('createDocument', () => {
  it('creates a document open to everyone with the id taken from the key', async () => {
    const staff = await asStaff(db, 'marketing');
    const documentId = crypto.randomUUID();
    const created = await withViewer(staff, (tx) => createDocument(tx, staff, newInput({ file: fileFor(documentId) }), clock));
    expect(created).toMatchObject({ id: documentId, title: 'Pricing guide', version: 1, opens: 0, uploadedByName: staff.name });
    expect(created.audience).toEqual({ kind: 'all', categories: [], partners: [] });
    expect(created.updatedAt).toBe('2026-11-06T14:02:00.000Z');
  });

  it('stores categories in a fixed order and named partners as audience rows', async () => {
    const staff = await asStaff(db, 'marketing');
    const p1 = await makePartner(db, { name: 'Zeta Systems' });
    const p2 = await makePartner(db, { name: 'Alpha Networks' });
    const byCategory = await withViewer(staff, (tx) =>
      createDocument(tx, staff, newInput({ audience: { kind: 'categories', categories: ['channel', 'distributor'] } }), clock),
    );
    expect(byCategory.audience.categories).toEqual(['distributor', 'channel']);
    const named = await withViewer(staff, (tx) =>
      createDocument(tx, staff, newInput({ audience: { kind: 'named', partnerIds: [p1.id, p2.id, p1.id] } }), clock),
    );
    expect(named.audience.partners.map((p) => p.name)).toEqual(['Alpha Networks', 'Zeta Systems']);
  });

  it('rejects an empty audience, an unknown partner, a malformed key, a version above 1, and a reused key', async () => {
    const staff = await asStaff(db, 'marketing');
    const run = (input: NewDocumentInput) => withViewer(staff, (tx) => createDocument(tx, staff, input, clock));
    await expect(run(newInput({ audience: { kind: 'categories', categories: [] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ audience: { kind: 'named', partnerIds: [] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ audience: { kind: 'named', partnerIds: ['00000000-0000-4000-8000-000000000000'] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ file: { ...fileFor(), key: 'seed/x.pdf' } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ file: fileFor(crypto.randomUUID(), 2) }))).rejects.toBeInstanceOf(ValidationError);
    const input = newInput();
    await run(input);
    await expect(run(input)).rejects.toBeInstanceOf(ValidationError);
    expect(await db.select().from(documents)).toHaveLength(1);
  });

  it('is staff only', async () => {
    const { viewer } = await partnerFixture();
    await expect(withViewer(viewer, (tx) => createDocument(tx, viewer, newInput(), clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('replaceDocumentFile', () => {
  it('makes version n+1, moves the old file to document_versions for 30 days and keeps the open history', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { originalName: 'old.pdf', mime: 'application/pdf', fileSize: 10 });
    const partner = await partnerFixture();
    await db.insert(documentOpens).values({ documentId: doc.id, userId: partner.user.id, partnerId: partner.partner.id });
    const file = { ...fileFor(doc.id, 2), size: 2000, originalName: 'new.pdf' };
    const result = await withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file }, clock));
    expect(result.previousVersion).toBe(1);
    expect(result.document).toMatchObject({ id: doc.id, version: 2, originalName: 'new.pdf', fileSize: 2000, opens: 1 });
    const [version] = await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id));
    expect(version).toMatchObject({ version: 1, fileKey: doc.fileKey, originalName: 'old.pdf', replacedBy: staff.id });
    expect(version?.purgeAfter.toISOString()).toBe('2026-12-06T14:02:00.000Z');
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.fileKey).toBe(file.key);
  });

  it('rejects a key for the wrong document, the wrong version, or one already used', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, {});
    const run = (file: ReturnType<typeof fileFor>) => withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file }, clock));
    await expect(run(fileFor(crypto.randomUUID(), 2))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(fileFor(doc.id, 1))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(fileFor(doc.id, 3))).rejects.toBeInstanceOf(ValidationError);
    const good = fileFor(doc.id, 2);
    await run(good);
    await expect(run(good)).rejects.toBeInstanceOf(ValidationError);
  });

  it('answers NotFoundError for a deleted or unknown document', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    await expect(withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file: fileFor(doc.id, 2) }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: 'nope', file: fileFor() }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('updateDocument', () => {
  it('reports what changed and writes the new audience', async () => {
    const staff = await asStaff(db, 'marketing');
    const p = await makePartner(db, {});
    const doc = await makeDocument(db, { title: 'Old title' });
    const result = await withViewer(staff, (tx) =>
      updateDocument(tx, staff, { id: doc.id, title: ' New title ', audience: { kind: 'named', partnerIds: [p.id] } }, clock),
    );
    expect(result.changed).toEqual(['details', 'audience']);
    expect(result.audienceBefore).toBe('All partners');
    expect(result.audienceAfter).toBe('1 partner');
    expect(result.document).toMatchObject({ title: 'New title' });
    expect(result.document.audience.partners).toEqual([{ id: p.id, name: p.name }]);
  });

  it('changes nothing and says so when the values are the same', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { title: 'Same' });
    const result = await withViewer(staff, (tx) =>
      updateDocument(tx, staff, { id: doc.id, title: 'Same', audience: { kind: 'all' } }, clock),
    );
    expect(result.changed).toEqual([]);
  });

  it('replaces the named list instead of adding to it, and clears it when the audience becomes categories', async () => {
    const staff = await asStaff(db, 'marketing');
    const p1 = await makePartner(db, {});
    const p2 = await makePartner(db, {});
    const doc = await makeDocument(db, { audienceKind: 'named', partnerIds: [p1.id] });
    const swapped = await withViewer(staff, (tx) => updateDocument(tx, staff, { id: doc.id, audience: { kind: 'named', partnerIds: [p2.id] } }, clock));
    expect(swapped.document.audience.partners.map((p) => p.id)).toEqual([p2.id]);
    const toCategories = await withViewer(staff, (tx) =>
      updateDocument(tx, staff, { id: doc.id, audience: { kind: 'categories', categories: ['integrator'] } }, clock),
    );
    expect(toCategories.document.audience).toEqual({ kind: 'categories', categories: ['integrator'], partners: [] });
  });
});

describe('deleteDocument', () => {
  it('soft deletes: partners lose access at once and staff stop seeing it too', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const channel = await partnerFixture();
    const doc = await makeDocument(db, {});
    expect(await withViewer(staff, (tx) => deleteDocument(tx, staff, { id: doc.id }, clock))).toEqual({ title: doc.title });
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.deletedAt?.toISOString()).toBe('2026-11-06T14:02:00.000Z');
    await expect(withViewer(channel.viewer, (tx) => getDocument(tx, channel.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    expect(await withViewer(staff, (tx) => listDocuments(tx, staff, {}))).toHaveLength(0);
    await expect(withViewer(staff, (tx) => deleteDocument(tx, staff, { id: doc.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('listNewDocuments', () => {
  it('returns visible documents updated in the last 30 days, newest first, up to the limit', async () => {
    const channel = await partnerFixture('channel');
    await makeDocument(db, { title: 'Fresh', updatedAt: new Date('2026-11-05T00:00:00Z') });
    await makeDocument(db, { title: 'Fresher', updatedAt: new Date('2026-11-06T00:00:00Z') });
    await makeDocument(db, { title: 'Old', updatedAt: new Date('2026-09-01T00:00:00Z') });
    await makeDocument(db, { title: 'Hidden', updatedAt: new Date('2026-11-05T00:00:00Z'), audienceKind: 'categories', audienceCategories: ['distributor'] });
    const rows = await withViewer(channel.viewer, (tx) => listNewDocuments(tx, channel.viewer, { limit: 5 }, clock));
    expect(rows.map((d) => d.title)).toEqual(['Fresher', 'Fresh']);
    const one = await withViewer(channel.viewer, (tx) => listNewDocuments(tx, channel.viewer, { limit: 1 }, clock));
    expect(one).toHaveLength(1);
  });
});

describe('listDocumentRecipients', () => {
  it('returns active users of live partners inside the audience, nobody else', async () => {
    const staff = await asStaff(db, 'marketing');
    const channel = await makePartner(db, { category: 'channel' });
    const distributor = await makePartner(db, { category: 'distributor' });
    const suspended = await makePartner(db, { category: 'channel', status: 'suspended' });
    const active = await makeUser(db, { partnerId: channel.id });
    await makeUser(db, { partnerId: channel.id, status: 'disabled' });
    await makeUser(db, { partnerId: channel.id, status: 'invited' });
    await makeUser(db, { partnerId: distributor.id });
    await makeUser(db, { partnerId: suspended.id });
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['channel'] });
    expect(await withViewer(staff, (tx) => listDocumentRecipients(tx, staff, { id: doc.id }))).toEqual([active.id]);
    const everyone = await makeDocument(db, {});
    expect(await withViewer(staff, (tx) => listDocumentRecipients(tx, staff, { id: everyone.id }))).toHaveLength(2);
  });
});

describe('listAudiencePartners and listMaterialRequestRecipients', () => {
  it('lists partners by name for staff only', async () => {
    const staff = await asStaff(db, 'marketing');
    const { viewer } = await partnerFixture();
    await makePartner(db, { name: 'Zeta' });
    await makePartner(db, { name: 'Alpha' });
    const names = (await withViewer(staff, (tx) => listAudiencePartners(tx, staff))).map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Alpha', 'Zeta']));
    expect(names).toEqual([...names].sort());
    await expect(withViewer(viewer, (tx) => listAudiencePartners(tx, viewer))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns the partner's manager and active marketing staff once each", async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'pm@cleanstart.test', name: 'Farhan' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'mk@cleanstart.test', name: 'Ishita' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'old@cleanstart.test', status: 'disabled' });
    await makeUser(db, { kind: 'staff', role: 'sales', email: 'sales@cleanstart.test' });
    const partner = await makePartner(db, { managerId: manager.id });
    const out = await withSystem(SYSTEM_ACTORS.portal, (tx) => listMaterialRequestRecipients(tx, SYSTEM_ACTORS.portal, { partnerId: partner.id }));
    expect(out.recipients.map((r) => r.email).sort()).toEqual(['mk@cleanstart.test', 'pm@cleanstart.test']);
  });
});
```

- [ ] **Step 6: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/documents.test.ts`
Expected: FAIL. `createDocument`, `listDocuments` and the other new exports are not defined by the M3.1 version of `documents.ts`, so the first test reports `TypeError: listDocuments is not a function`.

- [ ] **Step 7: Replace `repo/documents.ts` with the complete file**

Replace the whole of `apps/portal/src/server/repo/documents.ts` with the following. `getDocumentForOpen` and `recordDocumentOpen` are the M3.1 functions unchanged; the isolation export now lists all 13 functions and uses `systemClock`.

```ts
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  notLike,
  type SQL,
  sql,
} from 'drizzle-orm';
import {
  type DocumentRow,
  documentAudience,
  documentOpens,
  documentVersions,
  documents,
  partners,
  users,
} from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import {
  type AudienceKind,
  type DocProduct,
  type DocumentType,
  PARTNER_CATEGORIES,
  type PartnerCategory,
} from '@/lib/domain';
import type { DocumentAudienceDto, DocumentDto, DocumentListItemDto, DocumentOpenTarget } from '@/lib/dto';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { NotFoundError, ValidationError } from '@/server/errors';
import {
  audienceLabel,
  DELETED_DOCUMENT_RETENTION_DAYS,
  OLD_KEY_RETENTION_DAYS,
  parseDocumentKey,
  PURGED_KEY_PREFIX,
} from '@/server/files/rules';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface UploadedFile {
  key: string;
  size: number;
  mime: string;
  originalName: string;
}

export interface NewDocumentInput {
  title: string;
  type: DocumentType;
  product: DocProduct;
  summary: string | null;
  durationMinutes: number | null;
  audience: { kind: 'all' } | { kind: 'categories'; categories: PartnerCategory[] } | { kind: 'named'; partnerIds: string[] };
  /** From verifyUpload (upload.ts): the object is in R2 and its size and type were checked. */
  file: UploadedFile;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 86_400_000;
const BAD_UPLOAD = 'This upload cannot be used. Choose the file again.';
const USED_UPLOAD = 'This upload was already used. Choose the file again.';
const STALE_UPLOAD = 'This document changed while you were uploading. Reload the page and try again.';

const shiftDays = (from: Date, days: number): Date => new Date(from.getTime() + days * DAY_MS);
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const orderedCategories = (values: readonly string[]): PartnerCategory[] => PARTNER_CATEGORIES.filter((c) => values.includes(c));

/**
 * The audience rule in SQL for one partner. Keep in step with documents_select in src/db/rls.sql and with
 * canPartnerOpen in src/server/files/rules.ts (documents.test.ts runs all three on the same cases).
 */
const audienceAllows = (partnerId: string): SQL =>
  sql`(
    ${documents.audienceKind} = 'all'
    or (${documents.audienceKind} = 'categories'
        and (select p.category from partners p where p.id = ${partnerId}::uuid) = any (${documents.audienceCategories}))
    or (${documents.audienceKind} = 'named'
        and exists (select 1 from document_audience a where a.document_id = ${documents.id} and a.partner_id = ${partnerId}::uuid))
  )`;

/** Not deleted, and for a partner inside the audience. RLS enforces the same; this is the repo layer's own filter. */
const visibleTo = (viewer: Viewer): SQL | undefined =>
  viewer.kind === 'staff' ? isNull(documents.deletedAt) : and(isNull(documents.deletedAt), audienceAllows(viewer.partnerId));

const toListItem = (row: DocumentRow): DocumentListItemDto => ({
  id: row.id,
  title: row.title,
  type: row.type,
  product: row.product,
  summary: row.summary,
  durationMinutes: row.durationMinutes,
  fileSize: row.fileSize,
  mime: row.mime,
  originalName: row.originalName,
  version: row.version,
  updatedAt: row.updatedAt.toISOString(),
});

/** Adds audience, open counts and the uploader. Partners get no audience detail and only their own company's opens. */
async function hydrate(tx: Tx, viewer: Viewer, rows: readonly DocumentRow[]): Promise<DocumentDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const staff = viewer.kind === 'staff';
  const own =
    viewer.kind === 'partner'
      ? sql<number>`(count(*) filter (where ${documentOpens.partnerId} = ${viewer.partnerId}::uuid))::int`
      : sql<number>`0`;
  const stats = await tx
    .select({
      documentId: documentOpens.documentId,
      opens: sql<number>`count(*)::int`,
      partnerCount: sql<number>`count(distinct ${documentOpens.partnerId})::int`,
      own,
    })
    .from(documentOpens)
    .where(inArray(documentOpens.documentId, ids))
    .groupBy(documentOpens.documentId);
  const statsById = new Map(stats.map((s) => [s.documentId, s]));

  const named = staff
    ? await tx
        .select({ documentId: documentAudience.documentId, id: partners.id, name: partners.name })
        .from(documentAudience)
        .innerJoin(partners, eq(partners.id, documentAudience.partnerId))
        .where(inArray(documentAudience.documentId, ids))
        .orderBy(partners.name)
    : [];
  const uploaderIds = [...new Set(rows.flatMap((row) => (row.uploadedBy ? [row.uploadedBy] : [])))];
  const uploaders =
    staff && uploaderIds.length > 0
      ? await tx.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, uploaderIds))
      : [];

  return rows.map((row) => {
    const s = statsById.get(row.id);
    const audience: DocumentAudienceDto = staff
      ? {
          kind: row.audienceKind,
          categories: orderedCategories(row.audienceCategories),
          partners: named.filter((n) => n.documentId === row.id).map((n) => ({ id: n.id, name: n.name })),
        }
      : { kind: row.audienceKind, categories: [], partners: [] };
    return {
      ...toListItem(row),
      audience,
      uploadedByName: staff ? (uploaders.find((u) => u.id === row.uploadedBy)?.name ?? null) : null,
      createdAt: row.createdAt.toISOString(),
      opens: staff ? (s?.opens ?? 0) : null,
      partnerCount: staff ? (s?.partnerCount ?? 0) : null,
      ownOpens: staff ? null : (s?.own ?? 0),
    };
  });
}

async function hydrateOne(tx: Tx, viewer: Viewer, row: DocumentRow): Promise<DocumentDto> {
  const [dto] = await hydrate(tx, viewer, [row]);
  if (!dto) throw new Error('hydrate returned no document for an existing row');
  return dto;
}

async function findVisible(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await tx
    .select({ fileKey: documents.fileKey, originalName: documents.originalName, mime: documents.mime })
    .from(documents)
    .where(and(eq(documents.id, id), visibleTo(viewer)))
    .limit(1);
  return row ?? null;
}

/** Locks one live document for a write. NotFoundError for an unknown, malformed or deleted id. */
async function lockLive(tx: Tx, id: string): Promise<DocumentRow> {
  if (!UUID_RE.test(id)) throw new NotFoundError('document');
  const [row] = await tx
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
    .for('update');
  if (!row) throw new NotFoundError('document');
  return row;
}

interface NormalisedAudience {
  kind: AudienceKind;
  categories: PartnerCategory[];
  partnerIds: string[];
}

async function normaliseAudience(tx: Tx, audience: NewDocumentInput['audience']): Promise<NormalisedAudience> {
  if (audience.kind === 'all') return { kind: 'all', categories: [], partnerIds: [] };
  if (audience.kind === 'categories') {
    const categories = orderedCategories(audience.categories);
    if (categories.length === 0) {
      throw new ValidationError([{ path: 'audience.categories', message: 'Pick at least one category.' }]);
    }
    return { kind: 'categories', categories, partnerIds: [] };
  }
  const partnerIds = [...new Set(audience.partnerIds)].sort();
  if (partnerIds.length === 0) {
    throw new ValidationError([{ path: 'audience.partnerIds', message: 'Name at least one partner.' }]);
  }
  const unknown = new ValidationError([{ path: 'audience.partnerIds', message: 'Choose partners from the list.' }]);
  if (!partnerIds.every((partnerId) => UUID_RE.test(partnerId))) throw unknown;
  const found = await tx.select({ id: partners.id }).from(partners).where(inArray(partners.id, partnerIds));
  if (found.length !== partnerIds.length) throw unknown;
  return { kind: 'named', categories: [], partnerIds };
}

const loadNamedPartnerIds = async (tx: Tx, documentId: string): Promise<string[]> =>
  (await tx.select({ id: documentAudience.partnerId }).from(documentAudience).where(eq(documentAudience.documentId, documentId)))
    .map((row) => row.id)
    .sort();

async function assertKeyUnused(tx: Tx, key: string): Promise<void> {
  const inDocuments = await tx.select({ id: documents.id }).from(documents).where(eq(documents.fileKey, key)).limit(1);
  const inVersions = await tx.select({ id: documentVersions.id }).from(documentVersions).where(eq(documentVersions.fileKey, key)).limit(1);
  if (inDocuments.length > 0 || inVersions.length > 0) throw new ValidationError([{ path: 'file', message: USED_UPLOAD }]);
}

/** Partners: only documents their audience allows. Staff: all not deleted. Newest updatedAt first. */
export async function listDocuments(
  tx: Tx,
  viewer: Viewer,
  input: { q?: string; type?: DocumentType; product?: DocProduct },
): Promise<DocumentDto[]> {
  const conditions: Array<SQL | undefined> = [visibleTo(viewer)];
  const needle = input.q?.trim();
  if (needle) conditions.push(ilike(documents.title, `%${escapeLike(needle)}%`));
  if (input.type) conditions.push(eq(documents.type, input.type));
  if (input.product) conditions.push(eq(documents.product, input.product));
  const rows = await tx
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt), desc(documents.createdAt));
  return hydrate(tx, viewer, rows);
}

/** NotFoundError for a document outside the audience and for a deleted one. */
export async function getDocument(tx: Tx, viewer: Viewer, id: string): Promise<DocumentDto> {
  if (!UUID_RE.test(id)) throw new NotFoundError('document');
  const [row] = await tx
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), visibleTo(viewer)))
    .limit(1);
  if (!row) throw new NotFoundError('document');
  return hydrateOne(tx, viewer, row);
}

/** Recently added or replaced documents (last 30 days) for the Overview "new documents" card. */
export async function listNewDocuments(
  tx: Tx,
  viewer: Viewer,
  input: { limit: number },
  clock: Clock,
): Promise<DocumentListItemDto[]> {
  const since = shiftDays(clock.now(), -30);
  const rows = await tx
    .select()
    .from(documents)
    .where(and(visibleTo(viewer), gte(documents.updatedAt, since)))
    .orderBy(desc(documents.updatedAt))
    .limit(Math.max(1, Math.min(input.limit, 50)));
  return rows.map(toListItem);
}

/** Staff (partner manager, marketing). The document id is the one inside the verified file key. */
export async function createDocument(tx: Tx, viewer: Viewer, input: NewDocumentInput, clock: Clock): Promise<DocumentDto> {
  assertStaff(viewer);
  const key = parseDocumentKey(input.file.key);
  if (!key || key.version !== 1) throw new ValidationError([{ path: 'file', message: BAD_UPLOAD }]);
  const taken = await tx.select({ id: documents.id }).from(documents).where(eq(documents.id, key.documentId)).limit(1);
  if (taken.length > 0) throw new ValidationError([{ path: 'file', message: USED_UPLOAD }]);
  await assertKeyUnused(tx, input.file.key);
  const audience = await normaliseAudience(tx, input.audience);
  const now = clock.now();
  const [row] = await tx
    .insert(documents)
    .values({
      id: key.documentId,
      title: input.title.trim(),
      type: input.type,
      product: input.product,
      summary: input.summary?.trim() || null,
      audienceKind: audience.kind,
      audienceCategories: audience.categories,
      fileKey: input.file.key,
      fileSize: input.file.size,
      mime: input.file.mime,
      originalName: input.file.originalName,
      durationMinutes: input.durationMinutes,
      version: 1,
      uploadedBy: viewer.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error('documents insert returned no row');
  if (audience.kind === 'named') {
    await tx.insert(documentAudience).values(audience.partnerIds.map((partnerId) => ({ documentId: row.id, partnerId })));
  }
  return hydrateOne(tx, viewer, row);
}

/** Staff. Version n+1; the old file moves to document_versions with purge_after = now + 30 days. Open counts are kept. */
export async function replaceDocumentFile(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; file: UploadedFile },
  clock: Clock,
): Promise<{ document: DocumentDto; previousVersion: number }> {
  assertStaff(viewer);
  const current = await lockLive(tx, input.id);
  const next = current.version + 1;
  const key = parseDocumentKey(input.file.key);
  if (!key || key.documentId !== current.id || key.version !== next) {
    throw new ValidationError([{ path: 'file', message: STALE_UPLOAD }]);
  }
  await assertKeyUnused(tx, input.file.key);
  const now = clock.now();
  await tx.insert(documentVersions).values({
    documentId: current.id,
    version: current.version,
    fileKey: current.fileKey,
    fileSize: current.fileSize,
    mime: current.mime,
    originalName: current.originalName,
    replacedAt: now,
    purgeAfter: shiftDays(now, OLD_KEY_RETENTION_DAYS),
    replacedBy: viewer.id,
  });
  const [row] = await tx
    .update(documents)
    .set({
      fileKey: input.file.key,
      fileSize: input.file.size,
      mime: input.file.mime,
      originalName: input.file.originalName,
      version: next,
      uploadedBy: viewer.id,
      updatedAt: now,
    })
    .where(eq(documents.id, current.id))
    .returning();
  if (!row) throw new Error('documents update returned no row');
  return { document: await hydrateOne(tx, viewer, row), previousVersion: current.version };
}

/** Staff. Metadata and audience. Returns what changed so the action can write document.edited and document.audience_changed. */
export async function updateDocument(
  tx: Tx,
  viewer: Viewer,
  input: {
    id: string;
    title?: string;
    type?: DocumentType;
    product?: DocProduct;
    summary?: string | null;
    audience?: NewDocumentInput['audience'];
  },
  clock: Clock,
): Promise<{ document: DocumentDto; changed: Array<'details' | 'audience'>; audienceBefore: string; audienceAfter: string }> {
  assertStaff(viewer);
  const current = await lockLive(tx, input.id);
  const currentNamed = await loadNamedPartnerIds(tx, current.id);
  const currentCategories = orderedCategories(current.audienceCategories);
  const audienceBefore = audienceLabel({ kind: current.audienceKind, categories: currentCategories, partners: currentNamed });

  const patch: Partial<typeof documents.$inferInsert> = {};
  if (input.title !== undefined && input.title.trim() !== current.title) patch.title = input.title.trim();
  if (input.type !== undefined && input.type !== current.type) patch.type = input.type;
  if (input.product !== undefined && input.product !== current.product) patch.product = input.product;
  if (input.summary !== undefined) {
    const summary = input.summary?.trim() || null;
    if (summary !== current.summary) patch.summary = summary;
  }
  const changed: Array<'details' | 'audience'> = [];
  if (Object.keys(patch).length > 0) changed.push('details');

  let audienceAfter = audienceBefore;
  let nextNamed = currentNamed;
  if (input.audience !== undefined) {
    const next = await normaliseAudience(tx, input.audience);
    const same =
      next.kind === current.audienceKind &&
      next.categories.join(',') === currentCategories.join(',') &&
      next.partnerIds.join(',') === currentNamed.join(',');
    if (!same) {
      changed.push('audience');
      patch.audienceKind = next.kind;
      patch.audienceCategories = next.categories;
      nextNamed = next.partnerIds;
      audienceAfter = audienceLabel({ kind: next.kind, categories: next.categories, partners: next.partnerIds });
    }
  }
  if (changed.length === 0) {
    return { document: await hydrateOne(tx, viewer, current), changed, audienceBefore, audienceAfter };
  }

  const [row] = await tx
    .update(documents)
    .set({ ...patch, updatedAt: clock.now() })
    .where(eq(documents.id, current.id))
    .returning();
  if (!row) throw new Error('documents update returned no row');
  if (changed.includes('audience')) {
    await tx.delete(documentAudience).where(eq(documentAudience.documentId, current.id));
    if (nextNamed.length > 0) {
      await tx.insert(documentAudience).values(nextNamed.map((partnerId) => ({ documentId: current.id, partnerId })));
    }
  }
  return { document: await hydrateOne(tx, viewer, row), changed, audienceBefore, audienceAfter };
}

/** Staff. Soft delete: sets deleted_at. The file is purged later by the document-purge job. */
export async function deleteDocument(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<{ title: string }> {
  assertStaff(viewer);
  if (!UUID_RE.test(input.id)) throw new NotFoundError('document');
  const [row] = await tx
    .update(documents)
    .set({ deletedAt: clock.now() })
    .where(and(eq(documents.id, input.id), isNull(documents.deletedAt)))
    .returning({ title: documents.title });
  if (!row) throw new NotFoundError('document');
  return { title: row.title };
}

/** The file key for a signed URL. NotFoundError for a non-audience partner, a deleted document and an unknown id alike (404, never 403). */
export async function getDocumentForOpen(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget> {
  const found = await findVisible(tx, viewer, id);
  if (!found) throw new NotFoundError('document');
  return found;
}

/** Partner users only: records document_opens. Staff opens are ignored. The document must be visible to the viewer. */
export async function recordDocumentOpen(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<void> {
  if (viewer.kind !== 'partner') return;
  const found = await findVisible(tx, viewer, input.id);
  if (!found) throw new NotFoundError('document');
  await tx.insert(documentOpens).values({
    documentId: input.id,
    userId: viewer.id,
    partnerId: viewer.partnerId,
    openedAt: clock.now(),
  });
}

/**
 * Public (system actor, jobs/document-purge.ts). Deletes document_versions past purge_after, and tombstones soft deleted
 * documents older than 30 days (portal_app has no DELETE on documents): their versions and audience rows are deleted and
 * file_key becomes 'purged/<id>'. Returns every R2 key to delete afterwards.
 */
export async function purgeExpiredFiles(tx: Tx, _actor: SystemActor, clock: Clock): Promise<{ keys: string[] }> {
  const now = clock.now();
  const keys: string[] = [];
  const expired = await tx
    .delete(documentVersions)
    .where(lte(documentVersions.purgeAfter, now))
    .returning({ fileKey: documentVersions.fileKey });
  keys.push(...expired.map((row) => row.fileKey));

  const stale = await tx
    .select({ id: documents.id, fileKey: documents.fileKey })
    .from(documents)
    .where(
      and(
        isNotNull(documents.deletedAt),
        lte(documents.deletedAt, shiftDays(now, -DELETED_DOCUMENT_RETENTION_DAYS)),
        notLike(documents.fileKey, `${PURGED_KEY_PREFIX}%`),
      ),
    );
  for (const doc of stale) {
    const versions = await tx
      .delete(documentVersions)
      .where(eq(documentVersions.documentId, doc.id))
      .returning({ fileKey: documentVersions.fileKey });
    keys.push(doc.fileKey, ...versions.map((row) => row.fileKey));
    await tx.delete(documentAudience).where(eq(documentAudience.documentId, doc.id));
    await tx
      .update(documents)
      .set({ fileKey: `${PURGED_KEY_PREFIX}${doc.id}`, fileSize: 0 })
      .where(eq(documents.id, doc.id));
  }
  return { keys };
}

/**
 * Staff. The active users who should hear about a new document: active users of onboarding or active partners that the
 * audience reaches. The action writes one in-app notification each.
 */
export async function listDocumentRecipients(tx: Tx, viewer: Viewer, input: { id: string }): Promise<string[]> {
  assertStaff(viewer);
  if (!UUID_RE.test(input.id)) return [];
  const rows = await tx
    .select({ userId: users.id })
    .from(users)
    .innerJoin(partners, eq(partners.id, users.partnerId))
    .innerJoin(documents, eq(documents.id, input.id))
    .where(
      and(
        eq(users.kind, 'partner'),
        eq(users.status, 'active'),
        inArray(partners.status, ['onboarding', 'active']),
        isNull(documents.deletedAt),
        sql`(
          ${documents.audienceKind} = 'all'
          or (${documents.audienceKind} = 'categories' and ${partners.category} = any (${documents.audienceCategories}))
          or (${documents.audienceKind} = 'named'
              and exists (select 1 from document_audience a where a.document_id = ${documents.id} and a.partner_id = ${partners.id}))
        )`,
      ),
    );
  return rows.map((row) => row.userId);
}

/** Staff. Every partner by name, for the audience picker. Own function so the marketing role, which cannot list partners elsewhere, can use the screen. */
export async function listAudiencePartners(tx: Tx, viewer: Viewer): Promise<Array<{ id: string; name: string }>> {
  assertStaff(viewer);
  const rows = await tx.select({ id: partners.id, name: partners.name }).from(partners).orderBy(partners.name);
  return rows;
}

/** Public (system actor). Who receives a "Request material" email: the partner's manager and every active marketing user, once each. */
export async function listMaterialRequestRecipients(
  tx: Tx,
  _actor: SystemActor,
  input: { partnerId: string },
): Promise<{ recipients: Array<{ email: string; name: string }> }> {
  const manager = await tx
    .select({ email: users.email, name: users.name })
    .from(partners)
    .innerJoin(users, eq(users.id, partners.managerId))
    .where(and(eq(partners.id, input.partnerId), eq(users.status, 'active')));
  const marketing = await tx
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'marketing'), eq(users.status, 'active')));
  const seen = new Set<string>();
  const recipients = [...manager, ...marketing].filter((person) => {
    const key = person.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { recipients };
}

const PROBE_FILE: UploadedFile = {
  key: 'documents/00000000-0000-4000-8000-000000000000/v1/00000000-0000-4000-8000-000000000001-a.pdf',
  size: 1,
  mime: 'application/pdf',
  originalName: 'a.pdf',
};

export const isolation = defineIsolation<
  | 'listDocuments'
  | 'getDocument'
  | 'listNewDocuments'
  | 'createDocument'
  | 'replaceDocumentFile'
  | 'updateDocument'
  | 'deleteDocument'
  | 'getDocumentForOpen'
  | 'recordDocumentOpen'
  | 'purgeExpiredFiles'
  | 'listDocumentRecipients'
  | 'listAudiencePartners'
  | 'listMaterialRequestRecipients'
>({
  listDocuments: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => (await listDocuments(tx, viewer, {})).filter((d) => d.id === ctx.documentForBOnly),
  },
  getDocument: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getDocument(tx, viewer, ctx.documentForBOnly) },
  listNewDocuments: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await listNewDocuments(tx, viewer, { limit: 50 }, systemClock)).filter((d) => d.id === ctx.documentForBOnly),
  },
  createDocument: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) =>
      createDocument(
        tx,
        viewer,
        { title: 'x', type: 'datasheet', product: 'all', summary: null, durationMinutes: null, audience: { kind: 'all' }, file: PROBE_FILE },
        systemClock,
      ),
  },
  replaceDocumentFile: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => replaceDocumentFile(tx, viewer, { id: ctx.a.documentId, file: PROBE_FILE }, systemClock),
  },
  updateDocument: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => updateDocument(tx, viewer, { id: ctx.a.documentId, title: 'x' }, systemClock),
  },
  deleteDocument: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => deleteDocument(tx, viewer, { id: ctx.a.documentId }, systemClock),
  },
  getDocumentForOpen: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getDocumentForOpen(tx, viewer, ctx.documentForBOnly) },
  recordDocumentOpen: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => recordDocumentOpen(tx, viewer, { id: ctx.documentForBOnly }, systemClock),
  },
  purgeExpiredFiles: { scope: 'public', reason: 'System job (jobs/document-purge.ts) through withSystem; takes a SystemActor, no viewer.' },
  listDocumentRecipients: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => listDocumentRecipients(tx, viewer, { id: ctx.a.documentId }),
  },
  listAudiencePartners: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listAudiencePartners(tx, viewer) },
  listMaterialRequestRecipients: {
    scope: 'public',
    reason: 'Called through withSystem by the request material action; takes a SystemActor and returns only staff addresses.',
  },
});
```

- [ ] **Step 8: Run the repository test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/documents.test.ts src/server/repo/documents.open.test.ts`
Expected: PASS for both files (the open test has 8 cases). If `for('update')` or the `.innerJoin(documents, eq(documents.id, input.id))` join does not type check against the installed drizzle version, apply the fallback below and record it in the progress log: lock with `await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`)` before a plain select, and replace the constant join by a second query that first loads the document row.

- [ ] **Step 9: Run the isolation matrix and see all 13 functions registered and clean**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts -t documents`
Expected: PASS, both `documents` cases. A failure of `registers every exported function in isolation` means a function was exported without an entry or an entry names a missing function.

#### Part C: the upload helpers

- [ ] **Step 10: Write the failing upload test**

Create `apps/portal/src/server/files/upload.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ConflictError, IntegrationError, ValidationError } from '@/server/errors';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { DOCUMENT_MAX_BYTES, documentKey, parseDocumentKey } from './rules';
import { createUploadTicket, matchesMagic, verifyUpload } from './upload';

const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const ZIP_HEAD = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00];
const MP4_HEAD = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d];
const DOCUMENT_ID = '11111111-1111-4111-8111-111111111111';

const setup = () => {
  const storage = new FakeFileStorage();
  return { storage, options: { fetchImpl: fakeRangeFetch(storage) } };
};
const keyFor = (name = 'a.pdf', version = 1) => documentKey({ documentId: DOCUMENT_ID, version, originalName: name });

describe('createUploadTicket', () => {
  it('signs a PUT for a key made from the document id and version, with the content type and length', async () => {
    const { storage } = setup();
    const { key, put } = await createUploadTicket(storage, {
      documentId: DOCUMENT_ID,
      version: 2,
      originalName: 'Battle card.pdf',
      mime: 'application/pdf',
      size: 5000,
    });
    expect(parseDocumentKey(key)).toEqual({ documentId: DOCUMENT_ID, version: 2 });
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(storage.presigned).toEqual([expect.objectContaining({ kind: 'put', key })]);
  });

  it('refuses a disallowed type or size before signing anything', async () => {
    const { storage } = setup();
    await expect(
      createUploadTicket(storage, { documentId: DOCUMENT_ID, version: 1, originalName: 'a.exe', mime: 'application/x-msdownload', size: 10 }),
    ).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    await expect(
      createUploadTicket(storage, { documentId: DOCUMENT_ID, version: 1, originalName: 'a.pdf', mime: 'application/pdf', size: DOCUMENT_MAX_BYTES + 1 }),
    ).rejects.toMatchObject({ reason: 'file_too_large' });
    expect(storage.presigned).toHaveLength(0);
  });
});

describe('verifyUpload', () => {
  it('accepts a finished PDF upload and returns the stored size with a cleaned name', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    const file = await verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'C:\\x\\Plan.pdf' }, options);
    expect(file).toEqual({ key, size: 1000, mime: 'application/pdf', originalName: 'Plan.pdf' });
    expect(storage.presigned.filter((p) => p.kind === 'get')).toHaveLength(1);
  });

  it.each([
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ZIP_HEAD],
    ['zip', 'application/zip', ZIP_HEAD],
    ['mp4', 'video/mp4', MP4_HEAD],
  ])('accepts a %s whose first bytes match', async (ext, mime, head) => {
    const { storage, options } = setup();
    const key = keyFor(`file.${ext}`);
    storage.simulateUpload(key, 500, mime, head);
    await expect(verifyUpload(storage, { key, size: 500, mime, originalName: `file.${ext}` }, options)).resolves.toMatchObject({ key });
  });

  it('refuses a key that was not made by documentKey', async () => {
    const { storage, options } = setup();
    storage.simulateUpload('seed/a.pdf', 10, 'application/pdf', PDF_HEAD);
    await expect(verifyUpload(storage, { key: 'seed/a.pdf', size: 10, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toBeInstanceOf(ValidationError);
  });

  it('says file_missing when nothing was uploaded or the size differs', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toMatchObject({ reason: 'file_missing' });
    storage.simulateUpload(key, 999, 'application/pdf', PDF_HEAD);
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toMatchObject({ reason: 'file_missing' });
  });

  it('refuses a stored content type that differs from the declared one', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/octet-stream', PDF_HEAD);
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
  });

  it('refuses a file whose first bytes do not match its extension, and never deletes the object', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', [0x4d, 0x5a, 0x90, 0x00]);
    const error = await verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).reason).toBe('file_type_not_allowed');
    expect(storage.deleted).toEqual([]);
  });

  it('reports an R2 problem as IntegrationError when the range read fails', async () => {
    const { storage } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    const failing: typeof fetch = async () => new Response('nope', { status: 403 });
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, { fetchImpl: failing })).rejects.toBeInstanceOf(IntegrationError);
  });

  it('reads only the first bytes even when the server ignores the Range header', async () => {
    const { storage } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(PDF_HEAD));
      },
      cancel() {
        cancelled = true;
      },
    });
    const wholeFile: typeof fetch = async () => new Response(stream, { status: 200 });
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, { fetchImpl: wholeFile })).resolves.toMatchObject({ key });
    expect(cancelled).toBe(true);
  });
});

describe('matchesMagic', () => {
  it('knows the signatures of the six allowed types and nothing else', () => {
    expect(matchesMagic('pdf', PDF_HEAD)).toBe(true);
    expect(matchesMagic('pdf', ZIP_HEAD)).toBe(false);
    for (const ext of ['pptx', 'docx', 'xlsx', 'zip']) expect(matchesMagic(ext, ZIP_HEAD)).toBe(true);
    expect(matchesMagic('mp4', MP4_HEAD)).toBe(true);
    expect(matchesMagic('mp4', PDF_HEAD)).toBe(false);
    expect(matchesMagic('exe', [0x4d, 0x5a])).toBe(false);
    expect(matchesMagic('pdf', [])).toBe(false);
  });
});
```

- [ ] **Step 11: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/upload.test.ts`
Expected: FAIL with `Failed to resolve import "./upload"`.

- [ ] **Step 12: Create `upload.ts`**

Create `apps/portal/src/server/files/upload.ts`:

```ts
import { ConflictError, IntegrationError, ValidationError } from '@/server/errors';
import type { UploadedFile } from '@/server/repo/documents';
import { assertUploadAllowed, cleanOriginalName, documentKey, extensionOf, parseDocumentKey } from './rules';
import type { FileStorage, PresignedPut } from './storage';

const PEEK_BYTES = 16;
const TYPE_MESSAGE = 'Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file.';

/** Step 1 of an upload: the action validates size and type, then returns a presigned PUT. The browser uploads directly to R2. */
export async function createUploadTicket(
  storage: FileStorage,
  input: { documentId: string; version: number; originalName: string; mime: string; size: number },
): Promise<{ key: string; put: PresignedPut }> {
  assertUploadAllowed({ size: input.size, mime: input.mime, originalName: input.originalName });
  const key = documentKey({ documentId: input.documentId, version: input.version, originalName: input.originalName });
  const put = await storage.presignPut({ key, contentType: input.mime, contentLength: input.size });
  return { key, put };
}

const startsWith = (bytes: readonly number[], signature: readonly number[], offset = 0): boolean =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/** First bytes against the signature of the extension: PDF `%PDF-`, Office and ZIP `PK\x03\x04`, MP4 `ftyp` at byte 4. */
export function matchesMagic(ext: string, bytes: readonly number[]): boolean {
  switch (ext) {
    case 'pdf':
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case 'pptx':
    case 'docx':
    case 'xlsx':
    case 'zip':
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case 'mp4':
      return startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4);
    default:
      return false;
  }
}

/** Reads at most `length` bytes of a response body and cancels the rest, so a server that ignores Range cannot make us download 100 MB. */
async function readPrefix(response: Response, length: number): Promise<number[]> {
  const reader = response.body?.getReader();
  if (!reader) return [];
  const bytes: number[] = [];
  while (bytes.length < length) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const byte of value) bytes.push(byte);
  }
  await reader.cancel().catch(() => undefined);
  return bytes.slice(0, length);
}

export interface VerifyUploadOptions {
  /** Defaults to the global fetch. Tests pass fakeRangeFetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Step 2: the action calls this before createDocument or replaceDocumentFile. Throws ConflictError('file_missing') when
 * head() finds nothing or the size differs, ConflictError('file_type_not_allowed') when the stored content type or the
 * first bytes do not match, ValidationError when the key was not made by documentKey. Never deletes the object (the key
 * could belong to a live document). The returned originalName is the cleaned display name.
 */
export async function verifyUpload(
  storage: FileStorage,
  input: { key: string; size: number; mime: string; originalName: string },
  options: VerifyUploadOptions = {},
): Promise<UploadedFile> {
  if (parseDocumentKey(input.key) === null) {
    throw new ValidationError([{ path: 'file', message: 'This upload cannot be used. Choose the file again.' }]);
  }
  assertUploadAllowed({ size: input.size, mime: input.mime, originalName: input.originalName });

  const stored = await storage.head(input.key);
  if (!stored || stored.size !== input.size) {
    throw new ConflictError('file_missing', 'The file did not finish uploading. Try again.');
  }
  if (stored.contentType.split(';')[0]?.trim().toLowerCase() !== input.mime.toLowerCase()) {
    throw new ConflictError('file_type_not_allowed', TYPE_MESSAGE);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const { url } = await storage.presignGet({ key: input.key, filename: input.originalName });
  let response: Response;
  try {
    response = await fetchImpl(url, { headers: { Range: `bytes=0-${PEEK_BYTES - 1}` } });
  } catch (cause) {
    throw new IntegrationError('r2', 'could not read the start of the upload', { cause });
  }
  if (!response.ok) {
    throw new IntegrationError('r2', `range read answered ${response.status}`, { status: response.status });
  }
  const ext = extensionOf(input.originalName);
  if (!matchesMagic(ext, await readPrefix(response, PEEK_BYTES))) {
    throw new ConflictError('file_type_not_allowed', `That file is not a valid ${ext.toUpperCase()}.`);
  }
  return { key: input.key, size: stored.size, mime: input.mime, originalName: cleanOriginalName(input.originalName) };
}
```

- [ ] **Step 13: Run the upload test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/upload.test.ts`
Expected: PASS (every case in the file).

#### Part D: the action bodies, the action file and the purge job

- [ ] **Step 14: Create the client safe types**

Create `apps/portal/src/lib/document-upload.ts`:

```ts
import type { PartnerCategory } from '@/lib/domain';

/** The audience a person chose, in the shape the actions and the repo take it. */
export type AudienceInput =
  | { kind: 'all' }
  | { kind: 'categories'; categories: PartnerCategory[] }
  | { kind: 'named'; partnerIds: string[] };

/** One option in the named partner picker. */
export interface AudiencePartnerDto {
  id: string;
  name: string;
}

/** What createUploadTicketAction returns: where and how the browser uploads. `headers` must be sent exactly. */
export interface UploadTicketDto {
  key: string;
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
  originalName: string;
  size: number;
}

/** What the confirm actions take: the key from the ticket and the file facts. */
export interface UploadedFileRef {
  key: string;
  size: number;
  originalName: string;
}
```

- [ ] **Step 15: Create the handler test helper**

Create `apps/portal/src/server/files/test-ctx.ts` (used only by tests; it builds the `ActionContext` that `runViewerAction` would give a handler):

```ts
import { type Clock, fixedClock } from '@/lib/clock';
import type { ActionContext } from '@/server/actions/run';
import type { Viewer } from '@/server/auth/types';

export interface TestActionContext {
  ctx: ActionContext;
  /** Paths passed to ctx.revalidate, in order. */
  revalidated: string[];
  /** Runs and clears the effects registered with ctx.afterCommit, as runViewerAction does after the handler returns. */
  flush: () => Promise<void>;
}

export function makeActionCtx(viewer: Viewer, clock: Clock = fixedClock('2026-11-06T14:02:00Z')): TestActionContext {
  const effects: Array<() => Promise<void>> = [];
  const revalidated: string[] = [];
  return {
    ctx: {
      viewer,
      clock,
      afterCommit: (effect) => void effects.push(effect),
      revalidate: (path) => void revalidated.push(path),
    },
    revalidated,
    flush: async () => {
      for (const effect of effects.splice(0)) await effect();
    },
  };
}
```

- [ ] **Step 16: Write the failing service test**

Create `apps/portal/src/server/files/document-service.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog, documentVersions, documents, notificationPrefs, notifications } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ROUTES } from '@/lib/routes';
import { FakeEmailTransport } from '@/server/email/fake';
import { ForbiddenError, IntegrationError, ValidationError } from '@/server/errors';
import {
  createDocumentSchema,
  handleCreateDocument,
  handleCreateUploadTicket,
  handleDeleteDocument,
  handleReplaceDocumentFile,
  handleRequestMaterial,
  handleUpdateDocument,
  requestMaterialSchema,
  uploadTicketSchema,
} from './document-service';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { documentKey, parseDocumentKey } from './rules';
import { makeActionCtx } from './test-ctx';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];

beforeEach(async () => {
  await resetDb(db);
});

const setup = () => {
  const storage = new FakeFileStorage(clock);
  const transport = new FakeEmailTransport();
  return { storage, transport, deps: { storage, transport, fetchImpl: fakeRangeFetch(storage) } };
};

const newDocumentInput = (key: string, overrides: Record<string, unknown> = {}) =>
  createDocumentSchema.parse({
    title: 'Pricing guide',
    type: 'datasheet',
    product: 'libraries',
    audience: { kind: 'categories', categories: ['channel'] },
    file: { key, size: 1000, originalName: 'Pricing Guide.pdf' },
    ...overrides,
  });

describe('handleCreateUploadTicket', () => {
  it('issues a ticket for a new document and for a replacement, using the server side content type', async () => {
    const staff = await asStaff(db, 'marketing');
    const { storage, deps } = setup();
    const { ctx } = makeActionCtx(staff, clock);
    const created = await handleCreateUploadTicket(ctx, uploadTicketSchema.parse({ mode: 'create', originalName: 'Pricing Guide.PDF', size: 1000 }), deps);
    expect(parseDocumentKey(created.key)?.version).toBe(1);
    expect(created.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(created).toMatchObject({ originalName: 'Pricing Guide.PDF', size: 1000, expiresAt: '2026-11-06T14:12:00.000Z' });
    const doc = await makeDocument(db, {});
    const replaced = await handleCreateUploadTicket(ctx, uploadTicketSchema.parse({ mode: 'replace', documentId: doc.id, originalName: 'v2.pdf', size: 10 }), deps);
    expect(parseDocumentKey(replaced.key)).toEqual({ documentId: doc.id, version: 2 });
    expect(storage.presigned.filter((p) => p.kind === 'put')).toHaveLength(2);
  });

  it('refuses a disallowed type and an oversize file before signing, and anyone who may not upload', async () => {
    const marketing = await asStaff(db, 'marketing');
    const sales = await asStaff(db, 'sales');
    const technical = await viewerFor(db, await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'technical' }));
    const { storage, deps } = setup();
    const ticket = (viewer: typeof marketing, raw: unknown) => handleCreateUploadTicket(makeActionCtx(viewer, clock).ctx, uploadTicketSchema.parse(raw), deps);
    await expect(ticket(marketing, { mode: 'create', originalName: 'run.exe', size: 10 })).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    await expect(ticket(marketing, { mode: 'create', originalName: 'big.pdf', size: 100 * 1024 * 1024 + 1 })).rejects.toMatchObject({ reason: 'file_too_large' });
    await expect(ticket(sales, { mode: 'create', originalName: 'a.pdf', size: 10 })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(handleCreateUploadTicket(makeActionCtx(technical, clock).ctx, uploadTicketSchema.parse({ mode: 'create', originalName: 'a.pdf', size: 10 }), deps)).rejects.toBeInstanceOf(ForbiddenError);
    expect(storage.presigned).toHaveLength(0);
  });
});

describe('handleCreateDocument', () => {
  it('records the document, audits it, notifies the audience, and emails only people who opted in', async () => {
    const staff = await asStaff(db, 'marketing');
    const channel = await makePartner(db, { category: 'channel' });
    const distributor = await makePartner(db, { category: 'distributor' });
    const optedIn = await makeUser(db, { partnerId: channel.id, email: 'in@kestrel.test', name: 'Opt In' });
    const optedOut = await makeUser(db, { partnerId: channel.id, email: 'out@kestrel.test' });
    await makeUser(db, { partnerId: distributor.id });
    await db.insert(notificationPrefs).values({ userId: optedIn.id, category: 'docs', email: true });

    const { storage, transport, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const ticket = await handleCreateUploadTicket(t.ctx, uploadTicketSchema.parse({ mode: 'create', originalName: 'Pricing Guide.pdf', size: 1000 }), deps);
    storage.simulateUpload(ticket.key, 1000, 'application/pdf', PDF_HEAD);
    const doc = await handleCreateDocument(t.ctx, newDocumentInput(ticket.key), deps);
    await t.flush();

    expect(doc).toMatchObject({ title: 'Pricing guide', version: 1, originalName: 'Pricing Guide.pdf' });
    expect(parseDocumentKey(ticket.key)?.documentId).toBe(doc.id);
    expect(t.revalidated).toEqual([ROUTES.admin.documents, ROUTES.partner.documents]);
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.uploaded'));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: 'documents', actorId: staff.id, subjectType: 'document', subjectId: doc.id, target: 'Pricing guide' });
    expect(audit[0]?.note).toBe('Datasheet, Clean Libraries, open to Channel');
    const sent = await db.select().from(notifications);
    expect(sent.map((n) => n.userId).sort()).toEqual([optedIn.id, optedOut.id].sort());
    expect(sent[0]).toMatchObject({ kind: 'document_new', link: ROUTES.partner.documents });
    expect(transport.to('in@kestrel.test')).toHaveLength(1);
    expect(transport.to('out@kestrel.test')).toHaveLength(0);
  });

  it('writes nothing when the object is missing or its first bytes are wrong, and never deletes the object', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const { storage, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const missingKey = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Pricing Guide.pdf' });
    await expect(handleCreateDocument(t.ctx, newDocumentInput(missingKey), deps)).rejects.toMatchObject({ reason: 'file_missing' });
    const wrongKey = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Pricing Guide.pdf' });
    storage.simulateUpload(wrongKey, 1000, 'application/pdf', [0x4d, 0x5a, 0x90, 0x00]);
    await expect(handleCreateDocument(t.ctx, newDocumentInput(wrongKey), deps)).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    expect(await db.select().from(documents)).toHaveLength(0);
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect(storage.deleted).toEqual([]);
  });

  it('refuses a named audience with an unknown partner and an upload used twice, without a second audit entry', async () => {
    const staff = await asStaff(db, 'marketing');
    const { storage, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const key = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Pricing Guide.pdf' });
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    await expect(
      handleCreateDocument(t.ctx, newDocumentInput(key, { audience: { kind: 'named', partnerIds: ['00000000-0000-4000-8000-000000000000'] } }), deps),
    ).rejects.toBeInstanceOf(ValidationError);
    await handleCreateDocument(t.ctx, newDocumentInput(key), deps);
    await expect(handleCreateDocument(t.ctx, newDocumentInput(key), deps)).rejects.toBeInstanceOf(ValidationError);
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'document.uploaded'))).toHaveLength(1);
    expect(storage.deleted).toEqual([]);
  });

  it('is refused for a partner viewer and for staff sales', async () => {
    const sales = await asStaff(db, 'sales');
    const { deps } = setup();
    await expect(handleCreateDocument(makeActionCtx(sales, clock).ctx, newDocumentInput(documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'a.pdf' })), deps)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('handleReplaceDocumentFile', () => {
  it('makes version 2, keeps the old file for 30 days, audits it and refuses a stale ticket', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, { originalName: 'old.pdf' });
    const { storage, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const ticket = await handleCreateUploadTicket(t.ctx, uploadTicketSchema.parse({ mode: 'replace', documentId: doc.id, originalName: 'new.pdf', size: 500 }), deps);
    storage.simulateUpload(ticket.key, 500, 'application/pdf', PDF_HEAD);
    const file = { key: ticket.key, size: 500, originalName: 'new.pdf' };
    const replaced = await handleReplaceDocumentFile(t.ctx, { id: doc.id, file }, deps);
    expect(replaced).toMatchObject({ id: doc.id, version: 2, originalName: 'new.pdf' });
    const [version] = await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id));
    expect(version).toMatchObject({ version: 1, fileKey: doc.fileKey });
    expect(version?.purgeAfter.toISOString()).toBe('2026-12-06T14:02:00.000Z');
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.replaced'));
    expect(audit).toHaveLength(1);
    expect(audit[0]?.note).toBe('Version 2 uploaded, link and open count kept');
    await expect(handleReplaceDocumentFile(t.ctx, { id: doc.id, file }, deps)).rejects.toBeInstanceOf(ValidationError);
    expect(storage.deleted).toEqual([]);
  });
});

describe('handleUpdateDocument and handleDeleteDocument', () => {
  it('audits a detail edit and an audience change separately, and nothing for a no-op', async () => {
    const staff = await asStaff(db, 'marketing');
    const partner = await makePartner(db, {});
    const doc = await makeDocument(db, { title: 'Before' });
    const t = makeActionCtx(staff, clock);
    await handleUpdateDocument(t.ctx, { id: doc.id, title: 'After', audience: { kind: 'named', partnerIds: [partner.id] } });
    const events = (await db.select().from(auditLog)).map((a) => a.event).sort();
    expect(events).toEqual(['document.audience_changed', 'document.edited']);
    const changed = (await db.select().from(auditLog).where(eq(auditLog.event, 'document.audience_changed')))[0];
    expect(changed).toMatchObject({ before: 'All partners', after: '1 partner', target: 'After' });
    await handleUpdateDocument(t.ctx, { id: doc.id, title: 'After', audience: { kind: 'named', partnerIds: [partner.id] } });
    expect(await db.select().from(auditLog)).toHaveLength(2);
    expect(t.revalidated).toContain(ROUTES.partner.documents);
  });

  it('soft deletes, audits it, and is refused for a partner', async () => {
    const staff = await asStaff(db, 'marketing');
    const partnerViewer = await viewerFor(db, await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'partner_admin' }));
    const doc = await makeDocument(db, { title: 'Doomed' });
    await expect(handleDeleteDocument(makeActionCtx(partnerViewer, clock).ctx, { id: doc.id })).rejects.toBeInstanceOf(ForbiddenError);
    expect(await handleDeleteDocument(makeActionCtx(staff, clock).ctx, { id: doc.id })).toEqual({ title: 'Doomed' });
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.deleted'));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ target: 'Doomed', note: 'Partners lost access' });
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.deletedAt).not.toBeNull();
  });
});

describe('handleRequestMaterial', () => {
  const world = async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'pm@cleanstart.test', name: 'Farhan' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'mk@cleanstart.test', name: 'Ishita' });
    const partner = await makePartner(db, { name: 'Kestrel Systems', managerId: manager.id });
    const requester = await makeUser(db, { partnerId: partner.id, role: 'technical', name: 'Aditi Rao', email: 'aditi@kestrel.test' });
    return viewerFor(db, requester);
  };

  it('emails the manager and marketing with the requester as reply-to and the text escaped', async () => {
    const viewer = await world();
    const { transport } = setup();
    const out = await handleRequestMaterial(
      makeActionCtx(viewer, clock).ctx,
      requestMaterialSchema.parse({ request: 'A <b>Rust</b> one pager', product: 'images' }),
      { transport },
    );
    expect(out).toEqual({ sent: true });
    expect(transport.sent).toHaveLength(1);
    const message = transport.sent[0];
    expect(message?.to.map((a) => a.email).sort()).toEqual(['mk@cleanstart.test', 'pm@cleanstart.test']);
    expect(message?.replyTo).toMatchObject({ email: 'aditi@kestrel.test' });
    expect(message?.htmlContent).toContain('&lt;b&gt;Rust&lt;/b&gt;');
    expect(message?.htmlContent).not.toContain('<b>Rust</b>');
    expect(message?.subject + (message?.htmlContent ?? '')).toContain('Kestrel Systems');
  });

  it('tells the partner when the email could not be sent', async () => {
    const viewer = await world();
    const { transport } = setup();
    transport.failNext = 'brevo down';
    await expect(
      handleRequestMaterial(makeActionCtx(viewer, clock).ctx, requestMaterialSchema.parse({ request: 'Anything', product: 'all' }), { transport }),
    ).rejects.toBeInstanceOf(IntegrationError);
  });

  it('is refused for staff and rejects an empty request at the schema', async () => {
    const staff = await asStaff(db, 'marketing');
    await expect(
      handleRequestMaterial(makeActionCtx(staff, clock).ctx, requestMaterialSchema.parse({ request: 'x', product: 'all' }), { transport: new FakeEmailTransport() }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(requestMaterialSchema.safeParse({ request: '   ', product: 'all' }).success).toBe(false);
    expect(requestMaterialSchema.safeParse({ request: 'x', product: 'everything' }).success).toBe(false);
  });
});
```

- [ ] **Step 17: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/document-service.test.ts`
Expected: FAIL with `Failed to resolve import "./document-service"`.

- [ ] **Step 18: Create `document-service.ts`**

Create `apps/portal/src/server/files/document-service.ts`. This is not a `'use server'` module, so it can export schemas and the `handle*` functions; `actions/documents.ts` wraps them.

```ts
import { z } from 'zod';
import { env } from '@/env';
import type { UploadTicketDto } from '@/lib/document-upload';
import {
  DOC_PRODUCT_LABEL,
  DOC_PRODUCTS,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  PARTNER_CATEGORIES,
} from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import type { ActionContext } from '@/server/actions/run';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import type { EmailAddress, EmailTransport } from '@/server/email/transport';
import { sendEmail } from '@/server/email/send';
import { buildDocumentMaterialRequest, buildNewDocumentNotice } from '@/server/email/templates';
import { ForbiddenError, IntegrationError } from '@/server/errors';
import { log } from '@/server/log';
import { notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { withSystem, withViewer } from '@/server/repo/context';
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocumentRecipients,
  listMaterialRequestRecipients,
  replaceDocumentFile,
  updateDocument,
} from '@/server/repo/documents';
import { absoluteUrl } from '@/server/urls';
import { audienceLabel, cleanOriginalName, mimeForFileName } from './rules';
import type { FileStorage } from './storage';
import { createUploadTicket, type VerifyUploadOptions, verifyUpload } from './upload';

const TICKETS_PER_HOUR = 30;
const MATERIAL_REQUESTS_PER_HOUR = 5;

/* ------------------------------------------------------------------ schemas */

const uuid = z.string().uuid();
const fileName = z.string().trim().min(1, 'Choose a file to upload.').max(200);
const fileSize = z.number().int().nonnegative();

export const audienceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({
    kind: z.literal('categories'),
    categories: z.array(z.enum(PARTNER_CATEGORIES)).min(1, 'Pick at least one category.').max(PARTNER_CATEGORIES.length),
  }),
  z.object({ kind: z.literal('named'), partnerIds: z.array(uuid).min(1, 'Name at least one partner.').max(300) }),
]);

const fileRefSchema = z.object({ key: z.string().min(1).max(300), size: fileSize, originalName: fileName });

export const uploadTicketSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('create'), originalName: fileName, size: fileSize }),
  z.object({ mode: z.literal('replace'), documentId: uuid, originalName: fileName, size: fileSize }),
]);

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Give the document a title.').max(160),
  type: z.enum(DOCUMENT_TYPES),
  product: z.enum(DOC_PRODUCTS),
  summary: z
    .string()
    .trim()
    .max(300)
    .nullish()
    .transform((value) => (value ? value : null)),
  durationMinutes: z
    .number()
    .int()
    .min(1)
    .max(600)
    .nullish()
    .transform((value) => value ?? null),
  audience: audienceSchema,
  file: fileRefSchema,
});

export const replaceDocumentSchema = z.object({ id: uuid, file: fileRefSchema });

export const updateDocumentSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1, 'Give the document a title.').max(160).optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
  product: z.enum(DOC_PRODUCTS).optional(),
  summary: z.string().trim().max(300).nullable().optional(),
  audience: audienceSchema.optional(),
});

export const deleteDocumentSchema = z.object({ id: uuid });

export const requestMaterialSchema = z.object({
  request: z.string().trim().min(1, 'Describe the material you need.').max(2000),
  product: z.enum(DOC_PRODUCTS),
});

/* ------------------------------------------------------------------ handlers */

export interface DocumentDeps {
  storage: FileStorage;
  transport?: EmailTransport;
  /** Tests pass fakeRangeFetch(storage). Production uses the global fetch. */
  fetchImpl?: typeof fetch;
}

const verifyOptions = (deps: DocumentDeps): VerifyUploadOptions => (deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {});

function revalidateLibraries(ctx: ActionContext): void {
  ctx.revalidate(ROUTES.admin.documents);
  ctx.revalidate(ROUTES.partner.documents);
}

/** Step 1 of an upload. The content type comes from the extension, never from the browser. */
export async function handleCreateUploadTicket(
  ctx: ActionContext,
  input: z.output<typeof uploadTicketSchema>,
  deps: DocumentDeps,
): Promise<UploadTicketDto> {
  assertCan(ctx.viewer, input.mode === 'create' ? 'document.upload' : 'document.replace');
  rateLimit(`document-ticket:user:${ctx.viewer.id}`, { limit: TICKETS_PER_HOUR, windowSeconds: 3600 });
  const originalName = cleanOriginalName(input.originalName);
  const mime = mimeForFileName(originalName) ?? 'application/octet-stream';

  let documentId: string;
  let version: number;
  if (input.mode === 'create') {
    documentId = crypto.randomUUID();
    version = 1;
  } else {
    const current = await withViewer(ctx.viewer, (tx) => getDocument(tx, ctx.viewer, input.documentId));
    documentId = current.id;
    version = current.version + 1;
  }
  const { key, put } = await createUploadTicket(deps.storage, { documentId, version, originalName, mime, size: input.size });
  return { key, url: put.url, headers: put.headers, expiresAt: put.expiresAt.toISOString(), originalName, size: input.size };
}

/** Step 2 for a new document: verify the object, then one transaction (row, audit, in-app notifications), then emails. */
export async function handleCreateDocument(
  ctx: ActionContext,
  input: z.output<typeof createDocumentSchema>,
  deps: DocumentDeps,
): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.upload');
  const file = await verifyUpload(
    deps.storage,
    { key: input.file.key, size: input.file.size, mime: mimeForFileName(input.file.originalName) ?? '', originalName: input.file.originalName },
    verifyOptions(deps),
  );
  const result = await withViewer(ctx.viewer, async (tx) => {
    const doc = await createDocument(
      tx,
      ctx.viewer,
      {
        title: input.title,
        type: input.type,
        product: input.product,
        summary: input.summary,
        durationMinutes: input.durationMinutes,
        audience: input.audience,
        file,
      },
      ctx.clock,
    );
    await recordAudit(tx, ctx.viewer, {
      event: 'document.uploaded',
      target: doc.title,
      note: `${DOCUMENT_TYPE_LABEL[doc.type]}, ${DOC_PRODUCT_LABEL[doc.product]}, open to ${audienceLabel(doc.audience)}`,
      subject: { type: 'document', id: doc.id },
    });
    const recipients = await listDocumentRecipients(tx, ctx.viewer, { id: doc.id });
    const items = recipients.map((userId) => ({
      userId,
      kind: 'document_new' as const,
      title: `New document: ${doc.title}`,
      body: `${DOCUMENT_TYPE_LABEL[doc.type]}, ${DOC_PRODUCT_LABEL[doc.product]}`,
      link: ROUTES.partner.documents,
    }));
    await notifyUsers(tx, items);
    return { doc, items };
  });

  revalidateLibraries(ctx);
  ctx.afterCommit(async () => {
    for (const to of await resolveEmailRecipients(result.items)) {
      await sendEmail(
        buildNewDocumentNotice({
          to: { email: to.email, name: to.name },
          recipientName: to.name,
          title: result.doc.title,
          typeLabel: DOCUMENT_TYPE_LABEL[result.doc.type],
          productLabel: DOC_PRODUCT_LABEL[result.doc.product],
          libraryUrl: absoluteUrl(ROUTES.partner.documents),
        }),
        deps.transport,
      );
    }
  });
  return result.doc;
}

/** Step 2 for a replacement. The ticket's version must still be the next one, or the repo refuses it. */
export async function handleReplaceDocumentFile(
  ctx: ActionContext,
  input: z.output<typeof replaceDocumentSchema>,
  deps: DocumentDeps,
): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.replace');
  const file = await verifyUpload(
    deps.storage,
    { key: input.file.key, size: input.file.size, mime: mimeForFileName(input.file.originalName) ?? '', originalName: input.file.originalName },
    verifyOptions(deps),
  );
  const replaced = await withViewer(ctx.viewer, async (tx) => {
    const out = await replaceDocumentFile(tx, ctx.viewer, { id: input.id, file }, ctx.clock);
    await recordAudit(tx, ctx.viewer, {
      event: 'document.replaced',
      target: out.document.title,
      note: `Version ${out.document.version} uploaded, link and open count kept`,
      subject: { type: 'document', id: out.document.id },
    });
    return out.document;
  });
  revalidateLibraries(ctx);
  return replaced;
}

export async function handleUpdateDocument(ctx: ActionContext, input: z.output<typeof updateDocumentSchema>): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.edit');
  const patch = {
    id: input.id,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.product !== undefined ? { product: input.product } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.audience !== undefined ? { audience: input.audience } : {}),
  };
  const updated = await withViewer(ctx.viewer, async (tx) => {
    const out = await updateDocument(tx, ctx.viewer, patch, ctx.clock);
    const subject = { type: 'document' as const, id: out.document.id };
    if (out.changed.includes('details')) {
      await recordAudit(tx, ctx.viewer, { event: 'document.edited', target: out.document.title, note: 'Details updated', subject });
    }
    if (out.changed.includes('audience')) {
      await recordAudit(tx, ctx.viewer, {
        event: 'document.audience_changed',
        target: out.document.title,
        before: out.audienceBefore,
        after: out.audienceAfter,
        subject,
      });
    }
    return out;
  });
  if (updated.changed.length > 0) revalidateLibraries(ctx);
  return updated.document;
}

export async function handleDeleteDocument(ctx: ActionContext, input: z.output<typeof deleteDocumentSchema>): Promise<{ title: string }> {
  assertCan(ctx.viewer, 'document.delete');
  const out = await withViewer(ctx.viewer, async (tx) => {
    const removed = await deleteDocument(tx, ctx.viewer, { id: input.id }, ctx.clock);
    await recordAudit(tx, ctx.viewer, {
      event: 'document.deleted',
      target: removed.title,
      note: 'Partners lost access',
      subject: { type: 'document', id: input.id },
    });
    return removed;
  });
  revalidateLibraries(ctx);
  return out;
}

/**
 * The email is the whole action, so it is sent before returning and a failure is reported to the partner. Recipients are
 * the partner's manager and marketing; with none, PARTNERS_NOTIFY_EMAIL; with none of those, the request is logged at
 * error level and the partner is told it was sent (limitation: nothing is stored, email delivery is best effort).
 */
export async function handleRequestMaterial(
  ctx: ActionContext,
  input: z.output<typeof requestMaterialSchema>,
  deps: { transport?: EmailTransport },
): Promise<{ sent: true }> {
  assertCan(ctx.viewer, 'document.request_material');
  const viewer = ctx.viewer;
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  rateLimit(`material:user:${viewer.id}`, { limit: MATERIAL_REQUESTS_PER_HOUR, windowSeconds: 3600 });

  const found = await withSystem(SYSTEM_ACTORS.portal, (tx) =>
    listMaterialRequestRecipients(tx, SYSTEM_ACTORS.portal, { partnerId: viewer.partnerId }),
  );
  const to: EmailAddress[] = found.recipients.map((person) => ({ email: person.email, name: person.name }));
  if (to.length === 0 && env.PARTNERS_NOTIFY_EMAIL) {
    log.warn({ partnerId: viewer.partnerId }, 'material request: no manager or marketing user, using PARTNERS_NOTIFY_EMAIL');
    to.push({ email: env.PARTNERS_NOTIFY_EMAIL });
  }
  if (to.length === 0) {
    log.error({ partnerId: viewer.partnerId, userId: viewer.id }, 'material request has no recipient and was not delivered');
    return { sent: true };
  }
  const result = await sendEmail(
    buildDocumentMaterialRequest({
      to,
      replyTo: { email: viewer.email, name: viewer.name },
      partnerName: viewer.partnerName,
      requesterName: viewer.name,
      request: input.request,
      productLabel: DOC_PRODUCT_LABEL[input.product],
    }),
    deps.transport,
  );
  if (result.status === 'failed') throw new IntegrationError('brevo', result.error);
  return { sent: true };
}
```

- [ ] **Step 19: Run the service test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/document-service.test.ts`
Expected: PASS. If the HTML assertions in the material test fail because the template renders the request inside a different but still escaped structure, keep the two escaping assertions (they are the contract: escaped text present, raw tag absent) and relax only the `Kestrel Systems` line.

- [ ] **Step 20: Create the server action file**

Create `apps/portal/src/server/actions/documents.ts` (every export is an `async function`; no types or constants are exported, contracts unknown 9):

```ts
'use server';

import type { UploadTicketDto } from '@/lib/document-upload';
import type { DocumentDto } from '@/lib/dto';
import {
  createDocumentSchema,
  deleteDocumentSchema,
  handleCreateDocument,
  handleCreateUploadTicket,
  handleDeleteDocument,
  handleReplaceDocumentFile,
  handleRequestMaterial,
  handleUpdateDocument,
  replaceDocumentSchema,
  requestMaterialSchema,
  updateDocumentSchema,
  uploadTicketSchema,
} from '@/server/files/document-service';
import { getFileStorage } from '@/server/files/instance';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

/** Step 1 of an upload: validate, then hand back a presigned PUT. */
export async function createUploadTicketAction(raw: unknown): Promise<ActionResult<UploadTicketDto>> {
  return runViewerAction({ name: 'document.upload_ticket', schema: uploadTicketSchema }, raw, (ctx, input) =>
    handleCreateUploadTicket(ctx, input, { storage: getFileStorage() }),
  );
}

/** Step 2 for a new document, after the browser finished the PUT. */
export async function createDocumentAction(raw: unknown): Promise<ActionResult<DocumentDto>> {
  return runViewerAction({ name: 'document.create', schema: createDocumentSchema }, raw, (ctx, input) =>
    handleCreateDocument(ctx, input, { storage: getFileStorage() }),
  );
}

/** Step 2 for a replacement file. */
export async function replaceDocumentFileAction(raw: unknown): Promise<ActionResult<DocumentDto>> {
  return runViewerAction({ name: 'document.replace', schema: replaceDocumentSchema }, raw, (ctx, input) =>
    handleReplaceDocumentFile(ctx, input, { storage: getFileStorage() }),
  );
}

export async function updateDocumentAction(raw: unknown): Promise<ActionResult<DocumentDto>> {
  return runViewerAction({ name: 'document.update', schema: updateDocumentSchema }, raw, (ctx, input) =>
    handleUpdateDocument(ctx, input),
  );
}

export async function deleteDocumentAction(raw: unknown): Promise<ActionResult<{ title: string }>> {
  return runViewerAction({ name: 'document.delete', schema: deleteDocumentSchema }, raw, (ctx, input) =>
    handleDeleteDocument(ctx, input),
  );
}

export async function requestMaterialAction(raw: unknown): Promise<ActionResult<{ sent: true }>> {
  return runViewerAction({ name: 'document.request_material', schema: requestMaterialSchema }, raw, (ctx, input) =>
    handleRequestMaterial(ctx, input, {}),
  );
}
```

- [ ] **Step 21: Write the failing purge job test**

Create `apps/portal/src/server/jobs/document-purge.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentAudience, documentVersions, documents } from '@/db/schema';
import { makeDocument, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage } from '@/server/files/fake';
import { purgeDocumentFiles } from './document-purge';

const db = testDb();
const clock = fixedClock('2026-12-20T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const version = (documentId: string, n: number, key: string, purgeAfter: string) => ({
  documentId,
  version: n,
  fileKey: key,
  fileSize: 1,
  mime: 'application/pdf',
  originalName: `${key}.pdf`,
  purgeAfter: new Date(purgeAfter),
});

describe('purgeDocumentFiles', () => {
  it('deletes expired old versions and tombstones documents deleted more than 30 days ago, keeping everything else', async () => {
    const live = await makeDocument(db, {});
    await db.insert(documentVersions).values([
      version(live.id, 1, 'documents/v1-due', '2026-12-19T00:00:00Z'),
      version(live.id, 2, 'documents/v2-not-yet', '2026-12-25T00:00:00Z'),
    ]);
    const partner = await makePartner(db, {});
    const oldDeleted = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z'), audienceKind: 'named', partnerIds: [partner.id] });
    await db.insert(documentVersions).values(version(oldDeleted.id, 1, 'documents/old-doc-v1', '2027-01-30T00:00:00Z'));
    const recentDeleted = await makeDocument(db, { deletedAt: new Date('2026-12-10T00:00:00Z') });

    const storage = new FakeFileStorage(clock);
    const result = await purgeDocumentFiles({ storage, clock });

    expect(storage.deleted.sort()).toEqual(['documents/old-doc-v1', 'documents/v1-due', oldDeleted.fileKey].sort());
    expect(result).toEqual({ purged: 3, failed: [] });
    const versions = await db.select().from(documentVersions);
    expect(versions.map((v) => v.fileKey)).toEqual(['documents/v2-not-yet']);
    const [tomb] = await db.select().from(documents).where(eq(documents.id, oldDeleted.id));
    expect(tomb).toMatchObject({ fileKey: `purged/${oldDeleted.id}`, fileSize: 0, title: oldDeleted.title });
    expect(await db.select().from(documentAudience).where(eq(documentAudience.documentId, oldDeleted.id))).toHaveLength(0);
    const [recent] = await db.select().from(documents).where(eq(documents.id, recentDeleted.id));
    expect(recent?.fileKey).toBe(recentDeleted.fileKey);
    const [kept] = await db.select().from(documents).where(eq(documents.id, live.id));
    expect(kept?.fileKey).toBe(live.fileKey);
  });

  it('is idempotent: a second run deletes nothing', async () => {
    await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    const storage = new FakeFileStorage(clock);
    expect((await purgeDocumentFiles({ storage, clock })).purged).toBe(1);
    storage.deleted.length = 0;
    expect(await purgeDocumentFiles({ storage, clock })).toEqual({ purged: 0, failed: [] });
    expect(storage.deleted).toEqual([]);
  });

  it('keeps going when one R2 delete fails and reports the key', async () => {
    const a = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    const b = await makeDocument(db, { deletedAt: new Date('2026-11-02T00:00:00Z') });
    const storage = new FakeFileStorage(clock);
    const realDelete = storage.delete.bind(storage);
    storage.delete = async (key: string) => {
      if (key === a.fileKey) throw new Error('r2 down');
      await realDelete(key);
    };
    const result = await purgeDocumentFiles({ storage, clock });
    expect(result.failed).toEqual([a.fileKey]);
    expect(storage.deleted).toEqual([b.fileKey]);
  });
});
```

- [ ] **Step 22: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/document-purge.test.ts`
Expected: FAIL with `purgeDocumentFiles is not a function` (the W0-c stub only exports `runDocumentPurge`).

- [ ] **Step 23: Replace the stub body of `jobs/document-purge.ts`**

Replace the whole of `apps/portal/src/server/jobs/document-purge.ts`. The name `runDocumentPurge` and its signature `() => Promise<void>` are fixed by contracts H.17 (the scheduler in `jobs/index.ts` calls it at `20 3 * * *`; nothing here edits `index.ts`).

```ts
import * as Sentry from '@sentry/nextjs';
import { type Clock, systemClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { IntegrationError } from '@/server/errors';
import { createFileStorage } from '@/server/files/r2';
import type { FileStorage } from '@/server/files/storage';
import { log } from '@/server/log';
import { withSystem } from '@/server/repo/context';
import { purgeExpiredFiles } from '@/server/repo/documents';

export interface PurgeResult {
  /** R2 keys the database step released. */
  purged: number;
  /** Keys whose R2 delete failed. The rows are already gone, so these objects are orphans: delete them by hand. */
  failed: string[];
}

/**
 * Database first (one transaction), R2 after. A failed R2 delete cannot be retried by the next run because the rows
 * are gone, so the key is logged at error level and sent to Sentry.
 */
export async function purgeDocumentFiles(deps: { storage: FileStorage; clock: Clock }): Promise<PurgeResult> {
  const { keys } = await withSystem(SYSTEM_ACTORS.portal, (tx) => purgeExpiredFiles(tx, SYSTEM_ACTORS.portal, deps.clock));
  const failed: string[] = [];
  for (const key of keys) {
    try {
      await deps.storage.delete(key);
    } catch (error) {
      failed.push(key);
      log.error({ err: error, key }, 'document purge: R2 delete failed, delete the object by hand');
      Sentry.captureException(error, { tags: { job: 'document-purge' }, extra: { key } });
    }
  }
  return { purged: keys.length, failed };
}

export const runDocumentPurge = async (): Promise<void> => {
  let storage: FileStorage;
  try {
    storage = createFileStorage();
  } catch (error) {
    if (error instanceof IntegrationError) {
      log.warn({ err: error }, 'document-purge skipped: R2 is not configured');
      return;
    }
    throw error;
  }
  const result = await purgeDocumentFiles({ storage, clock: systemClock });
  log.info({ purged: result.purged, failed: result.failed.length }, 'document-purge done');
};
```

- [ ] **Step 24: Run the job test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/document-purge.test.ts`
Expected: PASS, 3 tests.

#### Part E: the client helpers

- [ ] **Step 25: Write the failing doc-view and upload-client tests**

Create `apps/portal/src/components/documents/doc-view.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  adminUpdatedLabel,
  audienceInputOf,
  audienceTone,
  draftFromAudience,
  draftToInput,
  emptyAudienceDraft,
  isFresh,
  parsePartnerNames,
  sameAudience,
} from './doc-view';

const PARTNERS = [
  { id: 'p1', name: 'Kestrel Systems' },
  { id: 'p2', name: 'Saffron Secure' },
];

describe('freshness and dates', () => {
  it('is fresh for seven days and not after', () => {
    expect(isFresh('2026-11-01T10:00:00.000Z', '2026-11-08')).toBe(true);
    expect(isFresh('2026-11-01T10:00:00.000Z', '2026-11-09')).toBe(false);
  });
  it('labels today as Today and other days as a short date', () => {
    expect(adminUpdatedLabel('2026-11-06T09:30:00.000Z', '2026-11-06')).toBe('Today');
    expect(adminUpdatedLabel('2026-11-04T09:30:00.000Z', '2026-11-06')).toBe('4 Nov');
  });
  it('keeps the mock badge tones', () => {
    expect(audienceTone('all')).toBe('neutral');
    expect(audienceTone('named')).toBe('pending');
    expect(audienceTone('categories')).toBe('violet');
  });
});

describe('parsePartnerNames', () => {
  it('splits on commas, trims and drops empties', () => {
    expect(parsePartnerNames(' Kestrel Systems ,, Saffron Secure ,')).toEqual(['Kestrel Systems', 'Saffron Secure']);
    expect(parsePartnerNames('')).toEqual([]);
  });
});

describe('draftToInput', () => {
  it('turns each kind into an audience input', () => {
    expect(draftToInput(emptyAudienceDraft, PARTNERS)).toEqual({ ok: false, error: 'Pick at least one category.' });
    expect(draftToInput({ kind: 'all', categories: [], partnersText: '' }, PARTNERS)).toEqual({ ok: true, audience: { kind: 'all' } });
    expect(draftToInput({ kind: 'categories', categories: ['channel'], partnersText: '' }, PARTNERS)).toEqual({
      ok: true,
      audience: { kind: 'categories', categories: ['channel'] },
    });
  });
  it('matches partner names case insensitively and collapses duplicates', () => {
    expect(draftToInput({ kind: 'named', categories: [], partnersText: 'kestrel systems, SAFFRON SECURE, Kestrel Systems' }, PARTNERS)).toEqual({
      ok: true,
      audience: { kind: 'named', partnerIds: ['p1', 'p2'] },
    });
  });
  it('explains an empty or unknown partner list', () => {
    expect(draftToInput({ kind: 'named', categories: [], partnersText: ' , ' }, PARTNERS)).toEqual({ ok: false, error: 'Name at least one partner.' });
    expect(draftToInput({ kind: 'named', categories: [], partnersText: 'Kestrel Systems, Nobody Ltd' }, PARTNERS)).toEqual({
      ok: false,
      error: 'No partner named Nobody Ltd.',
    });
  });
});

describe('draftFromAudience, audienceInputOf and sameAudience', () => {
  it('round trips a named audience through names and back to ids', () => {
    const audience = { kind: 'named' as const, categories: [], partners: [{ id: 'p2', name: 'Saffron Secure' }, { id: 'p1', name: 'Kestrel Systems' }] };
    expect(draftFromAudience(audience)).toEqual({ kind: 'named', categories: [], partnersText: 'Saffron Secure, Kestrel Systems' });
    expect(audienceInputOf(audience)).toEqual({ kind: 'named', partnerIds: ['p2', 'p1'] });
  });
  it('compares categories and partner ids without regard to order', () => {
    expect(sameAudience({ kind: 'categories', categories: ['channel', 'distributor'] }, { kind: 'categories', categories: ['distributor', 'channel'] })).toBe(true);
    expect(sameAudience({ kind: 'named', partnerIds: ['a', 'b'] }, { kind: 'named', partnerIds: ['b', 'a'] })).toBe(true);
    expect(sameAudience({ kind: 'all' }, { kind: 'all' })).toBe(true);
    expect(sameAudience({ kind: 'all' }, { kind: 'categories', categories: ['channel'] })).toBe(false);
    expect(sameAudience({ kind: 'named', partnerIds: ['a'] }, { kind: 'named', partnerIds: ['a', 'b'] })).toBe(false);
  });
});
```

Create `apps/portal/src/components/documents/upload-client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fail, ok } from '@/server/actions/result';
import type { UploadTicketDto } from '@/lib/document-upload';
import { putFile, uploadFile } from './upload-client';

class FakeXhr {
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 200;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown = null;
  constructor(private readonly behaviour: 'ok' | 'http-error' | 'network-error' = 'ok') {}
  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }
  send(body: unknown): void {
    this.body = body;
    queueMicrotask(() => {
      if (this.behaviour === 'network-error') return this.onerror?.();
      this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
      this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
      if (this.behaviour === 'http-error') this.status = 403;
      this.onload?.();
    });
  }
}

const asXhr = (fake: FakeXhr) => (() => fake as unknown as XMLHttpRequest);
const ticket: UploadTicketDto = {
  key: 'documents/d/v1/u-a.pdf',
  url: 'https://r2.test/put',
  headers: { 'Content-Type': 'application/pdf' },
  expiresAt: '2026-11-06T14:12:00.000Z',
  originalName: 'a.pdf',
  size: 3,
};
const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' });

describe('putFile', () => {
  it('PUTs the file with exactly the ticket headers and reports progress', async () => {
    const xhr = new FakeXhr();
    const seen: number[] = [];
    await putFile(ticket, file, (percent) => seen.push(percent), asXhr(xhr));
    expect(xhr).toMatchObject({ method: 'PUT', url: 'https://r2.test/put', headers: { 'Content-Type': 'application/pdf' }, body: file });
    expect(seen).toEqual([50, 100]);
  });
  it('rejects with a readable message on an HTTP error and on a network error', async () => {
    await expect(putFile(ticket, file, () => undefined, asXhr(new FakeXhr('http-error')))).rejects.toThrow('Upload failed (403).');
    await expect(putFile(ticket, file, () => undefined, asXhr(new FakeXhr('network-error')))).rejects.toThrow('The upload was interrupted');
  });
});

describe('uploadFile', () => {
  it('returns the key and file facts after a ticket and a PUT', async () => {
    const result = await uploadFile({ file, requestTicket: async () => ok(ticket), onProgress: () => undefined, makeXhr: asXhr(new FakeXhr()) });
    expect(result).toEqual(ok({ key: ticket.key, size: 3, originalName: 'a.pdf' }));
  });
  it('passes a ticket failure through without touching the network', async () => {
    const xhr = new FakeXhr();
    const failure = fail({ code: 'validation', message: 'Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file.' });
    const result = await uploadFile({ file, requestTicket: async () => failure, onProgress: () => undefined, makeXhr: asXhr(xhr) });
    expect(result).toEqual(failure);
    expect(xhr.method).toBe('');
  });
  it('turns a failed PUT into an integration failure', async () => {
    const result = await uploadFile({ file, requestTicket: async () => ok(ticket), onProgress: () => undefined, makeXhr: asXhr(new FakeXhr('http-error')) });
    expect(result).toEqual(fail({ code: 'integration', message: 'Upload failed (403).' }));
  });
});
```

- [ ] **Step 26: Run them and see them fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/documents/doc-view.test.ts src/components/documents/upload-client.test.ts`
Expected: FAIL with `Failed to resolve import "./doc-view"` and `Failed to resolve import "./upload-client"`.

- [ ] **Step 27: Create `doc-view.ts` and `upload-client.ts`**

Create `apps/portal/src/components/documents/doc-view.ts` (pure, client safe):

```ts
import { daysBetween, fmtShort } from '@/lib/dates';
import type { AudienceInput, AudiencePartnerDto } from '@/lib/document-upload';
import type { AudienceKind, PartnerCategory } from '@/lib/domain';
import type { DocumentAudienceDto } from '@/lib/dto';

/** A document counts as new for this many days after it was added or replaced. */
export const FRESH_DAYS = 7;

export const isFresh = (updatedAt: string, today: string): boolean => daysBetween(updatedAt.slice(0, 10), today) <= FRESH_DAYS;

/** "Today" for a document updated today, otherwise "4 Nov". Replaces the mock's "Just now". */
export const adminUpdatedLabel = (updatedAt: string, today: string): string =>
  updatedAt.slice(0, 10) === today ? 'Today' : fmtShort(updatedAt);

export const audienceTone = (kind: AudienceKind): 'neutral' | 'pending' | 'violet' =>
  kind === 'all' ? 'neutral' : kind === 'named' ? 'pending' : 'violet';

/** What the audience controls hold while a person edits: named partners stay a comma separated text, as in the mock. */
export interface AudienceDraft {
  kind: AudienceKind;
  categories: PartnerCategory[];
  partnersText: string;
}

export const emptyAudienceDraft: AudienceDraft = { kind: 'categories', categories: [], partnersText: '' };

export const parsePartnerNames = (text: string): string[] =>
  text
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');

export type DraftResult = { ok: true; audience: AudienceInput } | { ok: false; error: string };

/** Validates the draft the way the server will, and maps partner names to ids. */
export function draftToInput(draft: AudienceDraft, partners: readonly AudiencePartnerDto[]): DraftResult {
  if (draft.kind === 'all') return { ok: true, audience: { kind: 'all' } };
  if (draft.kind === 'categories') {
    if (draft.categories.length === 0) return { ok: false, error: 'Pick at least one category.' };
    return { ok: true, audience: { kind: 'categories', categories: [...draft.categories] } };
  }
  const names = parsePartnerNames(draft.partnersText);
  if (names.length === 0) return { ok: false, error: 'Name at least one partner.' };
  const byName = new Map(partners.map((partner) => [partner.name.toLowerCase(), partner.id]));
  const unknown = names.filter((name) => !byName.has(name.toLowerCase()));
  if (unknown.length > 0) return { ok: false, error: `No partner named ${unknown.join(', ')}.` };
  const ids = names.flatMap((name) => {
    const id = byName.get(name.toLowerCase());
    return id === undefined ? [] : [id];
  });
  return { ok: true, audience: { kind: 'named', partnerIds: [...new Set(ids)] } };
}

export const draftFromAudience = (audience: DocumentAudienceDto): AudienceDraft => ({
  kind: audience.kind,
  categories: [...audience.categories],
  partnersText: audience.partners.map((partner) => partner.name).join(', '),
});

export function audienceInputOf(audience: DocumentAudienceDto): AudienceInput {
  if (audience.kind === 'all') return { kind: 'all' };
  if (audience.kind === 'categories') return { kind: 'categories', categories: [...audience.categories] };
  return { kind: 'named', partnerIds: audience.partners.map((partner) => partner.id) };
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

export function sameAudience(a: AudienceInput, b: AudienceInput): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'categories' && b.kind === 'categories') return sameSet(a.categories, b.categories);
  if (a.kind === 'named' && b.kind === 'named') return sameSet(a.partnerIds, b.partnerIds);
  return true;
}
```

Create `apps/portal/src/components/documents/upload-client.ts` (browser only; it uses `XMLHttpRequest` for upload progress):

```ts
import type { UploadedFileRef, UploadTicketDto } from '@/lib/document-upload';
import { type ActionResult, fail, ok } from '@/server/actions/result';

export type XhrFactory = () => XMLHttpRequest;

/** PUTs the file to the presigned URL with exactly the headers the ticket names. `Content-Length` is set by the browser from the body. */
export function putFile(
  ticket: Pick<UploadTicketDto, 'url' | 'headers'>,
  file: Blob,
  onProgress: (percent: number) => void,
  makeXhr: XhrFactory = () => new XMLHttpRequest(),
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = makeXhr();
    xhr.open('PUT', ticket.url);
    for (const [name, value] of Object.entries(ticket.headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('The upload was interrupted. Check your connection and try again.'));
    xhr.onabort = () => reject(new Error('The upload was cancelled.'));
    xhr.send(file);
  });
}

/** Ticket, then PUT. Returns what the confirm action needs, or the first failure as an ActionResult the form can show. */
export async function uploadFile(args: {
  file: File;
  requestTicket: () => Promise<ActionResult<UploadTicketDto>>;
  onProgress: (percent: number) => void;
  makeXhr?: XhrFactory;
}): Promise<ActionResult<UploadedFileRef>> {
  const ticket = await args.requestTicket();
  if (!ticket.ok) return ticket;
  try {
    await putFile(ticket.data, args.file, args.onProgress, args.makeXhr);
  } catch (error) {
    return fail({ code: 'integration', message: error instanceof Error ? error.message : 'The upload failed.' });
  }
  return ok({ key: ticket.data.key, size: args.file.size, originalName: args.file.name });
}
```

- [ ] **Step 28: Run the client helper tests and see them pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/documents/doc-view.test.ts src/components/documents/upload-client.test.ts`
Expected: PASS.

#### Part F: the screens

How to apply an edit below: open the file, find the "Before" text exactly as shown (it is copied from the mock at commit `58747992`, so it matches), and replace it with the "After" text. The markup, class names and copy are unchanged except where a decision in "Decisions made by this plan" says otherwise. Run `pnpm --filter @cleanstart/portal typecheck` after each file; the first typecheck after a partial conversion reports errors in files not yet converted, which is expected until Step 38.

- [ ] **Step 29: Create `AudiencePicker.tsx` (the audience controls, moved out of `UploadDocumentForm`)**

Create `apps/portal/src/components/documents/AudiencePicker.tsx`. The markup is the mock's audience section (segmented control, category badges, partner name field) with ids prefixed so two instances can exist on one page.

```tsx
'use client';

import type { AudienceDraft } from '@/components/documents/doc-view';
import { type AudienceKind, PARTNER_CATEGORIES, PARTNER_CATEGORY_PLURAL, type PartnerCategory } from '@/lib/domain';

const AUDIENCES: ReadonlyArray<{ kind: AudienceKind; label: string }> = [
  { kind: 'all', label: 'Everyone' },
  { kind: 'categories', label: 'Categories' },
  { kind: 'named', label: 'Named partners' },
];

export function AudiencePicker({
  idPrefix,
  draft,
  onChange,
  error,
  disabled = false,
}: {
  idPrefix: string;
  draft: AudienceDraft;
  onChange: (next: AudienceDraft) => void;
  error: string | null;
  disabled?: boolean;
}): React.JSX.Element {
  const audId = `${idPrefix}-aud`;
  const partnersId = `${idPrefix}-pa`;
  const toggle = (category: PartnerCategory): void =>
    onChange({
      ...draft,
      categories: draft.categories.includes(category)
        ? draft.categories.filter((c) => c !== category)
        : [...draft.categories, category],
    });

  return (
    <>
      <div className="fg">
        <span id={audId} className="lbl">
          Who can open it
        </span>
        <div className="seg" role="group" aria-labelledby={audId} style={{ alignSelf: 'flex-start' }}>
          {AUDIENCES.map((a) => (
            <button
              key={a.kind}
              type="button"
              className={`seg-b${a.kind === draft.kind ? ' seg-on' : ''}`}
              aria-pressed={a.kind === draft.kind}
              disabled={disabled}
              onClick={() => onChange({ ...draft, kind: a.kind })}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {draft.kind === 'categories' ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PARTNER_CATEGORIES.map((c) => {
              const on = draft.categories.includes(c);
              return (
                <label
                  key={c}
                  className={`badge ${on ? 'b-violet' : 'b-neutral'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 8px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={() => toggle(c)}
                    style={{ width: 13, height: 13, margin: 0, accentColor: '#4B23C8' }}
                  />
                  {PARTNER_CATEGORY_PLURAL[c]}
                </label>
              );
            })}
          </div>
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
        </>
      ) : null}
      {draft.kind === 'named' ? (
        <div className="fg">
          <label htmlFor={partnersId} className="lbl">
            Partners
          </label>
          <input
            id={partnersId}
            className={`field${error ? ' field-err' : ''}`}
            type="text"
            value={draft.partnersText}
            disabled={disabled}
            onChange={(e) => onChange({ ...draft, partnersText: e.target.value })}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${partnersId}-err` : `${partnersId}-hint`}
          />
          {error ? (
            <span id={`${partnersId}-err`} className="err">
              {error}
            </span>
          ) : (
            <span id={`${partnersId}-hint`} className="hint">
              Separate partner names with commas.
            </span>
          )}
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 30: Convert `doc-style.ts`**

Replace the whole of `apps/portal/src/components/documents/doc-style.ts`.

Before (the whole mock file):

```ts
import type { IconName } from '@/components/icon-paths';
import type { DocType } from '@/data/documents';

export const TYPE_ICON: Record<DocType, IconName> = {
  Video: 'play',
  Battlecard: 'file',
  'Price list': 'file',
  Datasheet: 'file',
  'Solution sheet': 'file',
  'Enablement guide': 'docs',
};

export const TYPE_TONE: Record<DocType, string> = {
  Video: 'tone-violet',
  Battlecard: 'tone-red',
  'Price list': 'tone-red',
  Datasheet: 'tone-blue',
  'Solution sheet': 'tone-blue',
  'Enablement guide': 'tone-green',
};
```

After:

```ts
import type { IconName } from '@/components/icon-paths';
import type { Product as ChipProduct } from '@/components/ui/badge';
import type { DocProduct, DocumentType } from '@/lib/domain';

export const TYPE_ICON: Record<DocumentType, IconName> = {
  video: 'play',
  battlecard: 'file',
  price_list: 'file',
  datasheet: 'file',
  solution_sheet: 'file',
  enablement_guide: 'docs',
};

export const TYPE_TONE: Record<DocumentType, string> = {
  video: 'tone-violet',
  battlecard: 'tone-red',
  price_list: 'tone-red',
  datasheet: 'tone-blue',
  solution_sheet: 'tone-blue',
  enablement_guide: 'tone-green',
};

/** ProductChip takes the display label as its Product type. These are exactly the labels in DOC_PRODUCT_LABEL. */
export const CHIP_PRODUCT: Record<DocProduct, ChipProduct> = {
  images: 'CleanStart Images',
  libraries: 'Clean Libraries',
  cleansight: 'CleanSight',
  all: 'All products',
};
```

- [ ] **Step 31: Convert `DocumentPreview.tsx`**

Edit 1. Before:

```tsx
import { Icon } from '@/components/icon';
import { Drawer } from '@/components/ui/overlay';
import type { PortalDocument } from '@/data/documents';

export function DocumentPreview({
  doc,
  onClose,
  onDownload,
}: {
  doc: PortalDocument | null;
  onClose: () => void;
  onDownload: (d: PortalDocument) => void;
}): React.JSX.Element | null {
  if (!doc) return null;
  const isVideo = doc.type === 'Video';
```

After:

```tsx
import { Icon } from '@/components/icon';
import { Drawer } from '@/components/ui/overlay';
import { fmtLong } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

export function DocumentPreview({
  doc,
  onClose,
  onDownload,
}: {
  doc: DocumentDto | null;
  onClose: () => void;
  onDownload: (d: DocumentDto) => void;
}): React.JSX.Element | null {
  if (!doc) return null;
  const isVideo = doc.type === 'video';
  const format = formatLabel(doc);
```

Edit 2. Before:

```tsx
      subtitle={`${doc.type}, ${doc.product}`}
```

After:

```tsx
      subtitle={`${DOCUMENT_TYPE_LABEL[doc.type]}, ${DOC_PRODUCT_LABEL[doc.product]}`}
```

Edit 3 (decision 9: videos are downloaded in v1, so the Download button shows for videos too). Before:

```tsx
          {isVideo ? null : (
            <button type="button" className="btn btn-p" onClick={() => onDownload(doc)}>
              Download
            </button>
          )}
```

After:

```tsx
          <button type="button" className="btn btn-p" onClick={() => onDownload(doc)}>
            Download
          </button>
```

Edit 4. Before:

```tsx
            <Icon name="play" className="ic" />
            {doc.format}
```

After:

```tsx
            <Icon name="play" className="ic" />
            {format}
```

Edit 5. Before:

```tsx
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#4A4858' }}>
        {doc.summary ?? `${doc.type}, ${doc.format}`}
      </p>
      <dl className="dl">
        <dt>Type</dt>
        <dd>{doc.type}</dd>
        <dt>Product</dt>
        <dd>{doc.product}</dd>
        <dt>Format</dt>
        <dd>{doc.format}</dd>
        <dt>Updated</dt>
        <dd>{doc.updated}</dd>
        <dt>Opened by your team</dt>
        <dd className="tnum">{doc.ownOpens} times</dd>
      </dl>
```

After:

```tsx
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#4A4858' }}>
        {doc.summary ?? `${DOCUMENT_TYPE_LABEL[doc.type]}, ${format}`}
      </p>
      <dl className="dl">
        <dt>Type</dt>
        <dd>{DOCUMENT_TYPE_LABEL[doc.type]}</dd>
        <dt>Product</dt>
        <dd>{DOC_PRODUCT_LABEL[doc.product]}</dd>
        <dt>Format</dt>
        <dd>{format}</dd>
        <dt>Updated</dt>
        <dd>{fmtLong(doc.updatedAt)}</dd>
        <dt>Opened by your team</dt>
        <dd className="tnum">{doc.ownOpens ?? 0} times</dd>
      </dl>
```

- [ ] **Step 32: Convert `RequestMaterialDialog.tsx`**

Edit 1. Before:

```tsx
import { useCallback, useState } from 'react';
import { Dialog } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import type { Product } from '@/components/ui/badge';

const PRODUCTS: readonly Product[] = [
  'All products',
  'CleanStart Images',
  'Clean Libraries',
  'CleanSight',
];

export function RequestMaterialDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [text, setText] = useState('');
  const [product, setProduct] = useState<Product>('All products');
  const [tried, setTried] = useState(false);
  const invalid = tried && text.trim() === '';

  const close = useCallback((): void => {
    setTried(false);
    onClose();
  }, [onClose]);

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (text.trim() === '') {
      setTried(true);
      return;
    }
    setText('');
    setTried(false);
    onClose();
    toast('Request sent to CleanStart');
  };
```

After:

```tsx
import { useCallback, useState } from 'react';
import { Dialog } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import { DOC_PRODUCT_LABEL, type DocProduct } from '@/lib/domain';
import { requestMaterialAction } from '@/server/actions/documents';

/** The mock's order: All products first. */
const PRODUCT_ORDER: readonly DocProduct[] = ['all', 'images', 'libraries', 'cleansight'];

export function RequestMaterialDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [text, setText] = useState('');
  const [product, setProduct] = useState<DocProduct>('all');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalid = tried && text.trim() === '';

  const close = useCallback((): void => {
    setTried(false);
    setError(null);
    onClose();
  }, [onClose]);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    if (text.trim() === '') {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await requestMaterialAction({ request: text.trim(), product });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setText('');
    setTried(false);
    onClose();
    toast('Request sent to CleanStart');
  };
```

Edit 2. Before:

```tsx
          <button type="submit" className="btn btn-p">
            Send request
          </button>
```

After:

```tsx
          <button type="submit" className="btn btn-p" disabled={busy}>
            {busy ? 'Sending' : 'Send request'}
          </button>
```

Edit 3. Before:

```tsx
          {PRODUCTS.map((p) => (
            <button
              key={p}
              type="button"
              className={`seg-b${p === product ? ' seg-on' : ''}`}
              aria-pressed={p === product}
              onClick={() => setProduct(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
```

After:

```tsx
          {PRODUCT_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              className={`seg-b${p === product ? ' seg-on' : ''}`}
              aria-pressed={p === product}
              disabled={busy}
              onClick={() => setProduct(p)}
            >
              {DOC_PRODUCT_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <div className="note note-amber" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
    </Dialog>
```

- [ ] **Step 33: Convert `UploadDocumentForm.tsx`**

Edit 1 (imports, types and helpers). Before:

```tsx
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import {
  addDocument,
  DOC_PRODUCTS,
  DOC_TYPES,
  PARTNER_CATEGORIES,
  type DocAudience,
  type DocType,
} from '@/data/documents';
import type { Product } from '@/components/ui/badge';

type AudienceKind = DocAudience['kind'];

const AUDIENCES: ReadonlyArray<{ kind: AudienceKind; label: string }> = [
  { kind: 'all', label: 'Everyone' },
  { kind: 'categories', label: 'Categories' },
  { kind: 'partners', label: 'Named partners' },
];

const parseNames = (text: string): string[] =>
  text
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n !== '');
```

After:

```tsx
import { useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
import { type AudienceDraft, draftToInput, emptyAudienceDraft } from '@/components/documents/doc-view';
import { uploadFile } from '@/components/documents/upload-client';
import { Icon } from '@/components/icon';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import {
  DOC_PRODUCT_LABEL,
  DOC_PRODUCTS,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  type DocProduct,
  type DocumentType,
  isOneOf,
} from '@/lib/domain';
import { createDocumentAction, createUploadTicketAction } from '@/server/actions/documents';
import { issuesToErrors } from '@/server/actions/result';
import { UPLOAD_ACCEPT } from '@/server/files/rules';

const TYPE_OPTIONS = DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }));
const PRODUCT_OPTIONS = DOC_PRODUCTS.map((p) => ({ value: p, label: DOC_PRODUCT_LABEL[p] }));
```

Edit 2 (props, state, submit). Before:

```tsx
export function UploadDocumentForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const toast = useToast();
  const [title, setTitle] = useState('Clean Libraries pricing guide for partners');
  const [docType, setDocType] = useState<DocType>('Datasheet');
  const [product, setProduct] = useState<Product>('Clean Libraries');
  const [kind, setKind] = useState<AudienceKind>('categories');
  const [cats, setCats] = useState<string[]>(['Distributors', 'Channel partners']);
  const [partnersText, setPartnersText] = useState('Kestrel Systems, Saffron Secure');
  const [fileName, setFileName] = useState('');
  const [tried, setTried] = useState(false);

  const titleErr = tried && title.trim() === '';
  const partnersErr = tried && kind === 'partners' && parseNames(partnersText).length === 0;

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTried(true);
    if (title.trim() === '' || (kind === 'partners' && parseNames(partnersText).length === 0))
      return;
    const audience: DocAudience =
      kind === 'all'
        ? { kind: 'all' }
        : kind === 'categories'
          ? { kind: 'categories', categories: cats }
          : { kind: 'partners', partners: parseNames(partnersText) };
    const created = addDocument({ title: title.trim(), type: docType, product, audience });
    toast(`Uploaded ${created.title}`);
    onClose();
  };
```

After:

```tsx
export function UploadDocumentForm({
  onClose,
  partners,
}: {
  onClose: () => void;
  partners: readonly AudiencePartnerDto[];
}): React.JSX.Element {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('datasheet');
  const [product, setProduct] = useState<DocProduct>('all');
  const [draft, setDraft] = useState<AudienceDraft>(emptyAudienceDraft);
  const [file, setFile] = useState<File | null>(null);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const audience = draftToInput(draft, partners);
  const titleErr =
    serverErrors.title ?? (tried && title.trim() === '' ? 'Give the document a title.' : null);
  const fileErr = serverErrors.file ?? (tried && file === null ? 'Choose a file to upload.' : null);
  const audienceErr =
    tried && !audience.ok
      ? audience.error
      : (serverErrors['audience.categories'] ?? serverErrors['audience.partnerIds'] ?? null);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setFormError(null);
    setServerErrors({});
    if (busy || title.trim() === '' || file === null || !audience.ok) return;
    setBusy(true);
    setProgress(0);
    const uploaded = await uploadFile({
      file,
      requestTicket: () =>
        createUploadTicketAction({ mode: 'create', originalName: file.name, size: file.size }),
      onProgress: setProgress,
    });
    if (!uploaded.ok) {
      setBusy(false);
      setFormError(uploaded.error.message);
      return;
    }
    const created = await createDocumentAction({
      title: title.trim(),
      type: docType,
      product,
      summary: null,
      durationMinutes: null,
      audience: audience.audience,
      file: uploaded.data,
    });
    setBusy(false);
    if (!created.ok) {
      setServerErrors(issuesToErrors(created.error));
      setFormError(created.error.message);
      return;
    }
    toast(`Uploaded ${created.data.title}`);
    onClose();
  };
```

Edit 3 (file chooser). Before:

```tsx
            <span className="li-n">{fileName || 'Choose a file or drop it here'}</span>
            <span className="li-s">PDF, ZIP or MP4, up to 500 MB</span>
          </span>
          <input
            type="file"
            className="sr"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
          />
        </label>
```

After:

```tsx
            <span className="li-n">
              {busy
                ? `Uploading ${file?.name ?? ''}, ${progress}%`
                : file
                  ? file.name
                  : 'Choose a file or drop it here'}
            </span>
            <span className="li-s">PDF, PPTX, DOCX, XLSX, MP4 or ZIP, up to 100 MB</span>
          </span>
          <input
            type="file"
            className="sr"
            accept={UPLOAD_ACCEPT}
            disabled={busy}
            aria-invalid={fileErr ? true : undefined}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setServerErrors({});
            }}
          />
        </label>
        {fileErr ? (
          <span className="err" role="alert">
            {fileErr}
          </span>
        ) : null}
```

Edit 4 (title field). Before:

```tsx
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleErr ? true : undefined}
            aria-describedby={titleErr ? 'dt-err' : undefined}
          />
          {titleErr ? (
            <span id="dt-err" className="err">
              Give the document a title.
            </span>
          ) : null}
```

After:

```tsx
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            aria-invalid={titleErr ? true : undefined}
            aria-describedby={titleErr ? 'dt-err' : undefined}
          />
          {titleErr ? (
            <span id="dt-err" className="err">
              {titleErr}
            </span>
          ) : null}
```

Edit 5 (type dropdown). Before:

```tsx
              value={docType}
              options={DOC_TYPES}
              onChange={(v) => setDocType(v as DocType)}
```

After:

```tsx
              value={docType}
              options={TYPE_OPTIONS}
              onChange={(v) => {
                if (isOneOf(DOCUMENT_TYPES, v)) setDocType(v);
              }}
```

Edit 6 (product dropdown). Before:

```tsx
              value={product}
              options={DOC_PRODUCTS}
              onChange={(v) => setProduct(v as Product)}
```

After:

```tsx
              value={product}
              options={PRODUCT_OPTIONS}
              onChange={(v) => {
                if (isOneOf(DOC_PRODUCTS, v)) setProduct(v);
              }}
```

Edit 7 (the audience section becomes the shared picker). Before:

```tsx
        <div className="fg">
          <span id="aud" className="lbl">
            Who can open it
          </span>
          <div
            className="seg"
            role="group"
            aria-labelledby="aud"
            style={{ alignSelf: 'flex-start' }}
          >
            {AUDIENCES.map((a) => (
              <button
                key={a.kind}
                type="button"
                className={`seg-b${a.kind === kind ? ' seg-on' : ''}`}
                aria-pressed={a.kind === kind}
                onClick={() => setKind(a.kind)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        {kind === 'categories' ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PARTNER_CATEGORIES.map((c) => {
              const on = cats.includes(c);
              return (
                <label
                  key={c}
                  className={`badge ${on ? 'b-violet' : 'b-neutral'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 8px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setCats(on ? cats.filter((x) => x !== c) : [...cats, c])}
                    style={{ width: 13, height: 13, margin: 0, accentColor: '#4B23C8' }}
                  />
                  {c}
                </label>
              );
            })}
          </div>
        ) : null}
        {kind === 'partners' ? (
          <div className="fg">
            <label htmlFor="dpa" className="lbl">
              Partners
            </label>
            <input
              id="dpa"
              className={`field${partnersErr ? ' field-err' : ''}`}
              type="text"
              value={partnersText}
              onChange={(e) => setPartnersText(e.target.value)}
              aria-invalid={partnersErr ? true : undefined}
              aria-describedby={partnersErr ? 'dpa-err' : 'dpa-hint'}
            />
            {partnersErr ? (
              <span id="dpa-err" className="err">
                Name at least one partner.
              </span>
            ) : (
              <span id="dpa-hint" className="hint">
                Separate partner names with commas.
              </span>
            )}
          </div>
        ) : null}
```

After:

```tsx
        <AudiencePicker
          idPrefix="up"
          draft={draft}
          onChange={setDraft}
          error={audienceErr}
          disabled={busy}
        />
```

Edit 8 (the form error and the button). Before:

```tsx
        <button type="submit" className="btn btn-p" style={{ alignSelf: 'flex-start' }}>
          <Icon name="upload" />
          Upload document
        </button>
```

After:

```tsx
        {formError ? (
          <div className="note note-amber" role="alert">
            <span>{formError}</span>
          </div>
        ) : null}
        <button
          type="submit"
          className="btn btn-p"
          style={{ alignSelf: 'flex-start' }}
          disabled={busy}
        >
          <Icon name="upload" />
          {busy ? 'Uploading' : 'Upload document'}
        </button>
```

- [ ] **Step 34: Convert `DocumentEditDrawer.tsx`**

Edit 1 (imports). Before:

```tsx
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import {
  adminUpdatedLabel,
  audienceLabel,
  audienceTone,
  deleteDocument,
  replaceDocument,
  type PortalDocument,
} from '@/data/documents';
```

After:

```tsx
import { useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
import {
  adminUpdatedLabel,
  type AudienceDraft,
  audienceInputOf,
  audienceTone,
  draftFromAudience,
  draftToInput,
  sameAudience,
} from '@/components/documents/doc-view';
import { uploadFile } from '@/components/documents/upload-client';
import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import { DOC_PRODUCT_LABEL, DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import {
  createUploadTicketAction,
  deleteDocumentAction,
  replaceDocumentFileAction,
  updateDocumentAction,
} from '@/server/actions/documents';
import { audienceLabel, formatLabel, UPLOAD_ACCEPT } from '@/server/files/rules';
```

Edit 2 (props, state, handlers). Before:

```tsx
export function DocumentEditDrawer({
  doc,
  onClose,
}: {
  doc: PortalDocument;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const remove = (): void => {
    deleteDocument(doc.id);
    onClose();
    toast(`Deleted ${doc.title}`);
  };
```

After:

```tsx
export function DocumentEditDrawer({
  doc,
  partners,
  today,
  onClose,
}: {
  doc: DocumentDto;
  partners: readonly AudiencePartnerDto[];
  today: string;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(doc.title);
  const [draft, setDraft] = useState<AudienceDraft>(() => draftFromAudience(doc.audience));

  const audience = draftToInput(draft, partners);
  const fieldError =
    title.trim() === '' ? 'Give the document a title.' : audience.ok ? null : audience.error;
  const changed =
    title.trim() !== doc.title ||
    !audience.ok ||
    !sameAudience(audience.audience, audienceInputOf(doc.audience));

  const save = async (): Promise<void> => {
    if (busy) return;
    if (fieldError || !audience.ok) {
      setError(fieldError);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateDocumentAction({
      id: doc.id,
      title: title.trim(),
      audience: audience.audience,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`Saved ${result.data.title}`);
    onClose();
  };

  const replace = async (file: File): Promise<void> => {
    setBusy(true);
    setError(null);
    setProgress(0);
    const uploaded = await uploadFile({
      file,
      requestTicket: () =>
        createUploadTicketAction({
          mode: 'replace',
          documentId: doc.id,
          originalName: file.name,
          size: file.size,
        }),
      onProgress: setProgress,
    });
    if (!uploaded.ok) {
      setBusy(false);
      setProgress(null);
      setError(uploaded.error.message);
      return;
    }
    const result = await replaceDocumentFileAction({ id: doc.id, file: uploaded.data });
    setBusy(false);
    setProgress(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`New version of ${doc.title} uploaded`);
  };

  const remove = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    const result = await deleteDocumentAction({ id: doc.id });
    setBusy(false);
    if (!result.ok) {
      setConfirming(false);
      setError(result.error.message);
      return;
    }
    onClose();
    toast(`Deleted ${doc.title}`);
  };
```

Edit 3 (subtitle). Before:

```tsx
      subtitle={`${doc.type}, ${doc.format}`}
```

After:

```tsx
      subtitle={`${DOCUMENT_TYPE_LABEL[doc.type]}, ${formatLabel(doc)}`}
```

Edit 4 (footer). Before:

```tsx
        confirming ? (
          <>
            <button type="button" className="btn btn-s" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button type="button" className="btn btn-dd" onClick={remove}>
              Delete document
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-d"
              onClick={() => setConfirming(true)}
              style={{ marginRight: 'auto' }}
            >
              <Icon name="trash" />
              Delete
            </button>
            <label className="btn btn-s" style={{ cursor: 'pointer' }}>
              Replace file
              <input
                type="file"
                className="sr"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  replaceDocument(doc.id);
                  toast(`New version of ${doc.title} uploaded`);
                  e.target.value = '';
                }}
              />
            </label>
            <button type="button" className="btn btn-p" onClick={onClose}>
              Done
            </button>
          </>
        )
```

After:

```tsx
        confirming ? (
          <>
            <button
              type="button"
              className="btn btn-s"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-dd"
              onClick={() => void remove()}
              disabled={busy}
            >
              Delete document
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-d"
              onClick={() => setConfirming(true)}
              style={{ marginRight: 'auto' }}
              disabled={busy}
            >
              <Icon name="trash" />
              Delete
            </button>
            <label className="btn btn-s" style={{ cursor: busy ? 'default' : 'pointer' }}>
              {progress === null ? 'Replace file' : `Uploading ${progress}%`}
              <input
                type="file"
                className="sr"
                accept={UPLOAD_ACCEPT}
                disabled={busy}
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  e.target.value = '';
                  if (picked) void replace(picked);
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-p"
              onClick={() => (changed ? void save() : onClose())}
              disabled={busy}
            >
              {changed ? 'Save changes' : 'Done'}
            </button>
          </>
        )
```

Edit 5 (details list and the two editable fields). Before:

```tsx
      <dl className="dl">
        <dt>Product</dt>
        <dd>{doc.product}</dd>
        <dt>Who can open it</dt>
        <dd>
          <Badge tone={audienceTone(doc.audience)}>{audienceLabel(doc.audience)}</Badge>
        </dd>
        <dt>Updated</dt>
        <dd>{adminUpdatedLabel(doc)}</dd>
        <dt>Opens</dt>
        <dd className="tnum">
          {doc.opens}, by people at {doc.partnerCount} partners
        </dd>
      </dl>
```

After:

```tsx
      <dl className="dl">
        <dt>Product</dt>
        <dd>{DOC_PRODUCT_LABEL[doc.product]}</dd>
        <dt>Who can open it</dt>
        <dd>
          <Badge tone={audienceTone(doc.audience.kind)}>{audienceLabel(doc.audience)}</Badge>
        </dd>
        <dt>Updated</dt>
        <dd>{adminUpdatedLabel(doc.updatedAt, today)}</dd>
        <dt>Opens</dt>
        <dd className="tnum">
          {doc.opens ?? 0}, by people at {doc.partnerCount ?? 0} partners
        </dd>
      </dl>
      <div className="fg">
        <label htmlFor="ed-title" className="lbl">
          Title
        </label>
        <input
          id="ed-title"
          className={`field${title.trim() === '' ? ' field-err' : ''}`}
          type="text"
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={title.trim() === '' ? true : undefined}
        />
      </div>
      <AudiencePicker
        idPrefix="ed"
        draft={draft}
        onChange={setDraft}
        error={audience.ok ? null : audience.error}
        disabled={busy}
      />
```

Edit 6 (the error line next to the delete confirmation). Before:

```tsx
      {confirming ? (
        <div className="note note-amber" role="alert">
          <span>Delete {doc.title}? Partners lose access at once. This cannot be undone.</span>
        </div>
      ) : null}
```

After:

```tsx
      {confirming ? (
        <div className="note note-amber" role="alert">
          <span>Delete {doc.title}? Partners lose access at once. This cannot be undone.</span>
        </div>
      ) : null}
      {error ? (
        <div className="note note-amber" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
```

- [ ] **Step 35: Convert `Documents.tsx`**

Edit 1 (imports and constants). Before:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestMaterialDialog } from '@/components/documents/RequestMaterialDialog';
import { TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { Badge, ProductChip, type Product } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import {
  canPartnerOpen,
  useDocuments,
  VIEWER_PARTNER,
  type DocType,
  type PortalDocument,
} from '@/data/documents';

const PRODUCT_FILTER: readonly (Product | 'All products')[] = [
  'All products',
  'CleanStart Images',
  'Clean Libraries',
  'CleanSight',
];
const SORTS = ['Newest first', 'Most opened', 'Name'] as const;
type Sort = (typeof SORTS)[number];
const BASE_TABS: readonly DocType[] = [
  'Video',
  'Datasheet',
  'Solution sheet',
  'Battlecard',
  'Enablement guide',
];
```

After:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestMaterialDialog } from '@/components/documents/RequestMaterialDialog';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { isFresh } from '@/components/documents/doc-view';
import { Badge, ProductChip } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { fmtLong } from '@/lib/dates';
import { DOCUMENT_TYPE_LABEL, type DocumentType, PRODUCT_LABEL, PRODUCTS } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

const ANY_PRODUCT = 'any';
const PRODUCT_FILTER = [
  { value: ANY_PRODUCT, label: 'All products' },
  ...PRODUCTS.map((p) => ({ value: p, label: PRODUCT_LABEL[p] })),
];
const SORTS = ['Newest first', 'Most opened', 'Name'] as const;
type Sort = (typeof SORTS)[number];
const BASE_TABS: readonly DocumentType[] = [
  'video',
  'datasheet',
  'solution_sheet',
  'battlecard',
  'enablement_guide',
];
```

Edit 2 (component head, state, filtering, download). Before:

```tsx
export function Documents(): React.JSX.Element {
  const toast = useToast();
  const all = useDocuments();
  const visible = useMemo(() => all.filter((d) => canPartnerOpen(d, VIEWER_PARTNER)), [all]);

  const [type, setType] = useState<DocType | 'All'>('All');
  const [q, setQ] = useState('');
  const [product, setProduct] = useState<string>('All products');
  const [sort, setSort] = useState<Sort>('Newest first');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const tabTypes: DocType[] = [
    ...BASE_TABS,
    ...(visible.some((d) => d.type === 'Price list') ? (['Price list'] as const) : []),
  ];
  const needle = q.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = visible.filter(
      (d) =>
        (type === 'All' || d.type === type) &&
        (needle === '' || d.title.toLowerCase().includes(needle)) &&
        (product === 'All products' || d.product === product),
    );
    if (sort === 'Most opened') return [...filtered].sort((a, b) => b.ownOpens - a.ownOpens);
    if (sort === 'Name') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [visible, type, needle, product, sort]);

  const viewing = viewingId ? (visible.find((d) => d.id === viewingId) ?? null) : null;
  const closeView = useCallback((): void => setViewingId(null), []);
  const closeRequest = useCallback((): void => setRequestOpen(false), []);
  const download = (d: PortalDocument): void => toast(`Downloading ${d.title}, ${d.format}`);
  const clear = (): void => {
    setType('All');
    setQ('');
    setProduct('All products');
  };
```

After:

```tsx
export function Documents({
  docs,
  today,
}: {
  docs: readonly DocumentDto[];
  today: string;
}): React.JSX.Element {
  const toast = useToast();
  // The server already limited the list to what this company's audience allows (repo/documents.ts, backed by RLS).
  const visible = docs;

  const [type, setType] = useState<DocumentType | 'All'>('All');
  const [q, setQ] = useState('');
  const [product, setProduct] = useState<string>(ANY_PRODUCT);
  const [sort, setSort] = useState<Sort>('Newest first');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const tabTypes: DocumentType[] = [
    ...BASE_TABS,
    ...(visible.some((d) => d.type === 'price_list') ? (['price_list'] as const) : []),
  ];
  const needle = q.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = visible.filter(
      (d) =>
        (type === 'All' || d.type === type) &&
        (needle === '' || d.title.toLowerCase().includes(needle)) &&
        (product === ANY_PRODUCT || d.product === product),
    );
    if (sort === 'Most opened')
      return [...filtered].sort((a, b) => (b.ownOpens ?? 0) - (a.ownOpens ?? 0));
    if (sort === 'Name') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [visible, type, needle, product, sort]);

  const viewing = viewingId ? (visible.find((d) => d.id === viewingId) ?? null) : null;
  const closeView = useCallback((): void => setViewingId(null), []);
  const closeRequest = useCallback((): void => setRequestOpen(false), []);
  const download = (d: DocumentDto): void => {
    // The route checks the audience, records the open and redirects to a 60 second signed URL.
    const link = document.createElement('a');
    link.href = `/api/files/${d.id}`;
    link.download = '';
    document.body.append(link);
    link.click();
    link.remove();
    toast(`Downloading ${d.title}, ${formatLabel(d)}`);
  };
  const clear = (): void => {
    setType('All');
    setQ('');
    setProduct(ANY_PRODUCT);
  };
```

Edit 3 (tab label). Before:

```tsx
              {t === 'All' ? 'All' : `${t}s`}
```

After:

```tsx
              {t === 'All' ? 'All' : `${DOCUMENT_TYPE_LABEL[t]}s`}
```

Edit 4 (row, part 1). Before:

```tsx
                const isVideo = d.type === 'Video';
```

After:

```tsx
                const isVideo = d.type === 'video';
```

Edit 5 (row, part 2). Before:

```tsx
                            {d.fresh ? <Badge tone="violet">New</Badge> : null}
                          </span>
                          <span className="li-s">{d.summary ?? `${d.type}, ${d.format}`}</span>
                        </span>
                      </span>
                    </td>
                    <td className="t-sec">{d.type}</td>
                    <td>
                      <ProductChip product={d.product} />
                    </td>
                    <td className="tnum r t-sec">{d.updated}</td>
```

After:

```tsx
                            {isFresh(d.updatedAt, today) ? <Badge tone="violet">New</Badge> : null}
                          </span>
                          <span className="li-s">
                            {d.summary ?? `${DOCUMENT_TYPE_LABEL[d.type]}, ${formatLabel(d)}`}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="t-sec">{DOCUMENT_TYPE_LABEL[d.type]}</td>
                    <td>
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td className="tnum r t-sec">{fmtLong(d.updatedAt)}</td>
```

Edit 6 (row, action tooltip). Before:

```tsx
                        data-tip={`${isVideo ? 'Watch' : 'Download'}, ${d.format}`}
```

After:

```tsx
                        data-tip={`${isVideo ? 'Watch' : 'Download'}, ${formatLabel(d)}`}
```

Edit 7 (an empty library is not "no match"). Before:

```tsx
          {rows.length === 0 ? (
            <div className="empty">
              No documents match these filters.{' '}
              <button
                type="button"
                className="btn btn-g"
                onClick={clear}
                style={{ height: 24, padding: '0 6px', fontSize: 12 }}
              >
                Clear filters
              </button>
            </div>
          ) : null}
```

After:

```tsx
          {visible.length === 0 ? (
            <div className="empty">No documents have been shared with your company yet.</div>
          ) : rows.length === 0 ? (
            <div className="empty">
              No documents match these filters.{' '}
              <button
                type="button"
                className="btn btn-g"
                onClick={clear}
                style={{ height: 24, padding: '0 6px', fontSize: 12 }}
              >
                Clear filters
              </button>
            </div>
          ) : null}
```

`<DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />` and `<RequestMaterialDialog open={requestOpen} onClose={closeRequest} />` stay as they are.

- [ ] **Step 36: Convert `AdminDocuments.tsx`**

Edit 1 (imports). Before:

```tsx
import { useCallback, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentEditDrawer } from '@/components/documents/DocumentEditDrawer';
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm';
import { TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { Badge, ProductChip } from '@/components/ui/badge';
import { adminUpdatedLabel, audienceLabel, audienceTone, useDocuments } from '@/data/documents';
```

After:

```tsx
import { useCallback, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentEditDrawer } from '@/components/documents/DocumentEditDrawer';
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { adminUpdatedLabel, audienceTone } from '@/components/documents/doc-view';
import { Badge, ProductChip } from '@/components/ui/badge';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import { DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { audienceLabel, formatLabel } from '@/server/files/rules';
```

Edit 2 (head). Before:

```tsx
export function AdminDocuments(): React.JSX.Element {
  const docs = useDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const closeUpload = useCallback((): void => setUploadOpen(false), []);
  const closeEdit = useCallback((): void => setEditingId(null), []);

  const opensTotal = docs.reduce((n, d) => n + d.opens, 0);
```

After:

```tsx
export function AdminDocuments({
  docs,
  partners,
  today,
}: {
  docs: readonly DocumentDto[];
  partners: readonly AudiencePartnerDto[];
  today: string;
}): React.JSX.Element {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const closeUpload = useCallback((): void => setUploadOpen(false), []);
  const closeEdit = useCallback((): void => setEditingId(null), []);

  const opensTotal = docs.reduce((n, d) => n + (d.opens ?? 0), 0);
```

Edit 3 (the upload form gets the partner list). Before:

```tsx
        {uploadOpen ? <UploadDocumentForm onClose={closeUpload} /> : null}
```

After:

```tsx
        {uploadOpen ? <UploadDocumentForm onClose={closeUpload} partners={partners} /> : null}
```

Edit 4 (type and format line). Before:

```tsx
                          <span className="li-s">
                            {d.type}, {d.format}
                          </span>
```

After:

```tsx
                          <span className="li-s">
                            {DOCUMENT_TYPE_LABEL[d.type]}, {formatLabel(d)}
                          </span>
```

Edit 5 (product, audience, updated, opens, partners cells). Before:

```tsx
                    <td>
                      <ProductChip product={d.product} />
                    </td>
                    <td>
                      <Badge tone={audienceTone(d.audience)}>{audienceLabel(d.audience)}</Badge>
                    </td>
                    <td className="tnum r t-sec">{adminUpdatedLabel(d)}</td>
                    <td className="tnum r">{d.opens}</td>
                    <td className="tnum r t-sec">{d.partnerCount}</td>
```

After:

```tsx
                    <td>
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td>
                      <Badge tone={audienceTone(d.audience.kind)}>{audienceLabel(d.audience)}</Badge>
                    </td>
                    <td className="tnum r t-sec">{adminUpdatedLabel(d.updatedAt, today)}</td>
                    <td className="tnum r">{d.opens ?? 0}</td>
                    <td className="tnum r t-sec">{d.partnerCount ?? 0}</td>
```

Edit 6 (an empty library). Before:

```tsx
            </table>
          </div>
        </section>
```

After:

```tsx
            </table>
            {docs.length === 0 ? (
              <div className="empty">No documents yet. Upload the first one.</div>
            ) : null}
          </div>
        </section>
```

Edit 7 (the drawer gets the partner list and the server date). Before:

```tsx
      {editing ? <DocumentEditDrawer key={editing.id} doc={editing} onClose={closeEdit} /> : null}
```

After:

```tsx
      {editing ? (
        <DocumentEditDrawer
          key={editing.id}
          doc={editing}
          partners={partners}
          today={today}
          onClose={closeEdit}
        />
      ) : null}
```

- [ ] **Step 37: Convert the two pages**

Replace the whole of `apps/portal/src/app/partner/documents/page.tsx`.

Before:

```tsx
import type { Metadata } from "next";
import { Documents } from "@/components/screens/Documents";

export const metadata: Metadata = { title: "Documents" };

export default function Page(): React.JSX.Element {
  return <Documents />;
}
```

After:

```tsx
import type { Metadata } from 'next';
import { Documents } from '@/components/screens/Documents';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { withViewer } from '@/server/repo/context';
import { listDocuments } from '@/server/repo/documents';

export const metadata: Metadata = { title: 'Documents' };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.read');
  const docs = await withViewer(viewer, (tx) => listDocuments(tx, viewer, {}));
  return <Documents docs={docs} today={systemClock.today()} />;
}
```

Replace the whole of `apps/portal/src/app/admin/documents/page.tsx`.

Before:

```tsx
import type { Metadata } from "next";
import { AdminDocuments } from "@/components/screens/AdminDocuments";

export const metadata: Metadata = { title: "Manage documents" };

export default function Page(): React.JSX.Element {
  return <AdminDocuments />;
}
```

After:

```tsx
import type { Metadata } from 'next';
import { AdminDocuments } from '@/components/screens/AdminDocuments';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { withViewer } from '@/server/repo/context';
import { listAudiencePartners, listDocuments } from '@/server/repo/documents';

export const metadata: Metadata = { title: 'Manage documents' };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.upload');
  const { docs, partners } = await withViewer(viewer, async (tx) => ({
    docs: await listDocuments(tx, viewer, {}),
    partners: await listAudiencePartners(tx, viewer),
  }));
  return <AdminDocuments docs={docs} partners={partners} today={systemClock.today()} />;
}
```

`requireCan` redirects a viewer who may not (for example a partner who types `/admin/documents`, or staff sales) to their own home, and a signed out visitor to `/sign-in?next=...`. The partner and admin layouts (W0-f) already enforce the kind. Loading is the parent `loading.tsx`; an exception thrown by a repo call goes to `src/app/error.tsx`.

- [ ] **Step 38: Typecheck and lint the converted screens**

Run: `pnpm --filter @cleanstart/portal typecheck && pnpm --filter @cleanstart/portal lint`
Expected: both exit 0. If typecheck reports an unused import in a converted file (`noUnusedLocals` is on), remove it; the only candidates are `Badge` and `Icon` in files whose markup no longer uses them. Biome 1.9 has no rule against an `async` handler passed as `onSubmit`; if a later Biome flags it, wrap the call in the component that owns the form (`onSubmit={(e) => void submit(e)}`) and change nothing else.

#### Part G: the bucket note, Gate A and the manual checks

- [ ] **Step 39: Write the bucket note for the operator**

Create `docs/partner-portal/R2-DOCUMENTS-BUCKET.md`:

````markdown
# Private documents bucket (R2)

The partner portal stores private partner documents in one R2 bucket that is never public. Files reach the browser only through the portal: uploads use a presigned PUT, downloads use a 60 second presigned GET issued after the portal checks the partner's audience.

## One time setup (operator, not run from the repo)

1. Create the bucket `cleanstart-partner-docs` (production) and `cleanstart-partner-docs-dev` (development and test). No public access, no custom domain, no public development URL.
2. Create an API token with object read and write on those buckets only. Put `R2_ENDPOINT` (`https://<account id>.r2.cloudflarestorage.com`), `R2_BUCKET`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in `/opt/cleanstart/portal.env` (production) or `apps/portal/.env` (development). Never commit them.
3. Set the CORS rules below on each bucket. The browser uploads with `PUT` straight to R2, so without this rule every upload fails in the browser with a CORS error.

Production bucket CORS:

```json
[
  {
    "AllowedOrigins": ["https://partners.cleanstart.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Development bucket CORS (one origin per worktree port):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3004",
      "http://localhost:3204",
      "http://localhost:3214",
      "http://localhost:3224",
      "http://localhost:3234",
      "http://localhost:3244",
      "http://localhost:3254"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Downloads are a top level navigation to a presigned URL that carries `Content-Disposition: attachment`, so they need no CORS rule.

## Keys, retention and cleanup

- Key scheme: `documents/<document id>/v<version>/<uuid>-<sanitised file name>`. A purged document's row holds `purged/<document id>` and no object.
- A replaced file stays for 30 days (`document_versions.purge_after`); a deleted document's files go 30 days after deletion. The `document-purge` job (03:20 UTC) deletes both from the database and then from R2. If an R2 delete fails the job logs the key at error level and reports to Sentry: delete that object by hand.
- Abandoned uploads (a ticket was issued, the browser uploaded, nobody confirmed) leave an unreferenced object. They are private and small in number; v1 has no sweep.
- The nightly backup does not cover this bucket. R2 durability is the plan for documents; the originals live with marketing.

## Checks after setup

1. In the portal as marketing, upload a PDF on `/admin/documents`: it appears in the table with `PDF, <size>`.
2. As a partner in the audience, download it from `/partner/documents`: the browser saves the file.
3. In DevTools the redirect target host is the R2 endpoint and the URL contains `X-Amz-Expires=60`.
4. As a partner outside the audience, open `/api/files/<id>` directly: the response is a 404 JSON body, not a redirect.
````

- [ ] **Step 40: Run Gate A**

Run from the track worktree (byte escapes stand for the em-dash and en-dash characters, so this plan stays free of them):

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
# only one `next build` runs at a time on this machine; take the lock
until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
rmdir /tmp/portal-build.lock
[ "$BUILD_STATUS" -eq 0 ]
# no em-dashes or en-dashes, and nothing outside the allowed paths
git diff feat/portal-build -- . | grep '^+' | grep -nE $'\xe2\x80\x94|\xe2\x80\x93' && exit 1
git diff --name-only feat/portal-build
```

Expected: lint, typecheck, test (including `src/server/repo/isolation.test.ts` with all 13 `documents` functions) and build exit 0; the dash grep prints nothing; the name list contains only this task's Files block, the plan file and the M3.1 files.

- [ ] **Step 41: Manual checks with seed-dev data**

Setup: `pnpm --filter @cleanstart/portal db:seed` in the track database, `lsof -nP -iTCP:3234 -sTCP:LISTEN` shows nothing, then `pnpm --filter @cleanstart/portal exec next dev --port 3234`. Sign in with the seed password (`DEV_SEED_PASSWORD`, `src/db/fixtures.ts`). Lock the browser to a 1440 by 900 viewport. Uploads and downloads need a dev R2 bucket (see `docs/partner-portal/R2-DOCUMENTS-BUCKET.md`); a person with dev keys does the lines marked (R2). Without R2 those two actions show the amber message "A connected service is not responding. Try again in a moment.", which is itself a check of the error state.

Partner library, as Kestrel's partner admin (Aditi Rao) at `/partner/documents`:
1. The header, copy and layout match the mock. The toolbar reads "10 documents": Kestrel is a channel partner, so the two price lists (named for other partners) are absent. Tab counts: All 10, Videos 2, Datasheets 3, Solution sheets 1, Battlecards 1, Enablement guides 3, and no Price lists tab.
2. Type "playbook" in the filter: one row. Product dropdown "Clean Libraries": the Clean Libraries datasheet and solution sheet only. Sort "Most opened": the partner sales playbook first (14 opens by Kestrel), then the competitive battlecard (11).
3. Click a title: the preview drawer shows Type, Product, Format, Updated (long date) and "Opened by your team: 14 times" for the playbook. A video row's drawer shows the 16:9 placeholder and, new in this build, a Download button.
4. (R2) Click the download icon on the competitive battlecard: the browser saves `<name>.pdf` and the toast reads "Downloading Competitive battlecard, PDF, 640 KB". The preview's "Opened by your team" becomes 12 after a reload.
5. Request material: submit empty (inline "Describe the material you need."), then with text. With Brevo unset the request succeeds ("Request sent to CleanStart"; the dev transport logs and skips); with the transport forced to fail the dialog shows the amber message.
6. Empty state: in the track database, `update documents set deleted_at = now()` (as the system role) hides everything and the page reads "No documents have been shared with your company yet."; restore the rows afterwards. Clear the filters with a no-match search to see "No documents match these filters."
7. Sign in as a Kestrel technical user (or change a seed user's role): `/partner/documents` is their home and works; "Deals" and "Overview" are not in the sidebar.

Staff library, as the partner manager (Farhan Qureshi) at `/admin/documents`:
8. The header reads "12 documents, opened 508 times in total. Stored only in the portal, never on cleanstart.com." The table shows each audience badge: "All partners" (neutral), "Distributors, channel" (violet, two rows), "2 partners" (Gulf price list) and "5 partners" (India price list) in the pending tone; opens and partners columns match the mock figures (for example playbook 112 and 18).
9. Click "Upload document": the form starts empty (no demo prefill), the hint reads "PDF, PPTX, DOCX, XLSX, MP4 or ZIP, up to 100 MB". Submit empty: "Give the document a title.", "Choose a file to upload." and "Pick at least one category." appear inline. Choose "Named partners", type "Kestrel Systems, Nobody Ltd": "No partner named Nobody Ltd." Type only "Kestrel Systems, Saffron Secure": no error. Choosing a `.exe` shows "Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file." (R2) Upload a real PDF with Categories "Channel": progress text "Uploading name.pdf, 42%", then the toast "Uploaded <title>", the form closes, the document is the first row with "Today" and badge "Channel", and the header count is 13.
10. (R2) Open that row: the drawer shows Opens "0, by people at 0 partners". Change the title and the audience to Everyone: the footer button reads "Save changes"; after saving, the table updates. Replace file with another PDF: the button shows "Uploading n%", then the toast "New version of <title> uploaded"; Opens is unchanged. Delete, then "Delete document" in the confirmation: the toast "Deleted <title>" and the row is gone.
11. `/admin/audit` (A's screen, if merged): the entries "Uploaded a document", "Edited a document", "Changed who can open it", "Replaced document file" and "Deleted a document" appear with the actor Farhan Qureshi.
12. Sign in as marketing (Ishita Bose): `/admin/documents` is the home page and the same screen works, including the audience picker (the partner list comes from `listAudiencePartners`). As staff sales, `/admin/documents` redirects to the sales home page.
13. As a partner, open `/admin/documents`: redirected to `/partner/overview`.

- [ ] **Step 42: Commit**

```bash
git add apps/portal/src/server/files/rules.ts apps/portal/src/server/files/rules.test.ts apps/portal/src/server/files/upload.ts apps/portal/src/server/files/upload.test.ts apps/portal/src/server/files/document-service.ts apps/portal/src/server/files/document-service.test.ts apps/portal/src/server/files/test-ctx.ts apps/portal/src/lib/document-upload.ts apps/portal/src/server/actions/documents.ts apps/portal/src/server/jobs/document-purge.ts apps/portal/src/server/jobs/document-purge.test.ts apps/portal/src/server/repo/documents.ts apps/portal/src/server/repo/documents.test.ts apps/portal/src/components/documents/doc-view.ts apps/portal/src/components/documents/doc-view.test.ts apps/portal/src/components/documents/upload-client.ts apps/portal/src/components/documents/upload-client.test.ts apps/portal/src/components/documents/AudiencePicker.tsx apps/portal/src/components/documents/doc-style.ts apps/portal/src/components/documents/DocumentPreview.tsx apps/portal/src/components/documents/DocumentEditDrawer.tsx apps/portal/src/components/documents/RequestMaterialDialog.tsx apps/portal/src/components/documents/UploadDocumentForm.tsx apps/portal/src/components/screens/Documents.tsx apps/portal/src/components/screens/AdminDocuments.tsx apps/portal/src/app/partner/documents/page.tsx apps/portal/src/app/admin/documents/page.tsx docs/partner-portal/R2-DOCUMENTS-BUCKET.md docs/superpowers/plans/2026-11-12-partner-portal-05-documents.md
git commit -m "feat(portal): M3.2 document library, audience rules, versioned upload and replace"
```

Append the `done` line to the progress log: short sha, `A ok, B <result>`, note "upload and download verified only against FakeFileStorage; manual R2 checks pending a person".

---

### Task M3.3: Public resources from the CMS

Master plan task 3.3: read the published datasheets from the CMS REST API with a server-only fetch and a 10 minute revalidate; never upload them twice. The partner Documents screen gets a read-only "Public datasheets" card that links to the public pages on cleanstart.com.

**How the website reads the same data (checked in `apps/web/src/lib/resources.ts` and `apps/cms/src/payload/collections/Resources.ts`):** the collection slug is `resources`; read access is `publishedOrAuthenticated`, so a published document is readable with no key (the portal needs no credential); a datasheet is a resource whose `typeRef.slug` is `datasheet` or, on a row not yet backfilled to the taxonomy, whose legacy `type` is `datasheet` (the website filters with an `or` of both); the published filter is `where[_status][equals]=published` plus `where[publishedAt][exists]=true`; the website's list query deliberately omits `asset` because selecting it published the direct link to gated downloads, and so does this one; a gated resource has `gated: true` (`accessLevel` only matters when gated); the public detail route is `/resources/<slug>`. The portal reaches the CMS over `CMS_API_URL` (default `http://cms:3000`, contracts I).

**Files:**
- Create: `apps/portal/src/server/files/public-resources.ts`
- Modify: `apps/portal/src/components/screens/Documents.tsx`
- Modify: `apps/portal/src/app/partner/documents/page.tsx`
- Test: `apps/portal/src/server/files/public-resources.test.ts` (runs against a local stub HTTP server)

**Gate A (this task):** the standard block in the last step of this task, plus the manual list. **Gate B:** an independent reviewer with the handoff checklist, extra attention to: no `asset` or `body` in the query, gated rows dropped in code (not only in the query), no CMS credential needed or logged, the fetch has a timeout and a failure degrades to "no card", never a broken page.

- [ ] **Step 1: Write the failing test**

Create `apps/portal/src/server/files/public-resources.test.ts`:

```ts
import { createServer, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@/server/errors';
import { listPublicDatasheets, PUBLIC_RESOURCES_REVALIDATE_SECONDS, PUBLIC_SITE_URL } from './public-resources';

let server: Server;
let baseUrl = '';
let requests: string[] = [];
let respond: (res: ServerResponse) => void = (res) => res.end('{}');

beforeAll(async () => {
  server = createServer((req, res) => {
    requests.push(req.url ?? '');
    respond(res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  requests = [];
});

const json =
  (body: unknown, status = 200) =>
  (res: ServerResponse): void => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  };

describe('listPublicDatasheets', () => {
  it('asks the CMS for published datasheets with the website field list, and never for asset or body', async () => {
    respond = json({ docs: [] });
    await listPublicDatasheets({ baseUrl });
    const url = new URL(requests[0] ?? '', baseUrl);
    expect(url.pathname).toBe('/api/resources');
    const params = url.searchParams;
    expect(params.get('where[_status][equals]')).toBe('published');
    expect(params.get('where[publishedAt][exists]')).toBe('true');
    expect(params.get('where[or][0][typeRef.slug][equals]')).toBe('datasheet');
    expect(params.get('where[or][1][type][equals]')).toBe('datasheet');
    expect(params.get('depth')).toBe('0');
    expect(params.get('limit')).toBe('100');
    expect(params.get('sort')).toBe('-publishedAt');
    expect([...params.keys()].filter((key) => key.startsWith('select['))).toEqual([
      'select[title]',
      'select[slug]',
      'select[summary]',
      'select[publishedAt]',
      'select[updatedAt]',
      'select[gated]',
    ]);
  });

  it('maps rows to public page links and drops gated, malformed and untitled rows', async () => {
    respond = json({
      docs: [
        { id: 7, title: 'CleanStart Images datasheet', slug: 'cleanstart-images-datasheet', summary: 'Catalogue', updatedAt: '2026-10-14T00:00:00.000Z', gated: false },
        { id: 'abc', title: 'No summary', slug: 'no summary', gated: null },
        { id: 9, title: 'Gated sheet', slug: 'gated-sheet', gated: true },
        { id: 10, title: '', slug: 'empty-title' },
        { id: 11, slug: 'missing-title' },
        'garbage',
      ],
    });
    expect(await listPublicDatasheets({ baseUrl })).toEqual([
      {
        id: '7',
        title: 'CleanStart Images datasheet',
        summary: 'Catalogue',
        url: `${PUBLIC_SITE_URL}/resources/cleanstart-images-datasheet`,
        updatedAt: '2026-10-14T00:00:00.000Z',
      },
      { id: 'abc', title: 'No summary', summary: null, url: `${PUBLIC_SITE_URL}/resources/no%20summary`, updatedAt: null },
    ]);
  });

  it('returns an empty list when the CMS has none, and accepts a trailing slash on the base URL', async () => {
    respond = json({ docs: [] });
    expect(await listPublicDatasheets({ baseUrl: `${baseUrl}/` })).toEqual([]);
    expect(requests[0]?.startsWith('/api/resources?')).toBe(true);
  });

  it('throws IntegrationError carrying the upstream status on a non 2xx answer', async () => {
    respond = json({ errors: [] }, 503);
    await expect(listPublicDatasheets({ baseUrl })).rejects.toMatchObject({ service: 'cms', upstreamStatus: 503 });
  });

  it('throws IntegrationError for a body that is not the expected JSON', async () => {
    respond = (res) => res.end('<html>maintenance</html>');
    await expect(listPublicDatasheets({ baseUrl })).rejects.toBeInstanceOf(IntegrationError);
    respond = json({ docs: 'nope' });
    await expect(listPublicDatasheets({ baseUrl })).rejects.toBeInstanceOf(IntegrationError);
  });

  it('throws IntegrationError when the CMS cannot be reached', async () => {
    await expect(listPublicDatasheets({ baseUrl: 'http://127.0.0.1:1' })).rejects.toBeInstanceOf(IntegrationError);
  });

  it('asks Next to cache the answer for 10 minutes and sends no credential', async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify({ docs: [] }), { status: 200 }));
    await listPublicDatasheets({ baseUrl: 'http://cms.test', fetchImpl: spy as unknown as typeof fetch });
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate: number } }];
    expect(url.startsWith('http://cms.test/api/resources?')).toBe(true);
    expect(init.next).toEqual({ revalidate: PUBLIC_RESOURCES_REVALIDATE_SECONDS });
    expect(PUBLIC_RESOURCES_REVALIDATE_SECONDS).toBe(600);
    expect(init.headers).toEqual({ accept: 'application/json' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/public-resources.test.ts`
Expected: FAIL with `Failed to resolve import "./public-resources"`.

- [ ] **Step 3: Create `public-resources.ts`**

Create `apps/portal/src/server/files/public-resources.ts`. It is imported only by Server Components (the partner Documents page); it reads `@/env`, so it must never be imported by a client component, and the only thing a client component may import from it is the `PublicDatasheetDto` type.

```ts
import { z } from 'zod';
import { env } from '@/env';
import { IntegrationError } from '@/server/errors';

/** The public website. A datasheet row links to its resource page here. */
export const PUBLIC_SITE_URL = 'https://www.cleanstart.com';
/** Next data cache window for the CMS read (master plan 3.3: 10 minutes). */
export const PUBLIC_RESOURCES_REVALIDATE_SECONDS = 600;
const PAGE_LIMIT = 100;
const REQUEST_TIMEOUT_MS = 5000;

export interface PublicDatasheetDto {
  id: string;
  title: string;
  summary: string | null;
  /** The public page on cleanstart.com. The file itself is never linked from the portal. */
  url: string;
  updatedAt: string | null;
}

const rowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  updatedAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  gated: z.boolean().nullish(),
});

const pageSchema = z.object({ docs: z.array(z.unknown()) });

/**
 * The query the website uses for a published list, with the datasheet type filter (taxonomy term or legacy enum) and a
 * field whitelist. `asset` and `body` are deliberately absent: `asset` is the direct file link of a gated download.
 */
function datasheetParams(): URLSearchParams {
  const params = new URLSearchParams({
    'where[_status][equals]': 'published',
    'where[publishedAt][exists]': 'true',
    'where[or][0][typeRef.slug][equals]': 'datasheet',
    'where[or][1][type][equals]': 'datasheet',
    depth: '0',
    limit: String(PAGE_LIMIT),
    sort: '-publishedAt',
  });
  for (const field of ['title', 'slug', 'summary', 'publishedAt', 'updatedAt', 'gated']) {
    params.set(`select[${field}]`, 'true');
  }
  return params;
}

export interface ListPublicDatasheetsOptions {
  /** Defaults to CMS_API_URL. Tests pass a stub server. */
  baseUrl?: string;
  /** Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Published, public (not gated) datasheets, newest first, at most 100. Throws IntegrationError('cms') on a network error,
 * a non 2xx answer or a body that is not the expected shape; rows that fail validation are skipped.
 */
export async function listPublicDatasheets(options: ListPublicDatasheetsOptions = {}): Promise<PublicDatasheetDto[]> {
  const baseUrl = (options.baseUrl ?? env.CMS_API_URL).replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;
  const init: RequestInit & { next: { revalidate: number } } = {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: PUBLIC_RESOURCES_REVALIDATE_SECONDS },
  };

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/api/resources?${datasheetParams().toString()}`, init);
  } catch (cause) {
    throw new IntegrationError('cms', 'resources request failed', { cause });
  }
  if (!response.ok) {
    throw new IntegrationError('cms', `resources request answered ${response.status}`, { status: response.status });
  }

  let page: z.infer<typeof pageSchema>;
  try {
    page = pageSchema.parse(await response.json());
  } catch (cause) {
    throw new IntegrationError('cms', 'resources answer is not the expected JSON', { cause });
  }

  return page.docs.flatMap((raw) => {
    const row = rowSchema.safeParse(raw);
    if (!row.success || row.data.gated === true) return [];
    return [
      {
        id: row.data.id,
        title: row.data.title,
        summary: row.data.summary,
        url: `${PUBLIC_SITE_URL}/resources/${encodeURIComponent(row.data.slug)}`,
        updatedAt: row.data.updatedAt,
      },
    ];
  });
}
```

- [ ] **Step 4: Run the test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/files/public-resources.test.ts`
Expected: PASS, 7 tests. If the `connection refused` case is slow or hangs on a machine that has something listening on port 1, change the unreachable URL in that one test to a port you know is closed.

- [ ] **Step 5: Add the card to `Documents.tsx`**

Edit 1 (a new import). Before:

```tsx
import { formatLabel } from '@/server/files/rules';

const ANY_PRODUCT = 'any';
```

After:

```tsx
import type { PublicDatasheetDto } from '@/server/files/public-resources';
import { formatLabel } from '@/server/files/rules';

const ANY_PRODUCT = 'any';
```

Edit 2 (the new prop). Before:

```tsx
export function Documents({
  docs,
  today,
}: {
  docs: readonly DocumentDto[];
  today: string;
}): React.JSX.Element {
```

After:

```tsx
export function Documents({
  docs,
  publicDatasheets,
  today,
}: {
  docs: readonly DocumentDto[];
  publicDatasheets: readonly PublicDatasheetDto[];
  today: string;
}): React.JSX.Element {
```

Edit 3 (the card, after the library and before the preview). Before:

```tsx
      </section>

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />
```

After:

```tsx
      </section>

      {publicDatasheets.length > 0 ? (
        <section aria-labelledby="pub" className="card clip">
          <div className="card-h">
            <h2 id="pub" className="card-t">
              Public datasheets
            </h2>
            <span className="card-meta">On cleanstart.com, no sign-in needed</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" className="r">
                    Updated
                  </th>
                  <th scope="col" className="r">
                    <span className="sr">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {publicDatasheets.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'normal', minWidth: 320 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="li-ic tone-blue">
                          <Icon name="file" />
                        </span>
                        <span className="li-t">
                          <a
                            className="linkbtn li-n"
                            style={{ fontSize: 13 }}
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {d.title}
                          </a>
                          {d.summary ? <span className="li-s">{d.summary}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td className="tnum r t-sec">{d.updatedAt ? fmtLong(d.updatedAt) : ''}</td>
                    <td className="r">
                      <a
                        className="btn btn-s"
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open on cleanstart.com
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />
```

- [ ] **Step 6: Load the datasheets in the partner page**

Replace the whole of `apps/portal/src/app/partner/documents/page.tsx` with the M3.2 version plus the CMS read. A CMS outage or an unconfigured `CMS_API_URL` must not break the page, so the read degrades to "no card" and logs a warning.

```tsx
import type { Metadata } from 'next';
import { Documents } from '@/components/screens/Documents';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listPublicDatasheets, type PublicDatasheetDto } from '@/server/files/public-resources';
import { log } from '@/server/log';
import { withViewer } from '@/server/repo/context';
import { listDocuments } from '@/server/repo/documents';

export const metadata: Metadata = { title: 'Documents' };

const loadDatasheets = async (): Promise<PublicDatasheetDto[]> => {
  try {
    return await listPublicDatasheets();
  } catch (error) {
    log.warn({ err: error }, 'public datasheets unavailable, the card is hidden');
    return [];
  }
};

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.read');
  const [docs, publicDatasheets] = await Promise.all([
    withViewer(viewer, (tx) => listDocuments(tx, viewer, {})),
    loadDatasheets(),
  ]);
  return <Documents docs={docs} publicDatasheets={publicDatasheets} today={systemClock.today()} />;
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm --filter @cleanstart/portal typecheck && pnpm --filter @cleanstart/portal lint`
Expected: both exit 0 (the page now passes the `publicDatasheets` prop that Step 5 added).

- [ ] **Step 8: Run Gate A**

Run from the track worktree (byte escapes stand for the em-dash and en-dash characters, so this plan stays free of them):

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
# only one `next build` runs at a time on this machine; take the lock
until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
rmdir /tmp/portal-build.lock
[ "$BUILD_STATUS" -eq 0 ]
# no em-dashes or en-dashes, and nothing outside the allowed paths
git diff feat/portal-build -- . | grep '^+' | grep -nE $'\xe2\x80\x94|\xe2\x80\x93' && exit 1
git diff --name-only feat/portal-build
```

Expected: all exit 0; the dash grep prints nothing; the name list is limited to the paths in this task's Files block and the plan file.

- [ ] **Step 9: Manual check with a local stub of the CMS (no CMS service user or production access needed)**

1. Start a stub that answers like the CMS: `node -e "require('http').createServer((q,r)=>{r.setHeader('content-type','application/json');r.end(JSON.stringify({docs:[{id:1,title:'CleanStart Images datasheet',slug:'cleanstart-images-datasheet',summary:'Catalogue and update cadence',updatedAt:'2026-10-14T00:00:00.000Z',gated:false},{id:2,title:'Gated whitepaper',slug:'gated-whitepaper',gated:true}]}))}).listen(3999)"` (check `lsof -nP -iTCP:3999 -sTCP:LISTEN` is empty first), and set `CMS_API_URL=http://localhost:3999` in `apps/portal/.env`, then restart `next dev --port 3234` (the environment is read once at start).
2. As Kestrel's partner admin at `/partner/documents`: below the library a "Public datasheets" card appears with one row, "CleanStart Images datasheet", summary "Catalogue and update cadence", Updated "14 Oct 2026". The gated row is absent. The link and the "Open on cleanstart.com" button both go to `https://www.cleanstart.com/resources/cleanstart-images-datasheet` in a new tab.
3. The stub's console shows one request, whose query string contains `select%5Btitle%5D=true` and no `select%5Basset%5D`.
4. Reload within 10 minutes: the stub logs no second request (the Next data cache holds the answer for 600 seconds).
5. Stop the stub, stop the dev server, delete `apps/portal/.next/dev/cache/fetch-cache` (that is the Next 16 dev fetch cache path; clearing `.next/cache` does nothing), start the dev server again and reload: the card is gone, the rest of the page works, and the dev server log has one line `public datasheets unavailable, the card is hidden`.
6. Restore `CMS_API_URL` in `.env` to what the worktree had before.

- [ ] **Step 10: Commit**

```bash
git add apps/portal/src/server/files/public-resources.ts apps/portal/src/server/files/public-resources.test.ts apps/portal/src/components/screens/Documents.tsx apps/portal/src/app/partner/documents/page.tsx docs/superpowers/plans/2026-11-12-partner-portal-05-documents.md
git commit -m "feat(portal): M3.3 public datasheets from the CMS on the partner documents screen"
```

Append the `done` line to the progress log with the short sha and `A ok, B <result>`; note "tested against a local stub, not against a real CMS service user". Then tell the orchestrator track D is complete: M3.1, M3.2 and M3.3 are merged-ready.

---

## Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| 1 | Accept | Glob widened in BUILD-HANDOFF. |
| 2 | Reject | v1: videos download. Contracts M.3 item 35. |
| 3 | Reject | Not needed for launch. M.3 item 35. |
| 4 | Reject | A constant is enough until a staging site exists. M.3 item 35. |
| 5 | Reject | Tombstones keep the open history. M.3 item 35. |
| 6 | Accept | `src/lib/document-upload.ts` in contracts K.2. |
| 7 | Accept | Plan 06 M5.4 deletes `src/data/documents.ts` with the other seed modules. |

The "additions inside D-owned files" paragraph below is accepted: the extra exports are registered in contracts H.11 and listed in H.14.

None of these blocks a task in this plan; each is either a shared file the track may not edit or an extension the orchestrator may decide to fold into `00-contracts.md`. This plan does not code against any of them.

1. **Allowed paths for plan files.** BUILD-HANDOFF lists `docs/superpowers/plans/2026-11-11-partner-portal-*.md` as editable (to tick steps) and the area plans are named `2026-11-12-partner-portal-*.md`. Widen the glob to `2026-11-1*-partner-portal-*.md`, or each task's commit would stage a path outside the allowed list.
2. **Inline video playback.** `FileStorage.presignGet` forces `attachment`. To let the preview drawer play an MP4, add an optional `inline?: boolean` to `presignGet`, let `/api/files/[id]` accept `?inline=1` for `video/mp4` only and ask for a 900 second URL (a seek after 60 seconds needs a longer one). Until then videos are downloaded and `DocumentPreview` shows Download for videos.
3. **Sweep of abandoned uploads.** Add `list(prefix: string): Promise<Array<{ key: string; size: number; lastModified: Date }>>` to `FileStorage` so a later job can delete objects under `documents/` that no `documents` or `document_versions` row references and that are older than 24 hours. Not needed for launch.
4. **Public site base URL.** `PUBLIC_SITE_URL` is a constant in `src/server/files/public-resources.ts`. If a staging site ever exists, make it an optional env variable `PUBLIC_SITE_URL` in `src/env.ts` (default `https://www.cleanstart.com`) and read it there.
5. **Hard delete of documents (optional).** `portal_app` has no DELETE on `documents` and `document_opens` (C.3), so the purge job tombstones (`file_key = 'purged/<id>'`) instead of deleting rows. If the product owner wants rows gone, add `GRANT DELETE ON documents, document_opens TO portal_app`, a `documents_delete` policy for system, and let `purgeExpiredFiles` delete after the version rows. The open history would then be lost with the document.
6. **Client safe document types.** `AudienceInput`, `AudiencePartnerDto`, `UploadTicketDto` and `UploadedFileRef` live in `src/lib/document-upload.ts`, not in `src/lib/dto.ts` (W0-b owns that file). Move them if the orchestrator prefers one DTO file.
7. **Dead mock module.** After M3.2 nothing imports `src/data/documents.ts`. Delete it in M5.4 together with the other seed modules (ORCH).

Additions inside D-owned files, listed so the next reader finds them: `repo/documents.ts` exports `listDocumentRecipients`, `listAudiencePartners` and `listMaterialRequestRecipients` beyond the ten functions of contracts H.11, each in the isolation registry; `rules.ts` exports `UPLOAD_ACCEPT`, `PURGED_KEY_PREFIX`, `OLD_KEY_RETENTION_DAYS`, `DELETED_DOCUMENT_RETENTION_DAYS`, `extensionOf`, `mimeForFileName`, `cleanOriginalName`, `sanitiseFileName`, `parseDocumentKey` and `audienceLabel` beyond the six of H.14; `verifyUpload` takes an optional third argument `{ fetchImpl }`; `FakeFileStorage.simulateUpload` takes an optional fourth argument (the object's first bytes) and `presigned` entries for `get` carry `filename`. No other area calls any of these.

## Known unknowns

*Consolidated, de-duplicated and ordered by first verifying task in contracts M.5 (integration review, 13 November 2026); this list stays as the local detail.*

Each is verified by the step named, with a fallback; if the fallback also fails the task is `blocked`.

1. **Real R2 end to end (M3.1 Step 24, M3.2 Step 41, lines marked R2).** Verified offline: the presigned PUT shape (signed headers `content-length;content-type;host`, no checksum parameters) and the presigned GET shape. Not verifiable without keys: that R2 accepts the PUT from a browser with the bucket CORS in `docs/partner-portal/R2-DOCUMENTS-BUCKET.md`, that `HEAD` returns the `Content-Type` sent on the PUT unchanged, and that a presigned GET honours `Range: bytes=0-15`. A person with a dev bucket runs the R2 lines. Fallbacks: if `HEAD` normalises the content type, compare after lower casing and stripping parameters (already done) and, if R2 changes the value, drop the content type comparison and rely on the magic bytes; if the ranged read answers 200 with the whole body, `readPrefix` already cancels after 16 bytes; if it answers 403 or the byte read fails in some other way, read the first bytes through a new `FileStorage.readHead(key, length)` that uses `GetObjectCommand` with a `Range` (contract change).
2. **`revalidatePath` after a multi step client flow (contracts M.1 item 8).** The upload forms rely on the final server action's `revalidatePath` refreshing the page so the new row appears with no `router.refresh()`. Verified by M3.2 manual lines 9 and 10. Fallback: call `useRouter().refresh()` in `UploadDocumentForm` and `DocumentEditDrawer` after a successful action.
3. **Drizzle details in `repo/documents.ts`.** `.for('update')` on a select, the constant join `innerJoin(documents, eq(documents.id, id))`, and `count(*) filter (where ...)` inside `select`. Verified by M3.2 Step 8. Fallbacks are written in that step.
4. **W0 helper behaviour this plan assumes.** `makeDocument` fills `fileKey` uniquely and `fileSize`, `mime`, `originalName` when omitted; `makeUser` with `kind: 'staff'` creates the `staff_scopes` row; `FakeEmailTransport.to()` matches case insensitively; the `buildDocumentMaterialRequest` and `buildNewDocumentNotice` templates put the partner name and title in the subject or body and escape free text; `rateLimit` allows exactly `limit` calls per window and throws on the next. A failing assertion that traces to one of these is fixed in the test, not in the helper.
5. **Seed expectations.** The manual figures (12 documents, 508 opens, Kestrel's 10 visible documents and per document own opens) assume contracts J.5 generates `document_opens` that reproduce the mock's `opens`, `partnerCount` and Kestrel's `ownOpens`. If the seed differs, check the mock figures in `apps/portal/src/data/documents.ts` against `src/db/fixtures.ts` and report the seed as the defect.
6. **No streaming of videos in v1** (decision 9, contract change request 2).
7. **Abandoned uploads** leave unreferenced private objects (decision 4, contract change request 3). Nothing deletes them.
8. **A failed R2 delete in the purge job** leaves an orphan whose key is only in the log and in Sentry (`purgeDocumentFiles` documents this).
9. **Material requests with no recipient** are logged at error level and reported to the partner as sent; nothing is stored (`handleRequestMaterial` documents this). Resolved properly by an email outbox, which contracts decision 15 rejects for v1.
10. **Open recording is not de-duplicated.** Two clicks within a second record two opens. If counts look inflated in the pilot, ignore a repeat by the same user for the same document within 60 seconds inside `recordDocumentOpen`.
11. **Fan out of `document_new` notifications** is one insert of one row per active partner user (a few hundred at most). Fine for v1.

## Self-review

**Master plan coverage.**

| Master task | Plan task | Where |
|---|---|---|
| 3.1 Private storage: presigned PUT for upload, presigned GET with 60 second expiry, file route, non-audience partner gets 404 not 403 | M3.1 | `storage.ts`, `r2.ts` (PUT 600 s, GET 60 s), `open-route.ts` and `route.ts`, tests `documents.open.test.ts` and `open-route.test.ts` (404 body identical for non-audience, unknown and malformed ids) |
| 3.2 `rules.ts` with `canPartnerOpen` moved from the mock | M3.2 Part A | `rules.ts`; `documents.test.ts` "the three audience implementations agree" runs it against the repo filter and RLS |
| 3.2 `repo/documents.ts`, replace creates version n+1 and keeps the old key 30 days | M3.2 Part B | `replaceDocumentFile` writes `document_versions` with `purge_after = now + 30 days`; `purgeExpiredFiles` and `jobs/document-purge.ts` delete expired keys (Part D) |
| 3.2 Upload limits: 100 MB, allow list pdf pptx docx xlsx mp4 zip | M3.2 Parts A and C | `DOCUMENT_MAX_BYTES`, `ALLOWED_DOCUMENT_TYPES`, `assertUploadAllowed`, extension plus content type plus magic bytes in `verifyUpload`; keys never derived from raw names (`sanitiseFileName`, `documentKey`) |
| 3.2 Open events feed the "opened by" counts | M3.2 Part B | `recordDocumentOpen`, `hydrate` (`opens`, `partnerCount`, `ownOpens`) |
| 3.2 `Documents.tsx` and `AdminDocuments.tsx` conversion, plus `UploadDocumentForm`, `DocumentEditDrawer`, `DocumentPreview`, `RequestMaterialDialog` | M3.2 Part F | Steps 29 to 37, every changed region as Before and After, two pages shown in full |
| Request material conversion, email | M3.2 Part D | `handleRequestMaterial` calls W0-g's `buildDocumentMaterialRequest` (the contracts assign all 21 builders to W0-g, H.15 and K.2, so Track D writes no builder, which differs from the brief's wording) |
| 3.3 Public resources from the CMS REST API, server-only fetch, 10 minute revalidate, never uploaded twice | M3.3 | `public-resources.ts`, test against a local stub server, card on the partner screen |

**Concrete limits and rules from the brief.** 100 MB and the six types (rules and upload tests); extension and magic bytes verified (`verifyUpload`); keys never from a user's raw file name (key scheme test with `../Secret plan.pdf`); replace keeps the old key 30 days and the retention job body is `runDocumentPurge`, name and signature from contracts H.17; a non-audience partner gets 404 (route test); real R2 is never called in tests (the adapter is tested with the real SDK signing offline and a spied `send`, everything else with `FakeFileStorage`); shared files are not edited (all needs are in "Contract change requests"); no new `ConflictError` reason was invented (a reused upload is a `ValidationError`, an empty file reuses `file_missing`).

**Placeholder scan.** A search of this file for the usual markers of unfinished work (to-be-decided notes, "similar to Task N", "add appropriate handling", "write tests for the above", "implement later") finds none. Every code step has complete code; every run step has the exact command and expected result; the three Gate A blocks are repeated in full; the one conditional instruction in M3.2 Step 8 names its fallback code. The library behaviours that could not be verified are in "Known unknowns" with fallbacks.

**What was executed while writing this plan (so the next reader knows how far the code is trusted).** Every TypeScript block that is a file (every new source and test file, plus the seven converted components and screens produced by applying the Before and After edits to the mock, and the two pages) was type checked under the portal's real compiler options (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`, TypeScript 5.9) against the contracts' own `schema.ts`, `domain.ts`, `dto.ts`, `errors.ts`, `policies.ts`, `context.ts`, `audit` and `isolation.registry.ts` copied verbatim, with Drizzle 0.45.2, Zod 3.25 and the AWS SDK 3.1042 from the repo. The 37 "Before" blocks were matched byte for byte against the mock. All 138 tests in the plan passed against a scratch Postgres 16 built from the contracts' schema (through `drizzle-kit generate`) and `rls.sql`, with the portal's two role split, and a copy of the central isolation test passed for all 13 `documents` functions. Biome 1.9 with the repo and portal rules reports no findings. The scratch database and roles were dropped afterwards. The W0 helpers (`makeDocument`, `makeUser`, `viewerFor`, `asStaff`, `FakeEmailTransport`, the email templates, `rateLimit`, `notifyUsers`) were stand ins written from the contracts' signatures, so a behavioural difference in the real Wave 0 versions can still surface in this track's tests (Known unknowns 4).

**Name consistency with the contracts (checked line by line against sections C, D, E, F, H, J, L).** Tables and columns: `documents` (`audience_kind` values `all`, `categories`, `named`; `audience_categories`; `file_key`, `file_size`, `mime`, `original_name`, `duration_minutes`, `version`, `uploaded_by`, `deleted_at`), `document_audience`, `document_versions` (`purge_after`, `replaced_by`), `document_opens`. DTOs: `DocumentDto`, `DocumentListItemDto`, `DocumentAudienceDto`, `DocumentOpenTarget`, as in H.0. Repo: the ten H.11 functions with the H.11 signatures, `NewDocumentInput` and `UploadedFile` exported from `repo/documents.ts`. Files: `FileStorage`, `PresignedPut`, `createFileStorage`, `DOCUMENT_MAX_BYTES`, `ALLOWED_DOCUMENT_TYPES`, `AudienceView`, `canPartnerOpen`, `formatLabel`, `documentKey`, `assertUploadAllowed`, `createUploadTicket`, `verifyUpload`, `FakeFileStorage` (J.4). Actions: the six names of H.20 (`createUploadTicketAction`, `createDocumentAction`, `replaceDocumentFileAction`, `updateDocumentAction`, `deleteDocumentAction`, `requestMaterialAction`), each `export async function` calling `runViewerAction` (F.7, M.1 item 9). Actions strings: `document.read`, `document.upload`, `document.replace`, `document.edit`, `document.delete`, `document.request_material`. Audit events: `document.uploaded`, `document.replaced`, `document.edited`, `document.audience_changed`, `document.deleted`. Notification kind `document_new`. Job: `document-purge` and `runDocumentPurge`. Route: `/api/files/[id]`, `/partner/documents`, `/admin/documents` with the guards of section L. Helpers: `makePartner`, `makeUser`, `makeDocument`, `viewerFor`, `asStaff`, `testDb`, `resetDb`, `FakeEmailTransport`, `fixedClock`, `systemClock`.

**Things a reviewer should look at first.** The three audience implementations (`audienceAllows` in the repo, `canPartnerOpen`, the RLS policy) are pinned together by one parametrised test; the confirm path never deletes an object; the tombstone approach in the purge job (decision 5); the client import of `@/server/files/rules` (pure, client safe by construction: it imports only `@/lib/domain` and `@/server/errors`).
