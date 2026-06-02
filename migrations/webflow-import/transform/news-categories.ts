import { webflowStatus } from './status';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

export const transformNewsCategory = (row: Record<string, unknown>): Record<string, unknown> => {
  const name = asString(row.name) ?? '';
  const slug = (row.slug as string | undefined) ?? slugify(name);
  return {
    _webflowId: row.webflowId,
    _status: webflowStatus(row),
    name,
    slug,
    description: asString(row.description),
    _rawIcon: row.icon ?? null,
  };
};
