import type { CollectionConfig, Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { PURGEABLE_COLLECTIONS } from '../lib/web-pages';
import { Authors } from './Authors';
import { Blogs } from './Blogs';
import { CaseStudies } from './CaseStudies';
import { Events } from './Events';
import { Guides } from './Guides';
import { Jobs } from './Jobs';
import { KnowledgeBase } from './KnowledgeBase';
import { LegalDocuments } from './Legal';
import { News } from './News';
import { PodcastEpisodes } from './PodcastEpisodes';
import { Resources } from './Resources';
import { Webinars } from './Webinars';

const COLLECTIONS: CollectionConfig[] = [
  Blogs,
  News,
  Guides,
  Resources,
  Events,
  Jobs,
  KnowledgeBase,
  LegalDocuments,
  Authors,
  CaseStudies,
  Webinars,
  PodcastEpisodes,
];

const hasPurgeField = (c: CollectionConfig): boolean =>
  c.fields.some(
    (f: Field) => 'name' in f && f.type === 'ui' && f.name === 'purgeCache',
  );

describe('cache-purge field coverage', () => {
  it('covers exactly the PURGEABLE_COLLECTIONS set', () => {
    const slugs = COLLECTIONS.map((c) => c.slug).sort();
    expect(slugs).toEqual(Object.keys(PURGEABLE_COLLECTIONS).sort());
  });

  it('mounts the purgeCache ui field on every collection', () => {
    for (const c of COLLECTIONS) {
      expect(hasPurgeField(c), `${c.slug} missing purgeCache field`).toBe(true);
    }
  });
});
