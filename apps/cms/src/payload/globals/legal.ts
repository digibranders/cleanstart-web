import type { GlobalConfig } from 'payload';

import { isAdmin, isAuthenticated } from '../access';

export const Legal: GlobalConfig = {
  slug: 'legal',
  label: 'Legal',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  // Compliance settings only. The PUBLIC policy CONTENT (Privacy/Terms/AUP/…)
  // lives in the `legalDocuments` collection (rendered at /legal/*); the old
  // privacy/terms/aup rich-text + dpaContactEmail fields here were never
  // consumed and were removed. `policyVersion` is load-bearing — it is
  // snapshotted onto every lead/application at submit time for GDPR audit.
  fields: [
    {
      name: 'policyVersion',
      type: 'text',
      required: true,
      admin: {
        description:
          'Date or semver tag bumped on each policy change (e.g. 2026-04-15). Snapshotted onto every lead at submit time for GDPR audit defensibility.',
      },
    },
  ],
};
