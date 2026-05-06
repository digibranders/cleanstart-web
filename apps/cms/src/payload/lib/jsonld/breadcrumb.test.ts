import { describe, expect, it } from 'vitest';

import { buildBreadcrumbBlob } from './breadcrumb';
import { buildJsonLdContext } from './context';

const ctx = buildJsonLdContext({
  siteSettings: {
    siteName: 'CleanStart',
    baseUrl: 'https://cleanstart.com',
    defaultLocale: 'en-US',
  },
  seoDefaults: { organizationJsonLd: { name: 'CleanStart, Inc.' } },
});

describe('buildBreadcrumbBlob', () => {
  it('returns null when crumbs is empty', () => {
    expect(buildBreadcrumbBlob(ctx, [])).toBeNull();
  });

  it('numbers positions starting at 1 and resolves paths against baseUrl', () => {
    expect(
      buildBreadcrumbBlob(ctx, [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blogs' },
        { name: 'Example', path: '/blogs/example' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cleanstart.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://cleanstart.com/blogs' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Example',
          item: 'https://cleanstart.com/blogs/example',
        },
      ],
    });
  });

  it('passes through absolute URLs without rewriting', () => {
    const blob = buildBreadcrumbBlob(ctx, [
      { name: 'External', path: 'https://example.com/x' },
    ]);
    expect(blob?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'External', item: 'https://example.com/x' },
    ]);
  });
});
