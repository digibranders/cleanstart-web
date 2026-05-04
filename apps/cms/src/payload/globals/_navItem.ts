import type { Field } from 'payload';

/**
 * Discriminated nav-item shape shared by mainNav and footerNav columns.
 *
 * Mega-menu columns reuse the same item shape (one level of nesting only —
 * mega-menu inside mega-menu is forbidden by config). The mega-menu kind is
 * top-level only: nav columns inside footerNav use the same shape via
 * footerNav.columns[].items[].
 */
export const navItemFields: Field[] = [
  {
    name: 'kind',
    type: 'select',
    required: true,
    defaultValue: 'internal-doc',
    options: [
      { label: 'Internal doc', value: 'internal-doc' },
      { label: 'External URL', value: 'external-url' },
      { label: 'CTA', value: 'cta' },
    ],
  },
  { name: 'label', type: 'text', required: true },
  {
    name: 'target',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      description:
        'Stored as a doc ID. URL auto-resolves at render — slug changes propagate without editor action.',
      condition: (_data, sibling) => sibling?.kind === 'internal-doc',
    },
  },
  {
    name: 'href',
    type: 'text',
    admin: {
      description: 'External URL. Validated against https?:// at save.',
      condition: (_data, sibling) => sibling?.kind === 'external-url',
    },
  },
  {
    name: 'targetBlank',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      condition: (_data, sibling) => sibling?.kind === 'external-url',
    },
  },
  {
    name: 'variant',
    type: 'select',
    defaultValue: 'primary',
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Ghost', value: 'ghost' },
    ],
    admin: {
      condition: (_data, sibling) => sibling?.kind === 'cta',
    },
  },
  {
    name: 'trackingId',
    type: 'text',
    admin: {
      description: 'Custom analytics event id emitted on click.',
      condition: (_data, sibling) => sibling?.kind === 'cta',
    },
  },
];
