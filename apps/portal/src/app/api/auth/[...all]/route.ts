import { getAuth } from '@/server/auth/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return getAuth().handler(request);
}
