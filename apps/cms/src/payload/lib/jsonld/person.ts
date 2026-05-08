import type { JsonLdContext } from './context';
import { buildKnowsAboutEntries } from './topic-areas';
import type { JsonLdBlob } from './types';
import { absoluteUrl } from './url';

/**
 * Loose shape of an `authors` doc as it appears after Payload has
 * resolved the relationship. We accept what's there — every field is
 * optional except `slug`, which is required to build the @id.
 */
export interface AuthorSource {
  readonly slug?: string | null;
  readonly name?: string | null;
  readonly role?: string | null;
  readonly bioShort?: string | null;
  readonly photo?: { url?: string | null; alt?: string | null } | null;
  readonly social?: {
    readonly twitter?: string | null;
    readonly linkedin?: string | null;
    readonly github?: string | null;
    readonly website?: string | null;
    readonly email?: string | null;
  } | null;
  readonly topicAreas?: readonly { topic?: string | null }[] | null;
  readonly education?: readonly { institution?: string | null }[] | null;
  readonly awards?: readonly { title?: string | null; issuer?: string | null }[] | null;
}

const profileUrl = (ctx: JsonLdContext, slug: string): string =>
  absoluteUrl(ctx.site.baseUrl, `/author/${slug}`);

const authorAtId = (ctx: JsonLdContext, slug: string): string =>
  `${profileUrl(ctx, slug)}#person`;

const collectSameAs = (author: AuthorSource): string[] => {
  const social = author.social;
  if (!social) return [];
  const out: string[] = [];
  if (social.twitter) out.push(social.twitter);
  if (social.linkedin) out.push(social.linkedin);
  if (social.github) out.push(social.github);
  if (social.website) out.push(social.website);
  return out.filter((url) => url.length > 0);
};

const collectKnowsAbout = (author: AuthorSource): unknown[] =>
  buildKnowsAboutEntries(
    (author.topicAreas ?? []).map((entry) => entry.topic ?? null),
  );

const collectAlumniOf = (author: AuthorSource): unknown[] =>
  (author.education ?? [])
    .map((entry) => entry.institution ?? '')
    .filter((name) => name.length > 0)
    .map((name) => ({ '@type': 'EducationalOrganization', name }));

const collectAwards = (author: AuthorSource): string[] =>
  (author.awards ?? [])
    .map((entry) => {
      const title = (entry.title ?? '').trim();
      if (title.length === 0) return '';
      const issuer = (entry.issuer ?? '').trim();
      return issuer.length > 0 ? `${title} (${issuer})` : title;
    })
    .filter((s) => s.length > 0);

/**
 * Build the @id for an author Person blob. Used by article emitters
 * to reference an author by `@id` without inlining the full Person
 * blob, when the author is just a byline reference rather than the
 * page subject.
 */
export const personRefId = (
  ctx: JsonLdContext,
  author: Pick<AuthorSource, 'slug'>,
): string | null => {
  if (!author.slug) return null;
  return authorAtId(ctx, author.slug);
};

/**
 * Full Person blob. Used as the page-subject blob on /author/[slug]
 * and inlined as a byline blob on Article variants.
 */
export const buildPersonBlob = (
  ctx: JsonLdContext,
  author: AuthorSource,
): JsonLdBlob | null => {
  if (!author.slug || !author.name) return null;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': authorAtId(ctx, author.slug),
    name: author.name,
    url: profileUrl(ctx, author.slug),
  };

  if (author.role) {
    blob.jobTitle = author.role;
    blob.worksFor = { '@id': ctx.organizationId };
  }

  if (author.bioShort) {
    blob.description = author.bioShort;
  }

  if (author.photo?.url) {
    const image: Record<string, unknown> = {
      '@type': 'ImageObject',
      url: author.photo.url,
    };
    if (author.photo.alt) image.caption = author.photo.alt;
    blob.image = image;
  }

  const sameAs = collectSameAs(author);
  if (sameAs.length > 0) blob.sameAs = sameAs;

  const knowsAbout = collectKnowsAbout(author);
  if (knowsAbout.length > 0) blob.knowsAbout = knowsAbout;

  const alumniOf = collectAlumniOf(author);
  if (alumniOf.length > 0) blob.alumniOf = alumniOf;

  const awards = collectAwards(author);
  if (awards.length > 0) blob.award = awards;

  return blob as JsonLdBlob;
};
