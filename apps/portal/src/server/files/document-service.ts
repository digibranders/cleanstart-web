import { z } from 'zod';
import { env } from '@/env';
import type { UploadTicketDto } from '@/lib/document-upload';
import {
  DOC_PRODUCT_LABEL,
  DOC_PRODUCTS,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  MATERIAL_REQUEST_STATUS_LABEL,
  MATERIAL_REQUEST_STATUSES,
  PARTNER_CATEGORIES,
} from '@/lib/domain';
import type { DocumentDto, DocumentEngagementDto, DocumentVersionDto, MaterialRequestDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import type { ActionContext } from '@/server/actions/run';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import type { EmailAddress, EmailTransport } from '@/server/email/transport';
import { sendEmail } from '@/server/email/send';
import { buildDocumentMaterialRequest, buildNewDocumentNotice } from '@/server/email/templates';
import { ForbiddenError } from '@/server/errors';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { type Tx, withSystem, withViewer } from '@/server/repo/context';
import { getDocumentEngagement } from '@/server/repo/document-engagement';
import { listDocumentVersions, restoreDocumentVersion } from '@/server/repo/document-versions';
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocumentRecipients,
  listMaterialRequestRecipients,
  replaceDocumentFile,
  updateDocument,
} from '@/server/repo/documents';
import { createMaterialRequest, updateMaterialRequest } from '@/server/repo/material-requests';
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

/** A calendar date, YYYY-MM-DD. The document is hidden from partners from the start of that day (UTC). */
const expiryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter the date as year, month and day.')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), 'Enter a real date.');
const toExpiry = (value: string | null | undefined): Date | null | undefined =>
  value === undefined || value === null ? value : new Date(`${value}T00:00:00Z`);

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
  status: z.enum(DOCUMENT_STATUSES).default('published'),
  expiresOn: expiryDateSchema.nullish().transform((value) => value ?? null),
});

export const replaceDocumentSchema = z.object({
  id: uuid,
  file: fileRefSchema,
  changeNote: z
    .string()
    .trim()
    .max(300)
    .nullish()
    .transform((value) => (value ? value : null)),
});

export const restoreDocumentVersionSchema = z.object({ id: uuid, version: z.number().int().min(1) });
export const documentDetailSchema = z.object({ id: uuid });

export const updateDocumentSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1, 'Give the document a title.').max(160).optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
  product: z.enum(DOC_PRODUCTS).optional(),
  summary: z.string().trim().max(300).nullable().optional(),
  audience: audienceSchema.optional(),
  status: z.enum(DOCUMENT_STATUSES).optional(),
  /** undefined keeps it, null clears it. */
  expiresOn: expiryDateSchema.nullable().optional(),
});

export const deleteDocumentSchema = z.object({ id: uuid });

export const requestMaterialSchema = z.object({
  /** Short title for the request list. Left out, it is the first line of the request. */
  subject: z.string().trim().max(120).optional(),
  request: z.string().trim().min(1, 'Describe the material you need.').max(2000),
  product: z.enum(DOC_PRODUCTS),
});

export const updateMaterialRequestSchema = z.object({
  id: uuid,
  status: z.enum(MATERIAL_REQUEST_STATUSES).optional(),
  responseNote: z.string().trim().max(1000).nullable().optional(),
  documentId: uuid.nullable().optional(),
  assignedTo: uuid.nullable().optional(),
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

/** In-app notifications for a document partners can now see. Call inside the writing transaction. */
async function announceDocument(
  tx: Tx,
  viewer: ActionContext['viewer'],
  doc: DocumentDto,
): Promise<NewNotification[]> {
  const recipients = await listDocumentRecipients(tx, viewer, { id: doc.id });
  const items = recipients.map((userId) => ({
    userId,
    kind: 'document_new' as const,
    title: `New document: ${doc.title}`,
    body: `${DOCUMENT_TYPE_LABEL[doc.type]}, ${DOC_PRODUCT_LABEL[doc.product]}`,
    link: ROUTES.partner.documents,
  }));
  await notifyUsers(tx, items);
  return items;
}

/** Emails for the notifications above, after commit. Respects each person's Documents switch. */
function emailAnnouncement(ctx: ActionContext, items: readonly NewNotification[], doc: DocumentDto, deps: { transport?: EmailTransport }): void {
  ctx.afterCommit(async () => {
    for (const to of await resolveEmailRecipients(items)) {
      await sendEmail(
        buildNewDocumentNotice({
          to: { email: to.email, name: to.name },
          recipientName: to.name,
          title: doc.title,
          typeLabel: DOCUMENT_TYPE_LABEL[doc.type],
          productLabel: DOC_PRODUCT_LABEL[doc.product],
          libraryUrl: absoluteUrl(ROUTES.partner.documents),
        }),
        deps.transport,
      );
    }
  });
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
        status: input.status,
        expiresAt: toExpiry(input.expiresOn) ?? null,
      },
      ctx.clock,
    );
    await recordAudit(tx, ctx.viewer, {
      event: 'document.uploaded',
      target: doc.title,
      note: `${DOCUMENT_TYPE_LABEL[doc.type]}, ${DOC_PRODUCT_LABEL[doc.product]}, open to ${audienceLabel(doc.audience)}${doc.status === 'draft' ? ', saved as a draft' : ''}`,
      subject: { type: 'document', id: doc.id },
    });
    // A draft is staff only: nobody is told until it is published.
    const items = doc.status === 'published' ? await announceDocument(tx, ctx.viewer, doc) : [];
    return { doc, items };
  });

  revalidateLibraries(ctx);
  emailAnnouncement(ctx, result.items, result.doc, deps);
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
    const out = await replaceDocumentFile(tx, ctx.viewer, { id: input.id, file, changeNote: input.changeNote }, ctx.clock);
    await recordAudit(tx, ctx.viewer, {
      event: 'document.replaced',
      target: out.document.title,
      note: `Version ${out.document.version} uploaded, link and open count kept${input.changeNote ? `. ${input.changeNote}` : ''}`,
      subject: { type: 'document', id: out.document.id },
    });
    return out.document;
  });
  revalidateLibraries(ctx);
  return replaced;
}

export async function handleUpdateDocument(
  ctx: ActionContext,
  input: z.output<typeof updateDocumentSchema>,
  deps: { transport?: EmailTransport } = {},
): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.edit');
  const patch = {
    id: input.id,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.product !== undefined ? { product: input.product } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.audience !== undefined ? { audience: input.audience } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.expiresOn !== undefined ? { expiresAt: toExpiry(input.expiresOn) ?? null } : {}),
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
    if (out.changed.includes('expiry')) {
      await recordAudit(tx, ctx.viewer, {
        event: 'document.expiry_changed',
        target: out.document.title,
        note: out.document.expiresAt ? `Hidden from partners from ${out.document.expiresAt.slice(0, 10)}` : 'Expiry removed',
        subject,
      });
    }
    let items: NewNotification[] = [];
    if (out.changed.includes('status')) {
      const published = out.document.status === 'published';
      await recordAudit(tx, ctx.viewer, {
        event: published ? 'document.published' : 'document.unpublished',
        target: out.document.title,
        note: published ? 'Partners in the audience can open it now' : 'Partners lost access until it is published again',
        subject,
      });
      // Publishing is the moment partners hear about a document that was saved as a draft.
      if (published) items = await announceDocument(tx, ctx.viewer, out.document);
    }
    return { ...out, items };
  });
  if (updated.changed.length > 0) revalidateLibraries(ctx);
  emailAnnouncement(ctx, updated.items, updated.document, deps);
  return updated.document;
}

/** Restores an earlier file, but only while it is still inside the 30 day keep window and the object is still in storage. */
export async function handleRestoreDocumentVersion(
  ctx: ActionContext,
  input: z.output<typeof restoreDocumentVersionSchema>,
  deps: DocumentDeps,
): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.replace');
  const out = await withViewer(ctx.viewer, async (tx) => {
    const restored = await restoreDocumentVersion(
      tx,
      ctx.viewer,
      { id: input.id, version: input.version, isStored: async (key) => (await deps.storage.head(key)) !== null },
      ctx.clock,
    );
    await recordAudit(tx, ctx.viewer, {
      event: 'document.version_restored',
      target: restored.document.title,
      note: `Version ${restored.restoredVersion} is current again as version ${restored.newVersion}`,
      subject: { type: 'document', id: restored.document.id },
    });
    return restored.document;
  });
  revalidateLibraries(ctx);
  return out;
}

export interface DocumentDetailDto {
  engagement: DocumentEngagementDto;
  versions: DocumentVersionDto[];
}

/** What the edit drawer shows besides the fields: who opened it and the file history. */
export async function handleGetDocumentDetail(ctx: ActionContext, input: z.output<typeof documentDetailSchema>): Promise<DocumentDetailDto> {
  assertCan(ctx.viewer, 'document.read_stats');
  return withViewer(ctx.viewer, async (tx) => ({
    engagement: await getDocumentEngagement(tx, ctx.viewer, { id: input.id }),
    versions: await listDocumentVersions(tx, ctx.viewer, { id: input.id }, ctx.clock),
  }));
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

const subjectOf = (input: { subject?: string | undefined; request: string }): string => {
  const given = input.subject?.trim();
  if (given) return given;
  const first = input.request.split('\n')[0]?.trim() ?? '';
  return first.length > 80 ? `${first.slice(0, 77)}...` : first;
};

/**
 * The request is stored first (the partner sees it under "Your requests", staff work it in the Requests tab), then
 * the staff email goes out as before. Recipients are the partner's manager and marketing; with none, PARTNERS_NOTIFY_EMAIL.
 * A failed email no longer fails the action: the request is tracked, so asking again would only duplicate it.
 */
export async function handleRequestMaterial(
  ctx: ActionContext,
  input: z.output<typeof requestMaterialSchema>,
  deps: { transport?: EmailTransport },
): Promise<{ sent: true; request: MaterialRequestDto }> {
  assertCan(ctx.viewer, 'document.request_material');
  const viewer = ctx.viewer;
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  rateLimit(`material:user:${viewer.id}`, { limit: MATERIAL_REQUESTS_PER_HOUR, windowSeconds: 3600 });

  const subject = subjectOf(input);
  const request = await withViewer(viewer, (tx) =>
    createMaterialRequest(tx, viewer, { subject, details: input.request, product: input.product }, ctx.clock),
  );
  revalidateLibraries(ctx);

  const found = await withSystem(SYSTEM_ACTORS.portal, (tx) =>
    listMaterialRequestRecipients(tx, SYSTEM_ACTORS.portal, { partnerId: viewer.partnerId }),
  );
  const to: EmailAddress[] = found.recipients.map((person) => ({ email: person.email, name: person.name }));
  if (to.length === 0 && env.PARTNERS_NOTIFY_EMAIL) {
    log.warn({ partnerId: viewer.partnerId }, 'material request: no manager or marketing user, using PARTNERS_NOTIFY_EMAIL');
    to.push({ email: env.PARTNERS_NOTIFY_EMAIL });
  }
  if (to.length === 0) {
    log.error({ partnerId: viewer.partnerId, userId: viewer.id, requestId: request.id }, 'material request has no email recipient; it is in the Requests tab');
    return { sent: true, request };
  }
  const result = await sendEmail(
    buildDocumentMaterialRequest({
      to,
      replyTo: { email: viewer.email, name: viewer.name },
      partnerName: viewer.partnerName,
      requesterName: viewer.name,
      request: `${subject}\n\n${input.request}`,
      productLabel: DOC_PRODUCT_LABEL[input.product],
    }),
    deps.transport,
  );
  if (result.status === 'failed') {
    log.error({ requestId: request.id, error: result.error }, 'material request email failed; the request is in the Requests tab');
  }
  return { sent: true, request };
}

const STATUS_TITLE: Record<(typeof MATERIAL_REQUEST_STATUSES)[number], string> = {
  open: 'Your material request was reopened',
  in_progress: 'Your material request is in progress',
  done: 'Your material request is done',
  declined: 'Your material request was declined',
};

/** Staff work a request: assign, set the status, answer, link a document. The partner gets an in-app notice when the status changes. */
export async function handleUpdateMaterialRequest(
  ctx: ActionContext,
  input: z.output<typeof updateMaterialRequestSchema>,
): Promise<MaterialRequestDto> {
  assertCan(ctx.viewer, 'document.manage_requests');
  const out = await withViewer(ctx.viewer, async (tx) => {
    const updated = await updateMaterialRequest(
      tx,
      ctx.viewer,
      {
        id: input.id,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.responseNote !== undefined ? { responseNote: input.responseNote } : {}),
        ...(input.documentId !== undefined ? { documentId: input.documentId } : {}),
        ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
      },
      ctx.clock,
    );
    const request = updated.request;
    const statusChanged = request.status !== updated.before;
    await recordAudit(tx, ctx.viewer, {
      event: 'document.request_updated',
      target: `${request.subject}, from ${request.partnerName}`,
      note: statusChanged
        ? `${MATERIAL_REQUEST_STATUS_LABEL[updated.before]} to ${MATERIAL_REQUEST_STATUS_LABEL[request.status]}`
        : 'Details updated',
      partnerId: request.partnerId,
      subject: { type: 'partner', id: request.partnerId },
    });
    if (statusChanged) {
      await notifyUsers(tx, [
        {
          userId: updated.requestedBy,
          kind: 'material_request_update',
          title: STATUS_TITLE[request.status],
          body: request.responseNote ?? request.subject,
          link: `${ROUTES.partner.documents}#requests`,
        },
      ]);
    }
    return request;
  });
  revalidateLibraries(ctx);
  return out;
}
