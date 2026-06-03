import type { TextField } from 'payload';

import { normaliseText } from '../lib/normalise-text';

/**
 * Shared document-title field used by every content collection.
 * Trims leading/trailing whitespace and collapses internal runs on
 * every save so the SEO sidebar's character counter stays accurate
 * regardless of how data enters the system.
 *
 * `beforeDuplicate` appends " (copy)" to the title when a document is
 * cloned (list-view Duplicate or the edit-view kebab) so the copy is
 * distinguishable from its source in the list — mirroring the "-copy"
 * suffix Payload already adds to the unique slug.
 */
export const contentTitleField: TextField = {
  name: 'title',
  type: 'text',
  required: true,
  hooks: {
    beforeChange: [({ value }) => normaliseText(value)],
    beforeDuplicate: [
      ({ value }) =>
        typeof value === 'string' && value.trim().length > 0 ? `${value} (copy)` : value,
    ],
  },
};