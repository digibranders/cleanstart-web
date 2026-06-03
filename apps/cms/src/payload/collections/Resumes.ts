import type { CollectionConfig } from 'payload';
import { ValidationError } from 'payload';

import { isAdminOrEditor } from '../access';
import { ALLOWED_MIME_TYPES, RESUME_MIME_TYPES, checkUploadSize } from '../lib/upload-limits';

/**
 * Private resume store for career applications. Unlike `media`, this collection
 * is NOT registered with `disablePayloadAccessControl`, so files are served
 * through Payload's access-controlled `/api/resumes/file/:filename` route and
 * never exposed on a public R2 URL. Rows are created by the careers-apply
 * endpoint via overrideAccess; only admins/editors can read or download.
 */
export const Resumes: CollectionConfig = {
  slug: 'resumes',
  labels: { singular: 'Resume', plural: 'Resumes' },
  admin: {
    group: 'Recruiting',
    useAsTitle: 'filename',
    description: 'Applicant resumes (private). Access-controlled — never public.',
    hidden: false,
  },
  access: {
    read: isAdminOrEditor,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  upload: {
    mimeTypes: [...RESUME_MIME_TYPES],
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const file = req.file;
        if (file) {
          const sized = checkUploadSize(file.mimetype, file.size);
          if (!sized.ok) {
            throw new ValidationError({
              errors: [{ message: sized.reason, path: 'filename' }],
            });
          }
          if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
            throw new ValidationError({
              errors: [{ message: 'Unsupported file type for resume.', path: 'filename' }],
            });
          }
        }
        return data;
      },
    ],
  },
  fields: [],
  timestamps: true,
};
