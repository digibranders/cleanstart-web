import { describe, expect, it } from 'vitest';

import {
  ALLOWED_OVERRIDE_TYPES,
  AUTO_EMITTED_TYPES_BY_COLLECTION,
  buildIngestPlan,
  type IngestPlanItem,
  type LenientParseResult,
  parseLenient,
  parseLenientMulti,
  validateOverride,
  validateOverrideForCollection,
  validateOverrideForField,
  validateOverrideForFieldOnCollection,
} from './override-validator';

const valid = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hi',
};

describe('validateOverride', () => {
  it('treats null/undefined as a no-op valid result', () => {
    expect(validateOverride(null).ok).toBe(true);
    expect(validateOverride(undefined).ok).toBe(true);
  });

  it('accepts a single allowlisted override', () => {
    expect(validateOverride(valid).ok).toBe(true);
  });

  it('accepts a non-empty array of overrides', () => {
    expect(
      validateOverride([
        valid,
        { '@context': 'https://schema.org', '@type': 'FAQPage' },
      ]).ok,
    ).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(validateOverride([]).ok).toBe(false);
  });

  it('rejects when @context is wrong', () => {
    expect(validateOverride({ ...valid, '@context': 'http://schema.org' }).ok).toBe(false);
  });

  it('rejects @type values not on the allowlist', () => {
    expect(validateOverride({ ...valid, '@type': 'MedicalCondition' }).ok).toBe(false);
  });

  it('rejects @type values removed from the tightened allowlist', () => {
    for (const removed of ['Product', 'Offer', 'Event', 'Recipe', 'Book', 'PodcastEpisode']) {
      expect(validateOverride({ ...valid, '@type': removed }).ok).toBe(false);
    }
  });

  it('rejects nested @id references but allows top-level @id', () => {
    expect(
      validateOverride({
        ...valid,
        '@id': 'https://example.com/page#article',
        author: { '@id': 'https://attacker.example/x', '@type': 'Person', name: 'X' },
      }).ok,
    ).toBe(false);

    expect(
      validateOverride({ ...valid, '@id': 'https://example.com/page#article' }).ok,
    ).toBe(true);
  });

  it('rejects payloads larger than 16 KiB', () => {
    const result = validateOverride({ ...valid, blob: 'a'.repeat(20_000) });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/exceeds/);
  });

  it('rejects unserialisable inputs (circular references)', () => {
    const obj: Record<string, unknown> = { ...valid };
    obj.self = obj;
    expect(validateOverride(obj).ok).toBe(false);
  });

  it('exposes a stable allowlist for callers', () => {
    expect(ALLOWED_OVERRIDE_TYPES).toContain('Article');
    expect(ALLOWED_OVERRIDE_TYPES).toContain('ProfilePage');
    expect(ALLOWED_OVERRIDE_TYPES).toContain('FAQPage');
    expect(ALLOWED_OVERRIDE_TYPES).not.toContain('MedicalCondition');
    expect(ALLOWED_OVERRIDE_TYPES).not.toContain('Product');
    expect(ALLOWED_OVERRIDE_TYPES).not.toContain('Event');
    expect(ALLOWED_OVERRIDE_TYPES).not.toContain('Recipe');
  });
});

describe('validateOverrideForCollection', () => {
  const review = { '@context': 'https://schema.org', '@type': 'Review' };
  const profile = { '@context': 'https://schema.org', '@type': 'ProfilePage' };

  it('passes unrestricted types on any collection', () => {
    expect(validateOverrideForCollection(valid, 'blogs').ok).toBe(true);
    expect(validateOverrideForCollection(valid, 'authors').ok).toBe(true);
  });

  it('rejects Review on collections without a reviewable surface', () => {
    expect(validateOverrideForCollection(review, 'blogs').ok).toBe(false);
    expect(validateOverrideForCollection(review, 'knowledgeBase').ok).toBe(false);
    expect(validateOverrideForCollection(review, 'authors').ok).toBe(false);
  });

  it('allows Review on resources / events / webinars only', () => {
    expect(validateOverrideForCollection(review, 'resources').ok).toBe(true);
    expect(validateOverrideForCollection(review, 'events').ok).toBe(true);
    expect(validateOverrideForCollection(review, 'webinars').ok).toBe(true);
  });

  it('allows ProfilePage only on authors', () => {
    expect(validateOverrideForCollection(profile, 'authors').ok).toBe(true);
    expect(validateOverrideForCollection(profile, 'blogs').ok).toBe(false);
    expect(validateOverrideForCollection(profile, 'pages').ok).toBe(false);
  });

  it('fails closed when collection slug is unknown', () => {
    expect(validateOverrideForCollection(review, null).ok).toBe(false);
    expect(validateOverrideForCollection(profile, null).ok).toBe(false);
    expect(validateOverrideForCollection(valid, null).ok).toBe(true);
  });
});

describe('validateOverrideForField', () => {
  it('returns true on success', () => {
    expect(validateOverrideForField(valid)).toBe(true);
  });

  it('returns a string error message on failure', () => {
    expect(typeof validateOverrideForField({ ...valid, '@type': 'Bogus' })).toBe('string');
  });
});

describe('validateOverrideForFieldOnCollection', () => {
  it('returns a per-collection validator', () => {
    const ok = validateOverrideForFieldOnCollection('authors')({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: 'Author',
    });
    expect(ok).toBe(true);
  });

  it('rejects restricted types on the wrong collection with a string error', () => {
    const result = validateOverrideForFieldOnCollection('blogs')({
      '@context': 'https://schema.org',
      '@type': 'Review',
    });
    expect(typeof result).toBe('string');
  });
});

describe('parseLenient', () => {
  it('parses straightforward JSON', () => {
    const result = parseLenient('{"@context":"https://schema.org","@type":"Article"}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings).toEqual([]);
      expect((result.data as { '@type': string })['@type']).toBe('Article');
    }
  });

  it('strips a wrapping <script> tag', () => {
    const wrapped =
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage"}</script>';
    const result = parseLenient(wrapped);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.some((w) => /script/i.test(w))).toBe(true);
    }
  });

  it('normalises http://schema.org to https://', () => {
    const result = parseLenient('{"@context": "http://schema.org", "@type":"Article"}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.data as { '@context': string })['@context']).toBe('https://schema.org');
    }
  });

  it('removes trailing commas as a fallback', () => {
    const result = parseLenient('{"@context": "https://schema.org", "@type":"Article",}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.some((w) => /trailing/i.test(w))).toBe(true);
    }
  });

  it('reports a helpful failure message on truly malformed JSON', () => {
    expect(parseLenient('{ this: is not json }').ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(parseLenient('').ok).toBe(false);
    expect(parseLenient('   \n').ok).toBe(false);
  });
});

describe('parseLenientMulti', () => {
  const multiBlock = `
<!-- FAQPage -->
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [] }
</script>

<!-- Organization -->
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "Organization", "name": "Foo", "url": "https://example.com" }
</script>
`;

  it('extracts each <script> block independently', () => {
    const result = parseLenientMulti(multiBlock);
    expect(result.scriptBlockCount).toBe(2);
    expect(result.blocks.length).toBe(2);
    expect(result.blocks.every((b) => b.ok)).toBe(true);
  });

  it('falls back to single-blob path when no <script> tags are present', () => {
    const result = parseLenientMulti('{"@context":"https://schema.org","@type":"Article"}');
    expect(result.scriptBlockCount).toBe(0);
    expect(result.blocks.length).toBe(1);
    expect((result.blocks[0] as LenientParseResult).ok).toBe(true);
  });

  it('marks empty input as a single failed block', () => {
    expect((parseLenientMulti('').blocks[0] as LenientParseResult).ok).toBe(false);
  });

  it('isolates per-block parse failures from successful blocks', () => {
    const mixed = `
<script type="application/ld+json">{ broken json }</script>
<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "FAQPage" }</script>
`;
    const result = parseLenientMulti(mixed);
    expect(result.scriptBlockCount).toBe(2);
    expect((result.blocks[0] as LenientParseResult).ok).toBe(false);
    expect((result.blocks[1] as LenientParseResult).ok).toBe(true);
  });
});

describe('buildIngestPlan', () => {
  const pageCtx = { collectionSlug: 'pages', siteOrigin: 'https://cleanstart.com' };

  it('merges a clean FAQPage on a page (no auto FAQPage for pages)', () => {
    const plan = buildIngestPlan(
      [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] }],
      pageCtx,
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('merge');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('allowed');
  });

  it('skips a duplicate auto-emitted Organization with non-overridable (not on user allowlist)', () => {
    const plan = buildIngestPlan(
      [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'X', url: 'https://cleanstart.com' }],
      pageCtx,
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('skip');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('duplicates-auto-emit');
    expect((plan.items[0] as IngestPlanItem).overridable).toBe(false);
  });

  it('marks duplicate FAQPage on guides as overridable (FAQPage IS on the allowlist)', () => {
    const plan = buildIngestPlan(
      [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] }],
      { collectionSlug: 'guides', siteOrigin: 'https://cleanstart.com' },
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('skip');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('duplicates-auto-emit');
    expect((plan.items[0] as IngestPlanItem).overridable).toBe(true);
  });

  it('flags off-domain @id on an otherwise-allowed type', () => {
    const plan = buildIngestPlan(
      [
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          '@id': 'https://eventussecurity.com/some-course',
          name: 'C',
        },
      ],
      pageCtx,
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('skip');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('off-domain-id');
    expect((plan.items[0] as IngestPlanItem).overridable).toBe(true);
  });

  it('hard-skips off-allowlist types', () => {
    const plan = buildIngestPlan(
      [{ '@context': 'https://schema.org', '@type': 'MedicalCondition', name: 'X' }],
      pageCtx,
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('skip');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('off-allowlist');
    expect((plan.items[0] as IngestPlanItem).overridable).toBe(false);
  });

  it('hard-skips Review on a non-reviewable collection', () => {
    const plan = buildIngestPlan(
      [{ '@context': 'https://schema.org', '@type': 'Review' }],
      { collectionSlug: 'blogs', siteOrigin: 'https://cleanstart.com' },
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('skip');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('collection-restricted');
    expect((plan.items[0] as IngestPlanItem).overridable).toBe(false);
  });

  it('hard-skips blobs with nested @id', () => {
    const plan = buildIngestPlan(
      [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'x',
          author: { '@id': 'https://attacker.example/#p', '@type': 'Person', name: 'X' },
        },
      ],
      pageCtx,
    );
    expect((plan.items[0] as IngestPlanItem).action).toBe('skip');
    expect((plan.items[0] as IngestPlanItem).reason).toBe('nested-id');
    expect((plan.items[0] as IngestPlanItem).overridable).toBe(false);
  });

  it('classifies the realistic cleanstart-images.txt fixture correctly', () => {
    // Five blocks from the SEO file: FAQPage / WebSite / WebPage /
    // BreadcrumbList / Organization. On a `pages` doc, only FAQPage
    // should default to merge; the four duplicates default to skip
    // with `duplicates-auto-emit`.
    const blobs = [
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://www.cleanstart.com/#website',
        url: 'https://www.cleanstart.com/',
        name: 'CleanStart',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': 'https://www.cleanstart.com/cleanstart-images/#webpage',
        url: 'https://www.cleanstart.com/cleanstart-images',
        name: 'X',
      },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [] },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://eventussecurity.com/#organization',
        name: 'Eventus',
        url: 'https://eventussecurity.com',
      },
    ];
    const plan = buildIngestPlan(blobs, pageCtx);
    const actions = plan.items.map((i) => `${i.blobType}:${i.action}:${i.reason}`);
    expect(actions).toEqual([
      'FAQPage:merge:allowed',
      'WebSite:skip:duplicates-auto-emit',
      'WebPage:skip:duplicates-auto-emit',
      'BreadcrumbList:skip:duplicates-auto-emit',
      'Organization:skip:duplicates-auto-emit',
    ]);
    // WebPage is auto-emitted AND on the user allowlist → overridable;
    // WebSite / BreadcrumbList / Organization are auto-emitted but not
    // on the allowlist → non-overridable hard blocks.
    const overridability = plan.items.map((i) => `${i.blobType}:${i.overridable}`);
    expect(overridability).toEqual([
      'FAQPage:true',
      'WebSite:false',
      'WebPage:true',
      'BreadcrumbList:false',
      'Organization:false',
    ]);
  });
});

describe('AUTO_EMITTED_TYPES_BY_COLLECTION', () => {
  it('covers every emittable collection', () => {
    for (const slug of [
      'blogs',
      'news',
      'guides',
      'knowledgeBase',
      'authors',
      'events',
      'webinars',
      'jobs',
      'pages',
      'resources',
    ]) {
      expect(AUTO_EMITTED_TYPES_BY_COLLECTION[slug]).toBeDefined();
      expect((AUTO_EMITTED_TYPES_BY_COLLECTION[slug] as ReadonlySet<string>).size).toBeGreaterThan(0);
    }
  });

  it('always includes Organization and WebSite (Layer 1 sitewide auto blobs)', () => {
    for (const slug of Object.keys(AUTO_EMITTED_TYPES_BY_COLLECTION)) {
      expect((AUTO_EMITTED_TYPES_BY_COLLECTION[slug] as ReadonlySet<string>).has('Organization')).toBe(true);
      expect((AUTO_EMITTED_TYPES_BY_COLLECTION[slug] as ReadonlySet<string>).has('WebSite')).toBe(true);
    }
  });
});
