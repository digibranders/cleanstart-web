import { getKnowledgeLanding } from '@/lib/knowledge-hub';
import { redirect } from 'next/navigation';

/**
 * `/knowledge-hub` has no standalone listing page — visiting it opens the first
 * article inside the sidebar layout (`[slug]/layout.tsx`), whose sidebar carries
 * the full, crawlable tree of every article. We redirect to the first article of
 * the first group (e.g. `/knowledge-hub/vex-documents`) so the entry point is the
 * reading experience, not a category index.
 */
export default async function KnowledgeHubPage(): Promise<never> {
  const groups = await getKnowledgeLanding();
  const firstSlug = groups.find((g) => g.href)?.href ?? 'vex-documents';
  redirect(`/knowledge-hub/${firstSlug}`);
}
