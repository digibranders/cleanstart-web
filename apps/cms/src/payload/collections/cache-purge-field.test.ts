import type { CollectionConfig } from 'payload';
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

const PURGE_BUTTON_PATH = '@/payload/admin/components/cache/PurgePageButton.tsx#PurgePageButton';

/**
 * The "Purge this page" button is mounted in the document controls strip
 * (next to Save / Publish) via `admin.components.edit.beforeDocumentControls`
 * — either appended by `docStatusBarEditConfig({ showPurge: true })` or, for
 * Authors (stock header), as a direct entry. A `beforeDocumentControls` item
 * is a component-path string or a `{ path }` object.
 */
const hasPurgeButton = (c: CollectionConfig): boolean => {
  const before = c.admin?.components?.edit?.beforeDocumentControls ?? [];
  return before.some((entry) => {
    if (!entry) return false;
    const path = typeof entry === 'string' ? entry : entry.path;
    return path === PURGE_BUTTON_PATH;
  });
};

describe('cache-purge field coverage', () => {
  it('covers exactly the PURGEABLE_COLLECTIONS set', () => {
    const slugs = COLLECTIONS.map((c) => c.slug).sort();
    expect(slugs).toEqual(Object.keys(PURGEABLE_COLLECTIONS).sort());
  });

  it('mounts the purge-page button in the controls strip on every collection', () => {
    for (const c of COLLECTIONS) {
      expect(hasPurgeButton(c), `${c.slug} missing purge-page button`).toBe(true);
    }
  });
});
