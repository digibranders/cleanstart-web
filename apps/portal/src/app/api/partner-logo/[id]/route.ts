import { z } from 'zod';
import { getViewer } from '@/server/auth/viewer';
import { getFileStorage } from '@/server/files/instance';
import { fileErrorResponse } from '@/server/files/open-route';
import { withViewer } from '@/server/repo/context';
import { getPartnerLogoKey } from '@/server/repo/partners';
import { NotFoundError } from '@/server/errors';

const NOT_FOUND = (): Response => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

/** The company logo as an image: audience check (own company or staff), then a 302 to a short presigned inline GET. Nothing signed is cached for long. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer || !z.string().uuid().safeParse(id).success) return NOT_FOUND();
  try {
    const key = await withViewer(viewer, (tx) => getPartnerLogoKey(tx, viewer, id));
    if (!key) return NOT_FOUND();
    const { url } = await getFileStorage().presignGet({ key, filename: 'logo', inline: true, expiresInSeconds: 300 });
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'private, max-age=240', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    if (error instanceof NotFoundError) return NOT_FOUND();
    return fileErrorResponse(error);
  }
}
