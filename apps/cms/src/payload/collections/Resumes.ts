import type { CollectionConfig, Field, FieldHook } from 'payload';
import { ValidationError } from 'payload';

import { isAdminEditorOrHr } from '../access';
import { ALLOWED_MIME_TYPES, RESUME_MIME_TYPES, checkUploadSize } from '../lib/upload-limits';

type ApplicantSummary = { name: string; email: string; jobTitle: string };

// shortcut: one query per resume row (10 per admin page), no sorting on these columns; add a stored `application` relation if the list needs to sort or filter by applicant.
const lookupApplicant = async (
  req: Parameters<FieldHook>[0]['req'],
  resumeId: number | string,
): Promise<ApplicantSummary | null> => {
  const cacheKey = `resumeApplicant:${resumeId}`;
  const cache = req.context as Record<string, ApplicantSummary | null | undefined>;
  if (cacheKey in cache) return cache[cacheKey] ?? null;
  const { docs } = await req.payload.find({
    collection: 'career-applications',
    where: { or: [{ resume: { equals: resumeId } }, { coverLetterFile: { equals: resumeId } }] },
    limit: 1,
    depth: 0,
    pagination: false,
    req,
  });
  const app = docs[0];
  const summary = app
    ? {
        name: [app.firstName, app.lastName].filter(Boolean).join(' '),
        email: app.email ?? '',
        jobTitle: app.jobTitleSnapshot,
      }
    : null;
  cache[cacheKey] = summary;
  return summary;
};

const applicantField = (name: string, label: string, pick: keyof ApplicantSummary): Field => ({
  name,
  label,
  type: 'text',
  virtual: true,
  admin: { readOnly: true },
  hooks: {
    afterRead: [
      async ({ req, siblingData }) => {
        const id = (siblingData as { id?: number | string }).id;
        if (id === undefined) return undefined;
        return (await lookupApplicant(req, id))?.[pick];
      },
    ],
  },
});

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
    defaultColumns: ['filename', 'applicantName', 'applicantEmail', 'applicantJobTitle', 'createdAt'],
    description: 'Applicant resumes (private). Access-controlled — never public.',
    hidden: false,
  },
  access: {
    read: isAdminEditorOrHr,
    create: () => false,
    update: isAdminEditorOrHr,
    delete: isAdminEditorOrHr,
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
  fields: [
    applicantField('applicantName', 'Applicant', 'name'),
    applicantField('applicantEmail', 'Email', 'email'),
    applicantField('applicantJobTitle', 'Job applied for', 'jobTitle'),
  ],
  timestamps: true,
};
