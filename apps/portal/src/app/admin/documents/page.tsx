import type { Metadata } from 'next';
import { AdminDocuments } from '@/components/screens/AdminDocuments';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { withViewer } from '@/server/repo/context';
import { listAudiencePartners, listDocuments } from '@/server/repo/documents';

export const metadata: Metadata = { title: 'Manage documents' };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.upload');
  const { docs, partners } = await withViewer(viewer, async (tx) => ({
    docs: await listDocuments(tx, viewer, {}),
    partners: await listAudiencePartners(tx, viewer),
  }));
  return <AdminDocuments docs={docs} partners={partners} today={systemClock.today()} />;
}
