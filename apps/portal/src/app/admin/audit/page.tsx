import type { Metadata } from 'next';
import { FailedSyncsCard } from '@/components/audit/FailedSyncsCard';
import { IntegrationHealthCard } from '@/components/audit/IntegrationHealthCard';
import { AdminAudit } from '@/components/screens/AdminAudit';
import { parseAuditView } from '@/lib/audit-filters';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
import { listFailedSyncs } from '@/server/repo/failed-syncs';
import { integrationHealth } from '@/server/repo/integration-health';
import { listPartners } from '@/server/repo/partners';

export const metadata: Metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan('audit.read');
  const view = parseAuditView(await searchParams);
  const today = systemClock.today();
  const { page, health, failedSyncs, partners } = await withViewer(viewer, async (tx) => ({
    page: await listAudit(
      tx,
      viewer,
      {
        period: view.period,
        ...(view.from ? { from: view.from } : {}),
        ...(view.to ? { to: view.to } : {}),
        ...(view.event ? { event: view.event } : {}),
        ...(view.kind ? { kind: view.kind } : {}),
        ...(view.who ? { who: view.who } : {}),
        ...(view.partnerId ? { partnerId: view.partnerId } : {}),
        ...(view.q ? { q: view.q } : {}),
        ...(view.cursor ? { cursor: view.cursor } : {}),
      },
      systemClock,
    ),
    health: await integrationHealth(tx),
    failedSyncs: await listFailedSyncs(tx, viewer),
    partners: (await listPartners(tx, viewer, {})).map((p) => ({ value: p.id, label: p.name })),
  }));
  return (
    <AdminAudit
      page={page}
      view={view}
      partners={partners}
      today={today}
      healthSlot={
        <>
          <IntegrationHealthCard health={health} today={today} />
          <FailedSyncsCard rows={failedSyncs} today={today} />
        </>
      }
    />
  );
}
