import { webflowStatus } from './status';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

export const transformPage = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = (row.slug as string | undefined) ?? slugify(title);
  return {
    _webflowId: row.webflowId,
    _status: webflowStatus(row),
    title,
    slug,
    _rawBody: row.body ?? row.content ?? null,
    _rawHeroImage: row.image ?? row['hero-image'] ?? null,
    seo: {
      title: asString(row['seo-title']) ?? asString(row['meta-title']),
      description: asString(row['seo-description']) ?? asString(row['meta-description']),
    },
  };
};
