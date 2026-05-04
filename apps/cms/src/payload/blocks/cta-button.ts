import type { Field } from 'payload';

import { linkField } from '../fields/link';

const VARIANT_OPTIONS = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Ghost', value: 'ghost' },
];

/**
 * Shared CTA-button group field used inside blocks (Hero, CTA, FeatureGrid item, etc.).
 * Wraps the typed link picker with a visual variant + optional analytics tracking id.
 */
export const ctaButtonFields = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'primary',
      options: VARIANT_OPTIONS,
    },
    {
      name: 'trackingId',
      type: 'text',
      admin: { description: 'Custom analytics event id emitted on click.' },
    },
    linkField({ name: 'link', withText: true }),
  ],
});
