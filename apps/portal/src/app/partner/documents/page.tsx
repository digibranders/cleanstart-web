import type { Metadata } from 'next';
import { Documents } from '@/components/screens/Documents';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { withViewer } from '@/server/repo/context';
import { listDocuments } from '@/server/repo/documents';

export const metadata: Metadata = { title: 'Documents' };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.read');
  const docs = await withViewer(viewer, (tx) => listDocuments(tx, viewer, {}));
  return <Documents docs={docs} today={systemClock.today()} />;
}
