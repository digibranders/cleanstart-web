import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { env } from '@/env';
import { verifyV3 } from '@/server/hubspot/signature';
import { triggerPoll } from '@/server/jobs/hubspot-poll';

export const dynamic = 'force-dynamic';

/** HubSpot batches are a few KB; the cap stops an unauthenticated caller making the route buffer a huge body. */
const MAX_BODY_BYTES = 1_048_576;

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.HUBSPOT_WEBHOOK_SECRET;
  if (!secret) return new NextResponse(null, { status: 404 });
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  const valid = verifyV3({
    secret,
    method: 'POST',
    uri: `${env.APP_URL}/api/hubspot/webhook`,
    body,
    timestamp: request.headers.get('x-hubspot-request-timestamp') ?? '',
    signature: request.headers.get('x-hubspot-signature-v3') ?? '',
    now: Date.now(),
  });
  if (!valid) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  void triggerPoll().catch((err: unknown) => Sentry.captureException(err, { tags: { job: 'hubspot-poll', trigger: 'webhook' } }));
  return NextResponse.json({ ok: true });
}
