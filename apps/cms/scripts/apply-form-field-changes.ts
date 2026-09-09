#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Apply the 2026-09 forms overhaul to the `forms` field definitions.
 *
 * Three changes, all of them content rather than schema (the columns and enum
 * values ship in migration 20260909_120000_add_form_tel_and_business_email):
 *
 *   1. Every `phone` field becomes `type: 'tel'`, so the web app renders it
 *      with a country-code selector and the API validates it as E.164.
 *   2. The email field on the high-intent forms gets `requireBusinessEmail`,
 *      rejecting consumer webmail and disposable mailboxes. Newsletter and
 *      resource-capture are deliberately left off: a personal address is a
 *      legitimate signup there.
 *   3. Book a Demo drops `company` and `country`. Company is derived from the
 *      email domain by the company-from-domain handler; country comes from the
 *      dial code chosen in the phone field.
 *
 * Goes through payload.update rather than SQL so the collection hooks run and
 * `schemaVersion` bumps exactly as an editor's save would. Idempotent: a
 * second run reports no changes.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/apply-form-field-changes.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/apply-form-field-changes.ts
 *
 * PROD note: bumping `schemaVersion` invalidates in-flight submissions from a
 * page a visitor already had open, which the endpoint answers with a
 * stale-schema error and the form retries. Run in a quiet window.
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

/**
 * Forms whose email field must be a company address. Newsletter and
 * resource-capture are absent on purpose.
 *
 * Deal registration and career applications are not `forms` rows: they post to
 * their own endpoints, and their rules live in `lib/form-field-schemas.ts`.
 */
const BUSINESS_EMAIL_FORMS = new Set(['book-a-demo', 'contact']);

/** Fields to delete, per form slug. */
const REMOVED_FIELDS: Readonly<Record<string, readonly string[]>> = {
  'book-a-demo': ['company', 'country'],
};

/**
 * Fields to append when missing, per form slug. Matched by `name`, so a field
 * an editor has since renamed or re-typed is left alone.
 *
 * `enter_message` is the same HubSpot property the contact form already
 * submits. If the HubSpot "Book a Demo" form does not define it, the Forms API
 * rejects the whole submission — the handler drops the field and retries so the
 * contact still syncs, and records `dropped-unknown-fields` on the lead. Adding
 * the field to that form in HubSpot is what makes the message reach the CRM.
 */
const ADDED_FIELDS: Readonly<Record<string, readonly FormField[]>> = {
  'book-a-demo': [
    {
      name: 'enter_message',
      type: 'textarea',
      label: 'How can we help?',
      required: false,
      placeholder:
        'We run around 300 containers on EKS and want to cut CVE remediation time before our next audit.',
    },
  ],
};

type FormField = {
  name?: string | null;
  type?: string | null;
  label?: string | null;
  required?: boolean | null;
  placeholder?: string | null;
  requireBusinessEmail?: boolean | null;
  [key: string]: unknown;
};

const isPhoneField = (field: FormField): boolean =>
  typeof field.name === 'string' && /^(phone|.*_phone|.*Phone)$/u.test(field.name);

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config: payloadConfig });

  const forms = await payload.find({
    collection: 'forms',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });

  let changed = 0;

  for (const form of forms.docs) {
    const slug = form.slug as string | null;
    if (!slug) continue;

    const fields = (form.fields ?? []) as FormField[];
    const removed = REMOVED_FIELDS[slug] ?? [];
    const next: FormField[] = [];
    const notes: string[] = [];

    for (const field of fields) {
      if (typeof field.name === 'string' && removed.includes(field.name)) {
        notes.push(`- removed ${field.name}`);
        continue;
      }

      const updated: FormField = { ...field };

      if (isPhoneField(updated) && updated.type !== 'tel') {
        notes.push(`- ${String(updated.name)}: ${String(updated.type)} -> tel`);
        updated.type = 'tel';
      }

      if (updated.type === 'email') {
        const wanted = BUSINESS_EMAIL_FORMS.has(slug);
        if ((updated.requireBusinessEmail ?? false) !== wanted) {
          notes.push(`- ${String(updated.name)}: requireBusinessEmail -> ${wanted}`);
          updated.requireBusinessEmail = wanted;
        }
      }

      next.push(updated);
    }

    for (const addition of ADDED_FIELDS[slug] ?? []) {
      if (next.some((field) => field.name === addition.name)) continue;
      notes.push(`- added ${String(addition.name)} (${String(addition.type)})`);
      next.push({ ...addition });
    }

    if (notes.length === 0) {
      console.log(`${slug}: no change`);
      continue;
    }

    changed += 1;
    console.log(`${slug}:`);
    for (const note of notes) console.log(`  ${note}`);

    if (dryRun) continue;

    await payload.update({
      collection: 'forms',
      id: form.id,
      data: { fields: next },
      overrideAccess: true,
    });
  }

  console.log(
    dryRun
      ? `\nDry run. ${changed} form(s) would change.`
      : `\nUpdated ${changed} form(s).`,
  );
  process.exit(0);
};

void run();
