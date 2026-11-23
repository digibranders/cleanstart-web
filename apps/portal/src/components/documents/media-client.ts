import { uploadFile } from '@/components/documents/upload-client';
import type { DocumentDto } from '@/lib/dto';
import { createDocumentMediaTicketAction, setDocumentMediaAction } from '@/server/actions/documents';
import { type ActionResult, fail } from '@/server/actions/result';
import { MEDIA_MAX_BYTES, MEDIA_TYPE_MESSAGE, type MediaKind, mediaMimeFor } from '@/server/files/media';

/** The message for a file that cannot be a poster or captions file, or null. Fast feedback only: the server checks again, including the first bytes. */
export function mediaFileProblem(kind: MediaKind, file: { name: string; size: number }): string | null {
  if (mediaMimeFor(kind, file.name) === null) return MEDIA_TYPE_MESSAGE[kind];
  if (file.size <= 0) return 'That file is empty.';
  return file.size > MEDIA_MAX_BYTES[kind] ? MEDIA_TYPE_MESSAGE[kind] : null;
}

/** Ticket, PUT, then attach the file to the video. */
export async function attachMedia(args: {
  documentId: string;
  kind: MediaKind;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<ActionResult<DocumentDto>> {
  const problem = mediaFileProblem(args.kind, args.file);
  if (problem) return fail({ code: 'validation', message: problem });
  const uploaded = await uploadFile({
    file: args.file,
    requestTicket: () => createDocumentMediaTicketAction({ documentId: args.documentId, kind: args.kind, originalName: args.file.name, size: args.file.size }),
    onProgress: args.onProgress ?? (() => undefined),
  });
  if (!uploaded.ok) return uploaded;
  return setDocumentMediaAction({ id: args.documentId, kind: args.kind, file: uploaded.data });
}
