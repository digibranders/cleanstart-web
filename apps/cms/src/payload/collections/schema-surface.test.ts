import { describe, expect, it } from 'vitest';
import type { CollectionConfig, Field } from 'payload';

import { AboutGalleries } from './AboutGalleries';
import { AuditLog } from './audit-log';
import { Authors } from './Authors';
import { Blogs } from './Blogs';
import { BrokenLinks } from './BrokenLinks';
import { Categories } from './Categories';
import { EmailAssets } from './EmailAssets';
import { EmailSignatures } from './EmailSignatures';
import { SignatureTemplates } from './SignatureTemplates';
import { Events } from './Events';
import { Forms } from './Forms';
import { Guides } from './Guides';
import { Departments } from './Departments';
import { Industries } from './Industries';
import { PressTypes } from './PressTypes';
import { Regions } from './Regions';
import { ResourceTypes } from './ResourceTypes';
import { WebinarTypes } from './WebinarTypes';
import { JobLocations } from './JobLocations';
import { Jobs } from './Jobs';
import { KnowledgeBase } from './KnowledgeBase';
import { KnowledgeCategories } from './KnowledgeCategories';
import { Leads } from './Leads';
import { Media } from './Media';
import { News } from './News';
import { NewsCategories } from './NewsCategories';
import { Pages } from './Pages';
import { PodcastEpisodes } from './PodcastEpisodes';
import { Redirects } from './Redirects';
import { Resources } from './Resources';
import { SearchLog } from './SearchLog';
import { Users } from './Users';
import { Webinars } from './Webinars';

type FieldShape = {
  name?: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  hasMany?: boolean;
  relationTo?: string | string[];
  fields?: FieldShape[];
  blocks?: { slug: string; fields: FieldShape[] }[];
  options?: (string | { value: string })[];
};

const summarizeField = (field: Field): FieldShape => {
  const out: FieldShape = { type: field.type };
  if ('name' in field && typeof field.name === 'string') out.name = field.name;
  if ('required' in field && field.required) out.required = true;
  if ('unique' in field && field.unique) out.unique = true;
  if ('hasMany' in field && field.hasMany) out.hasMany = true;
  if ('relationTo' in field && field.relationTo) {
    out.relationTo = field.relationTo as string | string[];
  }
  if ('fields' in field && Array.isArray(field.fields)) {
    out.fields = field.fields.map(summarizeField);
  }
  if ('blocks' in field && Array.isArray(field.blocks)) {
    out.blocks = field.blocks.map((b) => ({
      slug: b.slug,
      fields: (b.fields ?? []).map(summarizeField),
    }));
  }
  if ('options' in field && Array.isArray(field.options)) {
    out.options = field.options.map((o) =>
      typeof o === 'string' ? o : { value: String(o.value) },
    );
  }
  return out;
};

const summarizeCollection = (config: CollectionConfig): unknown => ({
  slug: config.slug,
  versions: config.versions
    ? typeof config.versions === 'object'
      ? { drafts: !!config.versions.drafts }
      : { drafts: false }
    : undefined,
  timestamps: config.timestamps,
  fields: config.fields.map(summarizeField),
  hooks: {
    beforeChange: (config.hooks?.beforeChange ?? []).length,
    afterChange: (config.hooks?.afterChange ?? []).length,
    beforeValidate: (config.hooks?.beforeValidate ?? []).length,
    afterDelete: (config.hooks?.afterDelete ?? []).length,
  },
});

const collections: { name: string; config: CollectionConfig }[] = [
  { name: 'AboutGalleries', config: AboutGalleries },
  { name: 'AuditLog', config: AuditLog },
  { name: 'Authors', config: Authors },
  { name: 'Blogs', config: Blogs },
  { name: 'BrokenLinks', config: BrokenLinks },
  { name: 'Categories', config: Categories },
  { name: 'EmailAssets', config: EmailAssets },
  { name: 'EmailSignatures', config: EmailSignatures },
  { name: 'SignatureTemplates', config: SignatureTemplates },
  { name: 'Events', config: Events },
  { name: 'Forms', config: Forms },
  { name: 'Guides', config: Guides },
  { name: 'Departments', config: Departments },
  { name: 'Industries', config: Industries },
  { name: 'Regions', config: Regions },
  { name: 'PressTypes', config: PressTypes },
  { name: 'WebinarTypes', config: WebinarTypes },
  { name: 'ResourceTypes', config: ResourceTypes },
  { name: 'JobLocations', config: JobLocations },
  { name: 'Jobs', config: Jobs },
  { name: 'KnowledgeBase', config: KnowledgeBase },
  { name: 'KnowledgeCategories', config: KnowledgeCategories },
  { name: 'Leads', config: Leads },
  { name: 'Media', config: Media },
  { name: 'News', config: News },
  { name: 'NewsCategories', config: NewsCategories },
  { name: 'Pages', config: Pages },
  { name: 'PodcastEpisodes', config: PodcastEpisodes },
  { name: 'Redirects', config: Redirects },
  { name: 'Resources', config: Resources },
  { name: 'SearchLog', config: SearchLog },
  { name: 'Users', config: Users },
  { name: 'Webinars', config: Webinars },
];

describe('collection schema surface', () => {
  for (const { name, config } of collections) {
    it(`${name} has a stable public shape`, async () => {
      const summary = summarizeCollection(config);
      await expect(JSON.stringify(summary, null, 2)).toMatchFileSnapshot(
        `./__snapshots__/${name}.snap.json`,
      );
    });
  }
});
