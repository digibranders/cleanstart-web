import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { env } from '@/env';
import { verifyV3 } from '@/server/hubspot/signature';
import { triggerPoll } from '@/server/jobs/hubspot-poll';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.HUBSPOT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'webhook not configured' }, { status: 503 });
  const body = await request.text();
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
