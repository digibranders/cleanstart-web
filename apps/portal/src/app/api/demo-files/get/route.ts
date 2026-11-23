import { getDemoFileStorage } from '@/server/files/instance';
import { fileErrorResponse } from '@/server/files/open-route';

/** Demo mode only: the "R2" download URL. Always an attachment, never rendered by the browser. */
export async function GET(request: Request): Promise<Response> {
  try {
    const file = await getDemoFileStorage().serveDownload(new URL(request.url).searchParams.get('t') ?? '');
    const name = file.filename.replace(/[^\w.\- ]+/g, '_');
    return new Response(Buffer.from(file.bytes), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${name}"`,
        'Content-Length': String(file.bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
}
