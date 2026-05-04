import type { Field, GroupField } from 'payload';

const INTERNAL_DOC_TARGETS = [
  'pages',
  'blogs',
  'news',
  'guides',
  'resources',
  'events',
  'webinars',
  'jobs',
  'authors',
  'categories',
  'newsCategories',
] as const;

type LinkFieldOptions = {
  /** Field name (default: `link`). */
  name?: string;
  /** Visible label (default derived from name). */
  label?: string;
  /** Whether the link itself is required. Defaults false. */
  required?: boolean;
  /** Add a `text` sibling for the visible label inside the link group. Defaults true. */
  withText?: boolean;
};

/**
 * Reusable typed-link group field.
 *
 * - kind: 'doc' | 'media' | 'url' (discriminator)
 * - target: relationship to internal collection (when kind=doc)
 * - mediaTarget: upload to media (when kind=media)
 * - url: text (when kind=url)
 * - text: optional visible label (when withText=true)
 * - newTab: opens in new tab (auto-applies rel=noopener noreferrer when true)
 *
 * Internal-doc URLs auto-resolve at render time; slug changes propagate
 * without editor action — same auto-link-survival as inline LinkNodes
 * in rich text.
 */
export const linkField = ({
  name = 'link',
  label,
  required = false,
  withText = true,
}: LinkFieldOptions = {}): GroupField => {
  const fields: Field[] = [
    {
      name: 'kind',
      type: 'select',
      required,
      defaultValue: 'doc',
      options: [
        { label: 'Internal doc', value: 'doc' },
        { label: 'Media (uploaded file)', value: 'media' },
        { label: 'External URL', value: 'url' },
      ],
    },
    {
      name: 'target',
      type: 'relationship',
      relationTo: [...INTERNAL_DOC_TARGETS],
      admin: {
        description:
          'Stored as a doc ID — slug changes auto-propagate. URL resolved at render time.',
        condition: (_data, sibling) => sibling?.kind === 'doc',
      },
    },
    {
      name: 'mediaTarget',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_data, sibling) => sibling?.kind === 'media',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'External URL. Validated at save (https?://).',
        condition: (_data, sibling) => sibling?.kind === 'url',
      },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Opens in a new tab. Auto-applies rel="noopener noreferrer".',
        condition: (_data, sibling) => sibling?.kind === 'url',
      },
    },
  ];

  if (withText) {
    fields.unshift({
      name: 'text',
      type: 'text',
      admin: { description: 'Visible label. Falls back to the target page title.' },
    });
  }

  const groupLabel = label ?? (name === 'link' ? 'Link' : name);

  return {
    name,
    type: 'group',
    label: groupLabel,
    fields,
  };
};
