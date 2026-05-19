import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

export const transformAboutGallery = (row: Record<string, unknown>): Record<string, unknown> => {
  const name = asString(row.name) ?? '';
  const slug = (row.slug as string | undefined) ?? slugify(name);
  const imageLinkRaw = row['image-link-2'] ?? row['image-link'] ?? row.imageLink;
  const imageLink =
    typeof imageLinkRaw === 'string' && imageLinkRaw.trim().length > 0 ? imageLinkRaw.trim() : null;
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    name,
    slug,
    caption: asString(row.caption),
    imageLink,
    displayOrder: typeof row['display-order'] === 'number' ? row['display-order'] : 0,
    _rawImage: row['gallery-image'] ?? row.image ?? null,
  };
};
