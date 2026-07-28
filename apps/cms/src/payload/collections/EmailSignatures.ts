import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { emailSignatureRenderEndpoint } from '../endpoints/email-signature-render';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { E164_PATTERN } from '../lib/email-signature/render';
import { slugField } from '../fields/slug';

/**
 * Per-employee email-signature data. Holds only what actually varies between
 * people — name, title, email, phone. Logo, tagline, divider and the social row
 * are identical for everyone and live in the `signatureTemplates` markup.
 *
 * `slug` is the public URL segment: /email-signatures/{slug} renders the bare
 * signature for copy-paste into a mail client.
 */

/**
 * The groupings the legacy directory carried as HTML comments. Kept as a plain
 * select rather than a relationship to the `departments` taxonomy: that
 * taxonomy classifies job postings (it has slugs, SEO fields and a parent
 * hierarchy for landing pages) and its values do not line up with how the
 * signature directory is organised for browsing.
 */
export const SIGNATURE_GROUPS = [
  // In use today.
  'Executive Leadership',
  'Sales & Regional Leadership',
  'Marketing & Communications',
  'HR & People Operations',
  'Account Management & Sales Operations',
  'Engineering & Technical Solutions',
  'Product & Program Management',
  'Infrastructure & Systems',
  'Legal',
  // Reserved headroom. Postgres cannot remove an enum label, and adding one
  // needs a migration + deploy — so the common remaining departments are
  // declared up front and simply never render until somebody is assigned to
  // them (the directory drops empty groups). Cheap insurance against a
  // one-line change blocking an org update.
  'Finance & Accounts',
  'Customer Success',
  'Partnerships & Alliances',
  'Operations',
  'Data & Analytics',
  'Design',
  'IT & Security',
  'Quality Assurance',
  'Training & Enablement',
  'Administration',
] as const;

export const EmailSignatures: CollectionConfig = {
  slug: 'emailSignatures',
  labels: { singular: 'Email Signature', plural: 'Email Signatures' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'jobTitle', 'email', 'group', 'active', 'updatedAt'],
    group: 'Brand',
    description:
      'Employee email signatures. The directory lives at /email-signatures on the website.',
    components: {
      // "Purge this page" beside Save. This collection uses Payload's stock doc
      // header, so it is a direct beforeDocumentControls entry (same shape as
      // Authors) rather than the docStatusBarEditConfig path.
      edit: {
        beforeDocumentControls: [
          { path: '@/payload/admin/components/cache/PurgePageButton.tsx#PurgePageButton' },
        ],
      },
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Full name as it should appear in the signature.' },
    },
    slugField({ source: 'name' }),
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
      admin: { description: 'Exactly as it should read, e.g. "Co-founder & CEO".' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phoneE164',
      type: 'text',
      required: true,
      label: 'Phone (E.164)',
      // The collection is publicly readable so the web directory can list
      // people without an API key, but a direct dial for every employee is the
      // one field that must not be harvestable from
      // `GET /api/emailSignatures`. The render endpoint reads with
      // `overrideAccess: true`, so signatures still render for anonymous
      // visitors — only the JSON API hides it.
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description:
          'International format, digits only after the +, e.g. +6596847785. Used for the tel: link so the number is dialable from any country.',
      },
      validate: (value: string | string[] | null | undefined): true | string => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Phone number is required.';
        }
        if (!E164_PATTERN.test(value.trim())) {
          return 'Use E.164 format: a leading +, country code, then digits only — e.g. +6596847785.';
        }
        return true;
      },
      hooks: {
        // Editors paste numbers with spaces and hyphens out of habit; strip
        // them rather than failing validation on a number that is otherwise
        // correct.
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.replace(/[\s()-]/g, '') : value),
        ],
      },
    },
    {
      name: 'phoneDisplay',
      type: 'text',
      label: 'Phone (display)',
      // Same reasoning as `phoneE164` — this is the same number, formatted.
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description:
          'How the number reads in the signature, e.g. "+65-96847785". Leave blank to show the E.164 value.',
      },
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'signatureTemplates',
      required: true,
      // Pre-select the template flagged `isDefault`, which is what that flag
      // promises. Without this an editor adding someone has to know which
      // template to pick, and the field is required — so the most common
      // action on this collection would fail on first save.
      defaultValue: async ({ req }) => {
        const result = await req.payload.find({
          collection: 'signatureTemplates',
          where: { isDefault: { equals: true } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        return result.docs[0]?.id;
      },
      admin: {
        position: 'sidebar',
        description:
          'Which markup to render this signature with. Defaults to the template marked "Default".',
      },
    },
    {
      name: 'group',
      type: 'select',
      required: true,
      options: SIGNATURE_GROUPS.map((group) => ({ label: group, value: group })),
      admin: {
        position: 'sidebar',
        description: 'Section heading this person appears under in the directory.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Order within the group — lower first. Ties fall back to name.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Uncheck when someone leaves: the directory hides them and their signature URL stops resolving. Preferred over deleting, which loses the record.',
      },
    },
  ],
  endpoints: [emailSignatureRenderEndpoint],
  hooks: {
    // On-demand purge on every save and delete. Without this, deactivating
    // someone leaves their signature live until the ISR window and the CMS
    // API's Cloudflare TTL both expire — hours, not the "stops resolving" the
    // `active` field promises.
    afterChange: [revalidateWebPublishAfterChangeHook('emailSignatures')],
    afterDelete: [revalidateWebAfterDeleteHook('emailSignatures')],
  },
  versions: true,
  timestamps: true,
};
