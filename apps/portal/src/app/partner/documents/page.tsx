import type { Metadata } from 'next';
import { Documents } from '@/components/screens/Documents';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listPublicDatasheets, type PublicDatasheetDto } from '@/server/files/public-resources';
import { log } from '@/server/log';
import { withViewer } from '@/server/repo/context';
import { listDocuments } from '@/server/repo/documents';

export const metadata: Metadata = { title: 'Documents' };

const loadDatasheets = async (): Promise<PublicDatasheetDto[]> => {
  try {
    return await listPublicDatasheets();
  } catch (error) {
    log.warn({ err: error }, 'public datasheets unavailable, the card is hidden');
    return [];
  }
};

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan('document.read');
  const [docs, publicDatasheets] = await Promise.all([
    withViewer(viewer, (tx) => listDocuments(tx, viewer, {})),
    loadDatasheets(),
  ]);
  return <Documents docs={docs} publicDatasheets={publicDatasheets} today={systemClock.today()} />;
}
