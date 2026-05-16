import type { QuickCreateField } from '@cleanstart/ui';

export type QuickCreateConfig = {
  readonly title: string;
  /** Matches the collection's `versions.drafts` flag. */
  readonly supportsDrafts: boolean;
  readonly fields: ReadonlyArray<QuickCreateField>;
};

/**
 * Per-collection quick-create modal schema. Keyed by collection slug —
 * read by `RelationshipField` when the "+ New" affordance is invoked.
 *
 * Add a new entry only when:
 *  - The collection's create surface is small (1–3 essential fields).
 *  - The fields here match the collection's `required: true` server-side
 *    fields, plus the slug field. Anything else can be filled in later
 *    via the full edit view (a "Fill in profile →" toast action takes
 *    the editor there).
 *
 * The `DEFAULT_HINT.showCreate` flag in RelationshipField is set to
 * false so collections without an entry here do NOT show "+ New".
 * Quick-create is the only supported create path post-Phase 2.
 */
export const QUICK_CREATE_CONFIG: Record<string, QuickCreateConfig | undefined> = {
  authors: {
    title: 'New author',
    supportsDrafts: true,
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        placeholder: 'Jane Doe',
        maxLength: 120,
      },
      { name: 'slug', type: 'slug', label: 'Slug', source: 'name' },
    ],
  },
  categories: {
    title: 'New category',
    supportsDrafts: true,
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        placeholder: 'Supply chain security',
        maxLength: 120,
      },
      { name: 'slug', type: 'slug', label: 'Slug', source: 'name' },
    ],
  },
  newsCategories: {
    title: 'New news category',
    supportsDrafts: true,
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        maxLength: 120,
      },
      { name: 'slug', type: 'slug', label: 'Slug', source: 'name' },
    ],
  },
  knowledgeCategories: {
    title: 'New knowledge category',
    supportsDrafts: true,
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        maxLength: 120,
      },
      { name: 'slug', type: 'slug', label: 'Slug', source: 'name' },
    ],
  },
  jobLocations: {
    title: 'New job location',
    supportsDrafts: false, // collection has no `versions: { drafts: true }`
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Display name',
        required: true,
        placeholder: 'San Francisco, CA',
        maxLength: 120,
      },
      {
        name: 'isoCountry',
        type: 'text',
        label: 'ISO country (2 letters, uppercase)',
        required: true,
        placeholder: 'US',
        maxLength: 2,
      },
      {
        name: 'type',
        type: 'select',
        label: 'Type',
        required: true,
        options: [
          { label: 'City', value: 'city' },
          { label: 'Region', value: 'region' },
          { label: 'Country', value: 'country' },
        ],
      },
    ],
  },
};
