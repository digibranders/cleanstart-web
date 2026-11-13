import type { Metadata } from 'next';
import { AdminAudit } from '@/components/screens/AdminAudit';
import { parseAuditView } from '@/lib/audit-filters';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';

export const metadata: Metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan('audit.read');
  const view = parseAuditView(await searchParams);
  const page = await withViewer(viewer, (tx) =>
    listAudit(
      tx,
      viewer,
      {
        period: view.period,
        ...(view.kind ? { kind: view.kind } : {}),
        ...(view.who ? { who: view.who } : {}),
        ...(view.q ? { q: view.q } : {}),
        ...(view.cursor ? { cursor: view.cursor } : {}),
      },
      systemClock,
    ),
  );
  return <AdminAudit page={page} view={view} today={systemClock.today()} healthSlot={null} />;
}
