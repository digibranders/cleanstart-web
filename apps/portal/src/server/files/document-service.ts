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
