import { describe, expect, it } from 'vitest';

import { buildJsonLdContext } from './context';
import { buildJsonLdBlobs } from './dispatch';

const ctx = buildJsonLdContext({
  siteSettings: {
    siteName: 'CleanStart',
    baseUrl: 'https://cleanstart.com',
    defaultLocale: 'en-US',
  },
  seoDefaults: {
    organizationJsonLd: {
      name: 'CleanStart, Inc.',
      url: 'https://cleanstart.com',
      logo: { url: 'https://cdn.example/logo.png' },
    },
  },
});

describe('buildJsonLdBlobs', () => {
  it('returns [] for an unsupported collection', () => {
    expect(buildJsonLdBlobs(ctx, 'mystery', { slug: 'x', title: 'X' })).toEqual([]);
  });

  it('returns [] when title or slug is missing on an article-like collection', () => {
    expect(buildJsonLdBlobs(ctx, 'blogs', { slug: '', title: 'X' })).toEqual([]);
    expect(buildJsonLdBlobs(ctx, 'blogs', { slug: 'x' })).toEqual([]);
  });

  describe('blogs', () => {
    it('emits Organization + WebSite + Article + Breadcrumb', () => {
      const blobs = buildJsonLdBlobs(ctx, 'blogs', {
        slug: 'example',
        title: 'Example post',
        abstract: 'A short lede.',
        updatedAt: '2026-05-05T12:00:00Z',
      });
      const types = blobs.map((b) => b['@type']);
      expect(types).toEqual(['Organization', 'WebSite', 'Article', 'BreadcrumbList']);

      const article = blobs.find((b) => b['@type'] === 'Article');
      expect(article).toMatchObject({
        '@id': 'https://cleanstart.com/blog/example',
        url: 'https://cleanstart.com/blog/example',
        headline: 'Example post',
        description: 'A short lede.',
        dateModified: '2026-05-05T12:00:00Z',
      });
    });

    it('inlines a byline Person blob and adds FAQPage when faqs[] non-empty', () => {
      const blobs = buildJsonLdBlobs(ctx, 'blogs', {
        slug: 'example',
        title: 'Example post',
        authors: [{ slug: 'jane-doe', name: 'Jane Doe', role: 'Researcher' }],
        faqs: [{ question: 'Why?', answer: 'Because.' }],
      });
      const types = blobs.map((b) => b['@type']);
      expect(types).toEqual([
        'Organization',
        'WebSite',
        'Article',
        'Person',
        'BreadcrumbList',
        'FAQPage',
      ]);
    });

    it('promotes the first resolved category into about{}', () => {
      const blobs = buildJsonLdBlobs(ctx, 'blogs', {
        slug: 'example',
        title: 'Example post',
        categories: [{ name: 'Container security' }, { name: 'CI/CD' }],
      });
      const article = blobs.find((b) => b['@type'] === 'Article');
      expect(article?.about).toEqual({ '@type': 'Thing', name: 'Container security' });
    });
  });

  describe('news', () => {
    it('emits NewsArticle and uses publicationDate as datePublished', () => {
      const blobs = buildJsonLdBlobs(ctx, 'news', {
        slug: 'launch',
        title: 'CleanStart launches v1',
        publicationDate: '2026-05-04T09:00:00Z',
        newsCategories: [{ name: 'Press' }],
      });
      const article = blobs.find((b) => b['@type'] === 'NewsArticle');
      expect(article).toMatchObject({
        '@type': 'NewsArticle',
        '@id': 'https://cleanstart.com/news/launch',
        datePublished: '2026-05-04T09:00:00Z',
        isAccessibleForFree: true,
        about: { '@type': 'Thing', name: 'Press' },
      });
    });
  });

  describe('guides', () => {
    it('emits citation[] when the guide has citations', () => {
      const blobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'ssh-hardening',
        title: 'SSH hardening',
        abstract: 'Walkthrough.',
        citations: [
          {
            label: 'NIST SP 800-53',
            source: 'NIST',
            url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
          },
          { label: '' },
          { label: 'OpenSSH Manual', source: 'OpenSSH' },
        ],
      });
      const article = blobs.find((b) => b['@type'] === 'TechArticle') as
        | { citation?: { name: string; url?: string; publisher?: { name: string } }[] }
        | undefined;
      expect(article?.citation).toEqual([
        expect.objectContaining({
          '@type': 'CreativeWork',
          name: 'NIST SP 800-53',
          url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
          publisher: expect.objectContaining({ name: 'NIST' }),
        }),
        expect.objectContaining({ name: 'OpenSSH Manual' }),
      ]);
    });

    it('omits citation[] when no citations are set', () => {
      const blobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'no-cites',
        title: 'No citations',
        abstract: 'x',
      });
      const article = blobs.find((b) => b['@type'] === 'TechArticle') as
        | { citation?: unknown }
        | undefined;
      expect(article?.citation).toBeUndefined();
    });

    it('emits a HowTo blob alongside the TechArticle when howTo.enabled is true', () => {
      const blobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'sbom-howto',
        title: 'How to sign your SBOM',
        abstract: 'Step-by-step.',
        howTo: { enabled: true, totalTime: 'PT15M' },
        articleSections: [
          {
            heading: 'Generate the SBOM',
            body: { root: { children: [{ text: 'Run syft to produce CycloneDX.' }] } },
          },
          {
            heading: 'Sign with cosign',
            body: { root: { children: [{ text: 'cosign sign-blob …' }] } },
          },
        ],
      });
      const howTo = blobs.find((b) => b['@type'] === 'HowTo') as
        | { totalTime?: string; step: { name: string }[] }
        | undefined;
      expect(howTo).toBeDefined();
      expect(howTo?.totalTime).toBe('PT15M');
      expect(howTo?.step).toHaveLength(2);
      expect(howTo?.step[0]?.name).toBe('Generate the SBOM');
      expect(blobs.find((b) => b['@type'] === 'TechArticle')).toBeDefined();
    });

    it('omits the HowTo when toggle is off OR no sections have body text', () => {
      const offBlobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'no-howto',
        title: 'Plain guide',
        articleSections: [{ heading: 'Section', body: { root: { children: [{ text: 'x' }] } } }],
      });
      expect(offBlobs.find((b) => b['@type'] === 'HowTo')).toBeUndefined();

      const emptyBlobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'empty-sections',
        title: 'Empty guide',
        howTo: { enabled: true },
        articleSections: [],
      });
      expect(emptyBlobs.find((b) => b['@type'] === 'HowTo')).toBeUndefined();
    });

    it('emits TechArticle and surfaces keywords[] as mentions[]', () => {
      const blobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'sbom-101',
        title: 'SBOM 101',
        wordCount: 1850,
        keywords: [{ keyword: 'SBOM' }, { keyword: 'CVE' }, { keyword: '' }],
      });
      const article = blobs.find((b) => b['@type'] === 'TechArticle');
      expect(article).toMatchObject({
        '@type': 'TechArticle',
        wordCount: 1850,
        mentions: [
          { '@type': 'Thing', name: 'SBOM' },
          { '@type': 'Thing', name: 'CVE' },
        ],
      });
    });
  });

  describe('knowledgeBase', () => {
    it('emits TechArticle with about{} from the single category relation', () => {
      const blobs = buildJsonLdBlobs(ctx, 'knowledgeBase', {
        slug: 'vex-documents',
        title: 'How to use VEX documents',
        category: { name: 'Emerging Standards' },
      });
      const article = blobs.find((b) => b['@type'] === 'TechArticle');
      expect(article).toMatchObject({
        '@id': 'https://cleanstart.com/knowledge-hub/vex-documents',
        '@type': 'TechArticle',
        about: { '@type': 'Thing', name: 'Emerging Standards' },
      });
      // breadcrumb should target the KB landing page
      const breadcrumb = blobs.find((b) => b['@type'] === 'BreadcrumbList') as
        | { itemListElement: { item: string }[] }
        | undefined;
      expect(breadcrumb?.itemListElement[1]?.item).toBe('https://cleanstart.com/knowledge-hub');
    });
  });

  describe('authors', () => {
    it('emits Organization + WebSite + Person + Breadcrumb (no Article)', () => {
      const blobs = buildJsonLdBlobs(ctx, 'authors', {
        slug: 'jane-doe',
        name: 'Jane Doe',
        role: 'Senior Researcher',
        topicAreas: [{ topic: 'Container security' }],
      });
      const types = blobs.map((b) => b['@type']);
      expect(types).toEqual(['Organization', 'WebSite', 'Person', 'BreadcrumbList']);

      const person = blobs.find((b) => b['@type'] === 'Person') as
        | { knowsAbout?: unknown[] }
        | undefined;
      expect(person).toMatchObject({
        '@id': 'https://cleanstart.com/author/jane-doe#person',
        name: 'Jane Doe',
        jobTitle: 'Senior Researcher',
      });
      expect(person?.knowsAbout).toEqual([
        expect.objectContaining({ '@type': 'DefinedTerm', name: 'Container security' }),
      ]);
    });

    it('returns [] when an author has no slug or name', () => {
      expect(buildJsonLdBlobs(ctx, 'authors', { slug: '', name: 'X' })).toEqual([]);
      expect(buildJsonLdBlobs(ctx, 'authors', { slug: 'x', name: '' })).toEqual([]);
    });

    it('emits alumniOf, knowsAbout, and award when education / topicAreas / awards are set', () => {
      const blobs = buildJsonLdBlobs(ctx, 'authors', {
        slug: 'jane-doe',
        name: 'Jane Doe',
        topicAreas: [{ topic: 'Container security' }],
        education: [
          { institution: 'MIT', degree: 'BSc' },
          { institution: 'Stanford', degree: 'MSc' },
        ],
        awards: [
          { title: 'CNCF Top Contributor', issuer: 'CNCF', year: 2024 },
          { title: 'Bare title only' },
        ],
      });
      const person = blobs.find((b) => b['@type'] === 'Person') as
        | {
            knowsAbout?: unknown[];
            alumniOf?: { '@type': string; name: string }[];
            award?: string[];
          }
        | undefined;
      expect(person?.knowsAbout).toEqual([
        expect.objectContaining({ '@type': 'DefinedTerm', name: 'Container security' }),
      ]);
      expect(person?.alumniOf).toEqual([
        { '@type': 'EducationalOrganization', name: 'MIT' },
        { '@type': 'EducationalOrganization', name: 'Stanford' },
      ]);
      expect(person?.award).toEqual(['CNCF Top Contributor (CNCF)', 'Bare title only']);
    });
  });

  describe('resources', () => {
    it('emits a DigitalDocument blob when the doc has a downloadable asset', () => {
      const blobs = buildJsonLdBlobs(ctx, 'resources', {
        slug: 'sbom-whitepaper',
        title: 'SBOM whitepaper',
        summary: 'Why SBOMs matter.',
        asset: {
          url: 'https://cdn.example/whitepapers/sbom.pdf',
          mimeType: 'application/pdf',
          filesize: 1_500_000,
        },
      });
      const digitalDoc = blobs.find((b) => b['@type'] === 'DigitalDocument') as
        | { encodingFormat?: string; contentSize?: string; url?: string; isPartOf?: { '@id': string } }
        | undefined;
      expect(digitalDoc).toBeDefined();
      expect(digitalDoc?.encodingFormat).toBe('application/pdf');
      expect(digitalDoc?.url).toBe('https://cdn.example/whitepapers/sbom.pdf');
      expect(digitalDoc?.contentSize).toBe('1.4 MB');
      expect(digitalDoc?.isPartOf?.['@id']).toBe('https://cleanstart.com/resource/sbom-whitepaper');
    });

    it('omits DigitalDocument when the resource has no asset', () => {
      const blobs = buildJsonLdBlobs(ctx, 'resources', {
        slug: 'no-asset',
        title: 'No asset',
        summary: 'x',
      });
      expect(blobs.find((b) => b['@type'] === 'DigitalDocument')).toBeUndefined();
    });

    it('formats sub-MB filesizes as KB', () => {
      const blobs = buildJsonLdBlobs(ctx, 'resources', {
        slug: 'tiny',
        title: 'Tiny brief',
        summary: 'x',
        asset: { url: 'https://cdn/x.pdf', mimeType: 'application/pdf', filesize: 200 * 1024 },
      });
      const digitalDoc = blobs.find((b) => b['@type'] === 'DigitalDocument') as
        | { contentSize?: string }
        | undefined;
      expect(digitalDoc?.contentSize).toBe('200 KB');
    });
  });

  describe('events', () => {
    const baseEvent = {
      slug: 'kubecon-25',
      title: 'KubeCon ’25',
      abstract: 'Annual cloud-native conference.',
      venue: 'San Francisco Marriott Marquis',
      startsAt: '2026-09-10T17:00:00Z',
      endsAt: '2026-09-12T01:00:00Z',
      registrationUrl: 'https://example.com/register',
      attendeesCap: 500,
    };

    it('emits Event with eventStatus EventScheduled by default', () => {
      const blobs = buildJsonLdBlobs(ctx, 'events', baseEvent);
      const event = blobs.find((b) => b['@type'] === 'Event');
      expect(event).toMatchObject({
        '@id': 'https://cleanstart.com/events/kubecon-25',
        startDate: '2026-09-10T17:00:00Z',
        endDate: '2026-09-12T01:00:00Z',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      });
    });

    it('flips eventStatus to EventCancelled when the doc is cancelled', () => {
      const blobs = buildJsonLdBlobs(ctx, 'events', {
        ...baseEvent,
        eventStatus: 'cancelled',
      });
      const event = blobs.find((b) => b['@type'] === 'Event') as
        | { eventStatus?: string }
        | undefined;
      expect(event?.eventStatus).toBe('https://schema.org/EventCancelled');
    });

    it('flips eventStatus to EventPostponed when the doc is postponed', () => {
      const blobs = buildJsonLdBlobs(ctx, 'events', {
        ...baseEvent,
        eventStatus: 'postponed',
      });
      const event = blobs.find((b) => b['@type'] === 'Event') as
        | { eventStatus?: string }
        | undefined;
      expect(event?.eventStatus).toBe('https://schema.org/EventPostponed');
    });

    it('emits performer[] when speakers resolve', () => {
      const blobs = buildJsonLdBlobs(ctx, 'events', {
        ...baseEvent,
        speakers: [{ slug: 'jane-doe', name: 'Jane Doe' }],
      });
      const event = blobs.find((b) => b['@type'] === 'Event') as
        | { performer?: { name: string }[] }
        | undefined;
      expect(event?.performer).toEqual([
        expect.objectContaining({ '@type': 'Person', name: 'Jane Doe' }),
      ]);
    });
  });

  describe('pages', () => {
    it('emits BreadcrumbList from a precomputed breadcrumb chain', () => {
      const blobs = buildJsonLdBlobs(ctx, 'pages', {
        title: 'Pricing',
        path: '/solutions/pricing',
        breadcrumb: [
          { path: '/solutions', label: 'Solutions' },
          { path: '/solutions/pricing', label: 'Pricing' },
        ],
      });
      const breadcrumb = blobs.find((b) => b['@type'] === 'BreadcrumbList') as
        | { itemListElement: { name: string; item: string; position: number }[] }
        | undefined;
      expect(breadcrumb).toBeDefined();
      expect(breadcrumb?.itemListElement).toEqual([
        expect.objectContaining({ position: 1, name: 'Home', item: 'https://cleanstart.com/' }),
        expect.objectContaining({
          position: 2,
          name: 'Solutions',
          item: 'https://cleanstart.com/solutions',
        }),
        expect.objectContaining({
          position: 3,
          name: 'Pricing',
          item: 'https://cleanstart.com/solutions/pricing',
        }),
      ]);
    });

    it('omits BreadcrumbList when breadcrumb chain is missing or empty', () => {
      const blobs = buildJsonLdBlobs(ctx, 'pages', {
        title: 'Standalone',
        path: '/standalone',
      });
      expect(blobs.find((b) => b['@type'] === 'BreadcrumbList')).toBeUndefined();
    });

    it('honors editor-picked schemaType (CollectionPage)', () => {
      const blobs = buildJsonLdBlobs(ctx, 'pages', {
        title: 'Pricing',
        path: '/pricing',
        schemaType: 'CollectionPage',
      });
      const page = blobs.find((b) =>
        ['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage'].includes(
          (b as { '@type'?: string })['@type'] ?? '',
        ),
      );
      expect(page?.['@type']).toBe('CollectionPage');
    });

    it('falls back to URL-based variant when schemaType is "auto"', () => {
      const blobs = buildJsonLdBlobs(ctx, 'pages', {
        title: 'About',
        path: '/about',
        schemaType: 'auto',
      });
      const page = blobs.find((b) =>
        ['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage'].includes(
          (b as { '@type'?: string })['@type'] ?? '',
        ),
      );
      expect(page?.['@type']).toBe('AboutPage');
    });

    it('skips malformed breadcrumb rows', () => {
      const blobs = buildJsonLdBlobs(ctx, 'pages', {
        title: 'X',
        path: '/x',
        breadcrumb: [
          { path: '', label: 'Bad' },
          { path: '/x', label: '' },
          { path: '/x', label: 'Good' },
        ],
      });
      const breadcrumb = blobs.find((b) => b['@type'] === 'BreadcrumbList') as
        | { itemListElement: { name: string }[] }
        | undefined;
      expect(breadcrumb?.itemListElement).toHaveLength(2);
      expect(breadcrumb?.itemListElement[1]?.name).toBe('Good');
    });
  });

  describe('webinars', () => {
    const baseWebinar = {
      slug: 'sbom-deep-dive',
      title: 'SBOM deep dive',
      abstract: 'How CleanStart ships verifiable SBOMs.',
      startsAt: '2026-06-15T16:00:00Z',
      endsAt: '2026-06-15T17:00:00Z',
      registrationUrl: 'https://example.com/webinar/register',
    };

    it('emits Event with OnlineEventAttendanceMode and a VirtualLocation', () => {
      const blobs = buildJsonLdBlobs(ctx, 'webinars', baseWebinar);
      const event = blobs.find((b) => b['@type'] === 'Event') as
        | { eventAttendanceMode?: string; location?: { '@type'?: string } }
        | undefined;
      expect(event?.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
      expect(event?.location?.['@type']).toBe('VirtualLocation');
    });

    it('flips eventStatus to EventCancelled when the webinar is cancelled', () => {
      const blobs = buildJsonLdBlobs(ctx, 'webinars', {
        ...baseWebinar,
        eventStatus: 'cancelled',
      });
      const event = blobs.find((b) => b['@type'] === 'Event') as
        | { eventStatus?: string }
        | undefined;
      expect(event?.eventStatus).toBe('https://schema.org/EventCancelled');
    });
  });
});
