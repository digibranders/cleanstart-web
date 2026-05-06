import { describe, expect, it } from 'vitest';

import { buildJsonLdContext, type JsonLdContext } from './context';
import { buildPersonBlob, personRefId, type AuthorSource } from './person';

const ctx: JsonLdContext = buildJsonLdContext({
  siteSettings: {
    siteName: 'CleanStart',
    baseUrl: 'https://cleanstart.com',
    defaultLocale: 'en-US',
  },
  seoDefaults: { organizationJsonLd: { name: 'CleanStart, Inc.' } },
});

describe('personRefId', () => {
  it('returns the canonical @id for an author with a slug', () => {
    expect(personRefId(ctx, { slug: 'jane-doe' })).toBe(
      'https://cleanstart.com/author/jane-doe#person',
    );
  });

  it('returns null when the author has no slug', () => {
    expect(personRefId(ctx, { slug: null })).toBeNull();
  });
});

describe('buildPersonBlob', () => {
  const minimalAuthor: AuthorSource = { slug: 'jane-doe', name: 'Jane Doe' };

  it('returns null when slug or name is missing', () => {
    expect(buildPersonBlob(ctx, { ...minimalAuthor, slug: '' })).toBeNull();
    expect(buildPersonBlob(ctx, { ...minimalAuthor, name: '' })).toBeNull();
  });

  it('emits the minimum-viable Person blob from slug + name', () => {
    expect(buildPersonBlob(ctx, minimalAuthor)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://cleanstart.com/author/jane-doe#person',
      name: 'Jane Doe',
      url: 'https://cleanstart.com/author/jane-doe',
    });
  });

  it('attaches jobTitle + worksFor when role is set', () => {
    const blob = buildPersonBlob(ctx, { ...minimalAuthor, role: 'Senior Security Researcher' });
    expect(blob).toMatchObject({
      jobTitle: 'Senior Security Researcher',
      worksFor: { '@id': 'https://cleanstart.com/#organization' },
    });
  });

  it('emits image as ImageObject when photo.url is set', () => {
    const blob = buildPersonBlob(ctx, {
      ...minimalAuthor,
      photo: { url: 'https://cdn.example/jane.jpg', alt: 'Jane Doe portrait' },
    });
    expect(blob?.image).toEqual({
      '@type': 'ImageObject',
      url: 'https://cdn.example/jane.jpg',
      caption: 'Jane Doe portrait',
    });
  });

  it('collects sameAs from social fields, ignoring empty entries', () => {
    const blob = buildPersonBlob(ctx, {
      ...minimalAuthor,
      social: {
        twitter: 'https://twitter.com/jane',
        linkedin: 'https://linkedin.com/in/jane',
        github: '',
        website: null,
        email: 'jane@example.com',
      },
    });
    expect(blob?.sameAs).toEqual(['https://twitter.com/jane', 'https://linkedin.com/in/jane']);
  });

  it('emits knowsAbout from topicAreas, dropping blanks', () => {
    const blob = buildPersonBlob(ctx, {
      ...minimalAuthor,
      topicAreas: [{ topic: 'Container security' }, { topic: '' }, { topic: 'SBOM' }],
    });
    expect(blob?.knowsAbout).toEqual(['Container security', 'SBOM']);
  });

  it('omits optional sections when source data is empty', () => {
    const blob = buildPersonBlob(ctx, minimalAuthor);
    expect(blob?.jobTitle).toBeUndefined();
    expect(blob?.image).toBeUndefined();
    expect(blob?.sameAs).toBeUndefined();
    expect(blob?.knowsAbout).toBeUndefined();
  });
});
