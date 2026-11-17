import { fileErrorResponse } from '@/server/files/open-route';
import { getDemoFileStorage } from '@/server/files/instance';

/** Demo mode only: the "R2" the upload tickets point at. The signed token is the whole authorisation, as with a presigned R2 URL. */
export async function PUT(request: Request): Promise<Response> {
  try {
    const storage = getDemoFileStorage();
    await storage.acceptUpload(new URL(request.url).searchParams.get('t') ?? '', request.headers.get('content-type'), new Uint8Array(await request.arrayBuffer()));
    return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return fileErrorResponse(error);
  }
}
