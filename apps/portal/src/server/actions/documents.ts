'use server';

import type { UploadTicketDto } from '@/lib/document-upload';
import type { DocumentDto, MaterialRequestDto } from '@/lib/dto';
import {
  createDocumentSchema,
  type DocumentDetailDto,
  deleteDocumentSchema,
  documentDetailSchema,
  handleCreateDocument,
  handleCreateUploadTicket,
  handleDeleteDocument,
  handleGetDocumentDetail,
  handleReplaceDocumentFile,
  handleRequestMaterial,
  handleRestoreDocumentVersion,
  handleUpdateDocument,
  handleUpdateMaterialRequest,
  replaceDocumentSchema,
  requestMaterialSchema,
  restoreDocumentVersionSchema,
  updateDocumentSchema,
  updateMaterialRequestSchema,
  uploadTicketSchema,
} from '@/server/files/document-service';
import { getFileStorage } from '@/server/files/instance';
import {
  handleCreateMediaTicket,
  handleRemoveMedia,
  handleSetMedia,
  mediaTicketSchema,
  removeMediaSchema,
  setMediaSchema,
} from '@/server/files/media-service';
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

export async function restoreDocumentVersionAction(raw: unknown): Promise<ActionResult<DocumentDto>> {
  return runViewerAction({ name: 'document.restore_version', schema: restoreDocumentVersionSchema }, raw, (ctx, input) =>
    handleRestoreDocumentVersion(ctx, input, { storage: getFileStorage() }),
  );
}

/** Opened by, not opened yet and the file history, loaded when the edit drawer opens. */
export async function getDocumentDetailAction(raw: unknown): Promise<ActionResult<DocumentDetailDto>> {
  return runViewerAction({ name: 'document.detail', schema: documentDetailSchema }, raw, (ctx, input) =>
    handleGetDocumentDetail(ctx, input),
  );
}

export async function updateMaterialRequestAction(raw: unknown): Promise<ActionResult<MaterialRequestDto>> {
  return runViewerAction({ name: 'document.update_request', schema: updateMaterialRequestSchema }, raw, (ctx, input) =>
    handleUpdateMaterialRequest(ctx, input),
  );
}

export async function requestMaterialAction(raw: unknown): Promise<ActionResult<{ sent: true }>> {
  return runViewerAction({ name: 'document.request_material', schema: requestMaterialSchema }, raw, (ctx, input) =>
    handleRequestMaterial(ctx, input, {}).then(({ sent }) => ({ sent })),
  );
}

/** Step 1 for a video's poster image or captions file. */
export async function createDocumentMediaTicketAction(raw: unknown): Promise<ActionResult<UploadTicketDto>> {
  return runViewerAction({ name: 'document.media_ticket', schema: mediaTicketSchema }, raw, (ctx, input) =>
    handleCreateMediaTicket(ctx, input, { storage: getFileStorage() }),
  );
}

/** Step 2: attach the uploaded poster or captions file to the video. */
export async function setDocumentMediaAction(raw: unknown): Promise<ActionResult<DocumentDto>> {
  return runViewerAction({ name: 'document.media_set', schema: setMediaSchema }, raw, (ctx, input) =>
    handleSetMedia(ctx, input, { storage: getFileStorage() }),
  );
}

export async function removeDocumentMediaAction(raw: unknown): Promise<ActionResult<DocumentDto>> {
  return runViewerAction({ name: 'document.media_remove', schema: removeMediaSchema }, raw, (ctx, input) =>
    handleRemoveMedia(ctx, input, { storage: getFileStorage() }),
  );
}
