import { resolveJobLocation } from '../../../apps/cms/src/payload/lib/webflow-import/job-locations';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformJobLocation = (row: Record<string, unknown>): Record<string, unknown> => {
  const rawName = (row.name as string | undefined) ?? '';
  const resolved = resolveJobLocation(rawName);
  const name = resolved?.name ?? rawName;
  const slug = (row.slug as string | undefined) ?? slugify(name);
  return {
    _webflowId: row.webflowId,
    name,
    slug,
    type: resolved?.type ?? 'city',
    isoCountry: resolved?.isoCountry ?? null,
    _unresolved: resolved === null,
  };
};
