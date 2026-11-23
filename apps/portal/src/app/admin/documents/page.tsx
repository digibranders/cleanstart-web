import type { Metadata } from 'next';
import { AdminDocuments } from '@/components/screens/AdminDocuments';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { withViewer } from '@/server/repo/context';
import { can } from '@/server/auth/policies';
import { listAudiencePartners, listDocuments } from '@/server/repo/documents';
import { countOpenMaterialRequests, listMaterialRequests, listRequestAssignees } from '@/server/repo/material-requests';

export const metadata: Metadata = { title: 'Documents' };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.upload');
  const manage = can(viewer, 'document.manage_requests');
  const { docs, partners, requests, assignees, openRequestCount } = await withViewer(viewer, async (tx) => ({
    docs: await listDocuments(tx, viewer, {}),
    partners: await listAudiencePartners(tx, viewer),
    requests: manage ? await listMaterialRequests(tx, viewer, {}) : null,
    assignees: manage ? await listRequestAssignees(tx, viewer) : [],
    openRequestCount: manage ? await countOpenMaterialRequests(tx, viewer) : 0,
  }));
  return (
    <AdminDocuments
      docs={docs}
      partners={partners}
      requests={requests}
      assignees={assignees}
      openRequestCount={openRequestCount}
      today={systemClock.today()}
    />
  );
}
