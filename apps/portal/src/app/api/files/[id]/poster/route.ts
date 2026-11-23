import { serveMedia } from '@/server/files/media-route';

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return serveMedia(request, (await ctx.params).id, 'poster');
}
