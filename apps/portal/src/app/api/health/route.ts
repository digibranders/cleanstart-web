import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { log } from '@/server/log';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Liveness for the Docker healthcheck and the deploy smoke probe: the process is up and the database answers. */
export async function GET(): Promise<NextResponse> {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok' }, { headers: NO_STORE });
  } catch (error) {
    log.error({ err: error }, 'health check: database unreachable');
    return NextResponse.json({ status: 'database_unreachable' }, { status: 503, headers: NO_STORE });
  }
}
