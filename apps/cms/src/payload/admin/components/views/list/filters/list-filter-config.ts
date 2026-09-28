export type ListFilterFieldConfig =
  | {
      readonly kind: 'options';
      readonly name: string;
      readonly label: string;
      readonly options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
    }
  | {
      readonly kind: 'relationship';
      readonly name: string;
      readonly label: string;
      readonly relationTo: string;
      /** Field on the related collection used as the option label. Defaults to 'name'. */
      readonly labelField?: string;
    };

const STATUS_FILTER: ListFilterFieldConfig = {
  kind: 'options',
  name: '_status',
  label: 'Status',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
};

/**
 * Per-collection multiselect filter definitions for the list-view filter
 * bar (`ListFilterBar`). A collection with no entry here renders no bar —
 * the mechanism is opt-in per collection, not automatic for every list.
 */
export const LIST_FILTER_FIELDS: Record<string, ReadonlyArray<ListFilterFieldConfig>> = {
  blogs: [
    { kind: 'relationship', name: 'categories', label: 'Category', relationTo: 'categories' },
    { kind: 'relationship', name: 'authors', label: 'Author', relationTo: 'authors' },
    STATUS_FILTER,
  ],
  news: [
    {
      kind: 'relationship',
      name: 'newsCategories',
      label: 'Category',
      relationTo: 'newsCategories',
    },
    { kind: 'relationship', name: 'authors', label: 'Author', relationTo: 'authors' },
    STATUS_FILTER,
  ],
  guides: [
    { kind: 'relationship', name: 'authors', label: 'Author', relationTo: 'authors' },
    STATUS_FILTER,
  ],
  'case-studies': [
    { kind: 'relationship', name: 'industryRef', label: 'Industry', relationTo: 'industries' },
    STATUS_FILTER,
  ],
  knowledgeBase: [
    {
      kind: 'relationship',
      name: 'category',
      label: 'Category',
      relationTo: 'knowledgeCategories',
    },
    STATUS_FILTER,
  ],
  events: [
    {
      kind: 'options',
      name: 'registrationMode',
      label: 'Registration',
      options: [
        { label: 'In-house form', value: 'internal' },
        { label: 'External URL', value: 'external' },
      ],
    },
    {
      kind: 'options',
      name: 'eventStatus',
      label: 'Event status',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Postponed', value: 'postponed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    STATUS_FILTER,
  ],
};
