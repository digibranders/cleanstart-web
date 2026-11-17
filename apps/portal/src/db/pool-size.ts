import { isDemoMode } from '@/server/demo';

const DEFAULT_REQUEST_POOL_MAX = 6;
const DEFAULT_SYSTEM_POOL_MAX = 8;
/** A serverless instance holds two pools; one connection each is two per instance, so a small demo server (max_connections 40) serves many warm instances. */
const DEMO_POOL_MAX = 1;
const POOL_MAX_LIMIT = 50;

/** Connections per pool. PORTAL_DB_POOL_MAX sizes both pools; unset, demo mode is small and everything else keeps the long lived container's sizes. */
export function poolSizes(source: Record<string, string | undefined>): { request: number; system: number } {
  const raw = source.PORTAL_DB_POOL_MAX;
  if (raw === undefined || raw === '') {
    return isDemoMode(source) ? { request: DEMO_POOL_MAX, system: DEMO_POOL_MAX } : { request: DEFAULT_REQUEST_POOL_MAX, system: DEFAULT_SYSTEM_POOL_MAX };
  }
  const size = Number(raw);
  if (!/^\d+$/.test(raw) || size < 1 || size > POOL_MAX_LIMIT) {
    throw new Error(`PORTAL_DB_POOL_MAX must be a whole number from 1 to ${POOL_MAX_LIMIT} (got "${raw}").`);
  }
  return { request: size, system: size };
}
