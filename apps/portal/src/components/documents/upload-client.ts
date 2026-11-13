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
