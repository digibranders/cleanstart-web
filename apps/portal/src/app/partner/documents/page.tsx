import type { Metadata } from 'next';
import { DOC_GROUPS, type DocGroup, groupOf, parseDocumentsView, sortDocuments } from '@/components/documents/doc-view';
import { Documents } from '@/components/screens/Documents';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listPublicDatasheets, type PublicDatasheetDto } from '@/server/files/public-resources';
import { log } from '@/server/log';
import { withViewer } from '@/server/repo/context';
import { listDocuments } from '@/server/repo/documents';
import { listOwnMaterialRequests } from '@/server/repo/material-requests';

export const metadata: Metadata = { title: 'Documents' };

const loadDatasheets = async (): Promise<PublicDatasheetDto[]> => {
  try {
    return await listPublicDatasheets();
  } catch (error) {
    log.warn({ err: error }, 'public datasheets unavailable, the card is hidden');
    return [];
  }
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const view = parseDocumentsView(await searchParams);
  const viewer = await requireCan('document.read');
  const [matches, publicDatasheets, requests] = await Promise.all([
    // The database does the search, type and product filters; the purpose tab and the sort are applied below.
    withViewer(viewer, (tx) =>
      listDocuments(tx, viewer, {
        ...(view.q ? { q: view.q } : {}),
        ...(view.type ? { type: view.type } : {}),
        ...(view.product ? { product: view.product } : {}),
      }),
    ),
    loadDatasheets(),
    viewer.kind === 'partner' ? withViewer(viewer, (tx) => listOwnMaterialRequests(tx, viewer)) : Promise.resolve([]),
  ]);
  const counts = Object.fromEntries(DOC_GROUPS.map((g) => [g, matches.filter((d) => groupOf(d.type) === g).length])) as Record<DocGroup, number>;
  const docs = sortDocuments(view.group ? matches.filter((d) => groupOf(d.type) === view.group) : matches, view.sort);
  return <Documents docs={docs} counts={counts} view={view} publicDatasheets={publicDatasheets} requests={requests} today={systemClock.today()} />;
}
