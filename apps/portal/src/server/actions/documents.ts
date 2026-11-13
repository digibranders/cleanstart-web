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
