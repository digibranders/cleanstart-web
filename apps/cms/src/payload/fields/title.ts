import type { TextField } from 'payload';

import { normaliseText } from '../lib/normalise-text';

/**
 * Shared document-title field used by every content collection.
 * Trims leading/trailing whitespace and collapses internal runs on
 * every save so the SEO sidebar's character counter stays accurate
 * regardless of how data enters the system.
 */
export const contentTitleField: TextField = {
  name: 'title',
  type: 'text',
  required: true,
  hooks: {
    beforeChange: [({ value }) => normaliseText(value)],
  },
};