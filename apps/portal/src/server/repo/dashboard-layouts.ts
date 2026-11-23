import { and, eq } from 'drizzle-orm';
import { dashboardLayouts } from '@/db/schema';
import type { DashboardId, SavedLayout } from '@/lib/dashboard-layout';
import type { Viewer } from '@/server/auth/types';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

/** The viewer's own saved arrangement of a dashboard, or null when they never changed it. Row level security hides every other person's row. */
export async function getDashboardLayout(tx: Tx, viewer: Viewer, dashboard: DashboardId): Promise<SavedLayout | null> {
  const [row] = await tx
    .select({ layout: dashboardLayouts.layout })
    .from(dashboardLayouts)
    .where(and(eq(dashboardLayouts.userId, viewer.id), eq(dashboardLayouts.dashboard, dashboard)));
  return row?.layout ?? null;
}

/** Replaces the viewer's saved arrangement. An empty card list is the same as the page's own default. */
export async function saveDashboardLayout(tx: Tx, viewer: Viewer, dashboard: DashboardId, layout: SavedLayout): Promise<SavedLayout> {
  await tx
    .insert(dashboardLayouts)
    .values({ userId: viewer.id, dashboard, layout })
    .onConflictDoUpdate({ target: [dashboardLayouts.userId, dashboardLayouts.dashboard], set: { layout } });
  return layout;
}

const exportedFns = { getDashboardLayout, saveDashboardLayout };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  // The viewer id is the only handle: row level security matches it to the session user, so another person's row is never visible.
  getDashboardLayout: { scope: 'tenant', probe: (tx, viewer) => getDashboardLayout(tx, viewer, 'partner-overview'), expect: 'unchanged' },
  saveDashboardLayout: { scope: 'tenant', probe: (tx, viewer) => saveDashboardLayout(tx, viewer, 'partner-overview', { cards: [] }), expect: 'unchanged' },
});
