import { systemClock } from '@/lib/clock';
import { ROUTES } from '@/lib/routes';
import { getViewer } from '@/server/auth/viewer';
import { fileErrorResponse } from '@/server/files/open-route';
import { renderRegistrationConfirmation, toConfirmationDto } from '@/server/pdf/registration-confirmation';
import { loadRegionList } from '@/server/region-names';
import { withViewer } from '@/server/repo/context';
import { getConfirmationSource } from '@/server/repo/registration-confirmation';

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
    const deal = await withViewer(viewer, (tx) => getConfirmationSource(tx, viewer, id));
    const dto = toConfirmationDto(deal, systemClock.today(), await loadRegionList());
    if (!dto) return fileErrorResponse(new Error('accepted registration without protection dates'));
    const bytes = await renderRegistrationConfirmation(dto);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${dto.reference}-confirmation.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
}
