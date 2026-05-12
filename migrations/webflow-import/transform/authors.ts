import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformAuthor = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const socialLinks: { platform: string; url: string }[] = [];
  if (typeof row.twitter === 'string' && row.twitter.trim()) {
    socialLinks.push({ platform: 'twitter', url: row.twitter.trim() });
  }
  if (typeof row.linkedin === 'string' && row.linkedin.trim()) {
    socialLinks.push({ platform: 'linkedin', url: row.linkedin.trim() });
  }
  return {
    _webflowId: row.webflowId,
    name: row.name ?? '',
    slug,
    bio: row.bio ?? null,
    jobTitle: row.title ?? row['job-title'] ?? null,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    _rawPhoto: row.photo ?? row.image ?? null,
  };
};
