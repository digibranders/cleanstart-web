#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed / upsert the five marketing-site lead-capture forms that relay to
 * HubSpot via the Forms Submissions API.
 *
 * Each Payload `forms` row mirrors one HubSpot form in the "website" folder:
 *   - field `name`s are the HubSpot internal property names (no mapping layer;
 *     the hubspot lead handler posts `fields` verbatim).
 *   - `hubspotFormGuid` carries the GUID the handler submits to.
 *   - consent is NOT modelled as form fields — the web forms capture it via
 *     the shared LeadConsent UI and send a `consent` snapshot object, which
 *     the submit endpoint stamps with the live policy version. HubSpot owns
 *     the user + internal notification emails, so `notifyTo` stays empty.
 *
 * Idempotent: upserts by slug. Re-running updates the existing row in place
 * (and re-publishes it) rather than creating duplicates.
 *
 * Run from apps/cms with the env file loaded:
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/seed-website-forms.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

type SeedField = {
  name: string;
  type: 'text' | 'email' | 'textarea';
  label: string;
  required?: boolean;
};

type SeedForm = {
  slug: string;
  name: string;
  hubspotFormGuid: string;
  fields: SeedField[];
};

const FORMS: readonly SeedForm[] = [
  {
    slug: 'book-a-demo',
    name: 'Book a Demo',
    hubspotFormGuid: '3a491549-929f-41df-8446-32702d793780',
    fields: [
      { name: 'firstname', type: 'text', label: 'First name', required: true },
      { name: 'lastname', type: 'text', label: 'Last name' },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'company', type: 'text', label: 'Company', required: true },
      { name: 'country', type: 'text', label: 'Country/Region' },
      { name: 'phone', type: 'text', label: 'Phone', required: true },
      {
        name: 'how_did_you_hear_about_cleanstart_',
        type: 'textarea',
        label: 'How did you hear about CleanStart?',
      },
    ],
  },
  {
    slug: 'contact',
    name: 'Contact Us',
    hubspotFormGuid: '380525d8-f536-4ef8-a01a-2815ea542e5d',
    fields: [
      { name: 'firstname', type: 'text', label: 'First name', required: true },
      { name: 'lastname', type: 'text', label: 'Last name' },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'company', type: 'text', label: 'Company' },
      { name: 'phone', type: 'text', label: 'Phone' },
      { name: 'enter_message', type: 'textarea', label: 'Brief requirement', required: true },
    ],
  },
  {
    slug: 'newsletter',
    name: 'Newsletter',
    hubspotFormGuid: 'd23691e3-fabd-41d1-8d19-3384d6043179',
    fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
  },
  {
    slug: 'resource-capture',
    name: 'Resource Lead Capture',
    hubspotFormGuid: '82790e37-d079-428c-8145-70749a164fe8',
    fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
  },
];

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  for (const form of FORMS) {
    const data = {
      name: form.name,
      slug: form.slug,
      fields: form.fields,
      submitLabel: 'Submit',
      postSubmit: { kind: 'message' as const },
      crmHandlers: ['hubspot' as const],
      hubspotFormGuid: form.hubspotFormGuid,
      _status: 'published' as const,
    };

    const existing = await payload.find({
      collection: 'forms',
      where: { slug: { equals: form.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    const current = existing.docs[0];
    if (current) {
      await payload.update({ collection: 'forms', id: current.id, data, overrideAccess: true });
      payload.logger.info(`✓ updated forms/${form.slug} (id ${current.id})`);
    } else {
      const created = await payload.create({ collection: 'forms', data, overrideAccess: true });
      payload.logger.info(`✓ created forms/${form.slug} (id ${created.id})`);
    }
  }

  payload.logger.info('Done seeding website forms.');
  process.exit(0);
};

// Top-level await so the seeding completes before the process exits — works
// under both `tsx` (local) and `payload run` (in-container, prod), the latter
// of which exits as soon as module evaluation settles.
try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
