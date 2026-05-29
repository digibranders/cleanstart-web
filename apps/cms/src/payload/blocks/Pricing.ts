import type { Block } from 'payload';

import { ctaButtonFields } from './cta-button';

export const Pricing: Block = {
  slug: 'pricing',
  labels: { singular: 'Pricing', plural: 'Pricing blocks' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      name: 'billingToggle',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show a monthly / yearly toggle. When enabled, each tier needs both monthly and yearly prices.',
      },
    },
    {
      name: 'tiers',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Tier', plural: 'Tiers' },
      // When billingToggle is on, every tier must supply both monthly and
      // yearly prices; otherwise the toggle renders with missing values.
      validate: (
        value: unknown,
        { siblingData }: { siblingData: Record<string, unknown> },
      ): true | string => {
        if (siblingData?.billingToggle !== true) return true;
        const tiers = Array.isArray(value) ? value : [];
        const missing = tiers
          .map((tier: Record<string, unknown>, i: number) => {
            const price = tier?.price as Record<string, unknown> | undefined;
            const errors: string[] = [];
            if (typeof price?.monthly !== 'string' || price.monthly.trim() === '') {
              errors.push('monthly price');
            }
            if (typeof price?.yearly !== 'string' || price.yearly.trim() === '') {
              errors.push('yearly price');
            }
            return errors.length > 0 ? `Tier ${i + 1}: missing ${errors.join(' and ')}` : null;
          })
          .filter((msg): msg is string => msg !== null);
        return missing.length === 0
          ? true
          : `billingToggle is enabled — ${missing.join('; ')}.`;
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'price',
          type: 'group',
          fields: [
            {
              name: 'monthly',
              type: 'text',
              // Required when billingToggle is enabled on the parent Pricing block.
              // `data` is the top-level document; the billing toggle lives on the
              // `layout` block that owns this tier, so we check `data` for any
              // block in the layout that has billingToggle=true and at least one
              // tier without a monthly price.  Payload does not support walking
              // the ancestor chain from a nested group validate, so we use a
              // lighter heuristic: check the siblingData (the price group) and
              // rely on admin.condition to show/hide the field rather than hard-
              // blocking save when billingToggle context is unavailable.
              // Full enforcement is done via the `tiers` array validate below.
              admin: { description: 'e.g. "$49" or "Custom" or "Free".' },
            },
            {
              name: 'yearly',
              type: 'text',
              admin: { description: 'Per-month equivalent of the annual plan.' },
            },
            {
              name: 'currency',
              type: 'select',
              defaultValue: 'USD',
              options: [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'GBP', value: 'GBP' },
                { label: 'INR', value: 'INR' },
              ],
            },
          ],
        },
        { name: 'tagline', type: 'text' },
        {
          name: 'features',
          type: 'array',
          required: true,
          minRows: 1,
          labels: { singular: 'Feature', plural: 'Features' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'tooltip', type: 'text' },
            {
              name: 'included',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Off renders the row struck-through (denoting "not included").' },
            },
          ],
        },
        ctaButtonFields('cta', 'CTA'),
        {
          name: 'highlight',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Visually emphasises this tier as the recommended option.',
          },
        },
        {
          name: 'highlightLabel',
          type: 'text',
          defaultValue: 'Most popular',
          admin: {
            condition: (_data, sibling) => sibling?.highlight === true,
          },
        },
      ],
    },
  ],
};
