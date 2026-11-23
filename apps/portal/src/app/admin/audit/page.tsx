import type { Metadata } from 'next';
import { IntegrationHealthCard } from '@/components/audit/IntegrationHealthCard';
import { AdminAudit } from '@/components/screens/AdminAudit';
import { parseAuditView } from '@/lib/audit-filters';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
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
  const { page, health, partners } = await withViewer(viewer, async (tx) => ({
    page: await listAudit(
      tx,
      viewer,
      {
        period: view.period,
        ...(view.kind ? { kind: view.kind } : {}),
        ...(view.who ? { who: view.who } : {}),
        ...(view.partnerId ? { partnerId: view.partnerId } : {}),
        ...(view.q ? { q: view.q } : {}),
        ...(view.cursor ? { cursor: view.cursor } : {}),
      },
      systemClock,
    ),
    health: await integrationHealth(tx),
    partners: (await listPartners(tx, viewer, {})).map((p) => ({ value: p.id, label: p.name })),
  }));
  return (
    <AdminAudit
      page={page}
      view={view}
      partners={partners}
      today={today}
      healthSlot={<IntegrationHealthCard health={health} today={today} />}
    />
  );
}
