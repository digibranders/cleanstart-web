import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformCategory = (row: Record<string, unknown>): Record<string, unknown> => {
  const name = (row.name as string | undefined) ?? '';
  const slug = (row.slug as string | undefined) ?? slugify(name);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    name,
    slug,
    description: row.description ?? null,
    _rawIcon: row.icon ?? null,
  };
};
