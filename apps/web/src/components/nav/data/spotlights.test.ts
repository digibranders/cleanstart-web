import { describe, it, expect } from 'vitest';
import {
  resolveResourcesSpotlight,
  resolveCompanySpotlight,
  BULLETIN_EVERGREEN,
  TALENT_NETWORK_EVERGREEN,
} from './spotlights';

describe('resolveResourcesSpotlight', () => {
  it('returns event card when a near event exists', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => ({ title: 'KubeCon', slug: 'kubecon', startsAt: '2026-06-15' }),
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out.kind).toBe('event');
  });

  it('falls through to webinar when no event', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => ({ title: 'SBOM live', slug: 'sbom-live', startsAt: '2026-06-12' }),
      fetchSpotlightGlobal: async () => null,
    });
    expect(out.kind).toBe('webinar');
  });

  it('falls through to CMS spotlight when no event or webinar', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => ({
        headline: 'Promo',
        sub: 'sub',
        ctaLabel: 'Read',
        ctaHref: '/promo',
      }),
    });
    expect(out.kind).toBe('cms');
  });

  it('skips expired CMS spotlight and returns evergreen', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => ({
        headline: 'Old',
        sub: 'sub',
        ctaLabel: 'Read',
        ctaHref: '/promo',
        expiresAt: '2026-01-01',
      }),
    });
    expect(out).toBe(BULLETIN_EVERGREEN);
  });

  it('returns evergreen when everything else is empty', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out).toBe(BULLETIN_EVERGREEN);
  });
});

describe('resolveCompanySpotlight', () => {
  it('returns hiring card when openRoles > 0', async () => {
    const out = await resolveCompanySpotlight({
      now: new Date('2026-06-01'),
      fetchOpenRoles: async () => 7,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out.kind).toBe('careers');
  });

  it('falls through to CMS spotlight when no roles', async () => {
    const out = await resolveCompanySpotlight({
      now: new Date('2026-06-01'),
      fetchOpenRoles: async () => 0,
      fetchSpotlightGlobal: async () => ({
        headline: 'Series B',
        sub: 'sub',
        ctaLabel: 'Read',
        ctaHref: '/news/series-b',
      }),
    });
    expect(out.kind).toBe('cms');
  });

  it('returns talent network evergreen when nothing else', async () => {
    const out = await resolveCompanySpotlight({
      now: new Date('2026-06-01'),
      fetchOpenRoles: async () => 0,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out).toBe(TALENT_NETWORK_EVERGREEN);
  });
});
