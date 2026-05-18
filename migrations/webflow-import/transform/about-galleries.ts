import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformAboutGallery = (row: Record<string, unknown>): Record<string, unknown> => {
  const name = (row.name as string | undefined) ?? '';
  const slug = (row.slug as string | undefined) ?? slugify(name);
  const imageLinkRaw = row['image-link-2'] ?? row['image-link'] ?? row.imageLink;
  const imageLink =
    typeof imageLinkRaw === 'string' && imageLinkRaw.trim().length > 0 ? imageLinkRaw.trim() : null;
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    name,
    slug,
    caption: row.caption ?? null,
    imageLink,
    displayOrder: typeof row['display-order'] === 'number' ? row['display-order'] : 0,
    _rawImage: row['gallery-image'] ?? row.image ?? null,
  };
};
