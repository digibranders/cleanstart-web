#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: restore the download gate on the two resources Webflow gated.
 *
 * Webflow gated by resource type in its page template, not with a CMS field:
 * the ebook and report templates put the PDF link only inside the form's
 * success block, so it appeared after a visitor submitted. Whitepapers,
 * datasheets and architecture insights rendered an open download link. The
 * Webflow CMS export therefore had nothing to read, and the import transform
 * wrote `gated: false, accessLevel: 'public'` for every resource, which is how
 * both gates were lost in the migration.
 *
 * Evidence (Wayback snapshots of the live Webflow pages):
 *   - containing-vulnerabilities-in-your-containers (ebook, 2025-11-09)
 *   - securing-the-software-supply-chain-in-2026   (report, 2026-01-19)
 * On both, every PDF link was either conditionally hidden or inside
 * `w-form-done`; neither exposed an open link. All other 25 archived resource
 * pages did.
 *
 * Sets `gated`, points `gateForm` at the `content-gated` form (resolved by slug,
 * the only form the Resources gate picker allows), and sets `accessLevel` to
 * `lead-gated`, which the field's own help text says gating implies but which no
 * hook derives.
 *
 * Writes via `payload.update` without `draft`, so each resource stays published
 * and its afterChange hooks run (including the web revalidation).
 *
 * Idempotent: a resource already gated behind the right form is skipped.
 *
 * Flags:
 *   --dry-run   Report what would change without writing.
 *
 * In the prod container (env is already in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/gate-webflow-gated-resources.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/gate-webflow-gated-resources.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const GATE_FORM_SLUG = 'content-gated';

const WEBFLOW_GATED_SLUGS = [
  'containing-vulnerabilities-in-your-containers',
  'securing-the-software-supply-chain-in-2026',
] as const;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const idOf = (value: unknown): number | string | null => {
  if (value == null) return null;
  if (typeof value === 'object' && 'id' in value) {
    return (value as { id: number | string }).id;
  }
  return value as number | string;
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  const forms = await payload.find({
    collection: 'forms',
    where: { slug: { equals: GATE_FORM_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const gateForm = forms.docs[0] as { id: number | string; _status?: string } | undefined;
  if (!gateForm) {
    throw new Error(`Gate form "${GATE_FORM_SLUG}" not found; refusing to gate anything.`);
  }
  if (gateForm._status !== 'published') {
    throw new Error(
      `Gate form "${GATE_FORM_SLUG}" is ${String(gateForm._status)}, not published; the modal would not render.`,
    );
  }
  log(`Gate form: ${GATE_FORM_SLUG} (id ${String(gateForm.id)})\n`);

  let gated = 0;
  let skipped = 0;
  let missing = 0;
  let errors = 0;

  for (const slug of WEBFLOW_GATED_SLUGS) {
    const found = await payload.find({
      collection: 'resources',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const doc = found.docs[0] as
      | {
          id: number | string;
          gated?: boolean | null;
          gateForm?: unknown;
          accessLevel?: string | null;
          asset?: unknown;
          _status?: string;
        }
      | undefined;

    if (!doc) {
      missing += 1;
      log(`  MISSING  ${slug}`);
      continue;
    }
    if (idOf(doc.asset) == null) {
      missing += 1;
      log(`  NO FILE  ${slug} (nothing to gate)`);
      continue;
    }

    const alreadyGated =
      doc.gated === true &&
      String(idOf(doc.gateForm)) === String(gateForm.id) &&
      doc.accessLevel === 'lead-gated';
    if (alreadyGated) {
      skipped += 1;
      log(`  skip     ${slug} (already gated)`);
      continue;
    }

    const before = `gated=${String(doc.gated)} gateForm=${String(idOf(doc.gateForm))} accessLevel=${String(doc.accessLevel)}`;
    if (DRY_RUN) {
      gated += 1;
      log(`  would gate ${slug}  [${before}] status=${String(doc._status)}`);
      continue;
    }

    try {
      await payload.update({
        collection: 'resources',
        id: doc.id,
        data: { gated: true, gateForm: gateForm.id, accessLevel: 'lead-gated' } as Record<
          string,
          unknown
        >,
        overrideAccess: true,
      });
      gated += 1;
      log(`  gated    ${slug}  [was ${before}]`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! resources ${slug}: ${message}`);
    }
  }

  log(`\nDone. gated=${gated} skipped=${skipped} missing=${missing} errors=${errors}`);
  if (errors > 0) process.exitCode = 1;
};

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err);
    process.exit(1);
  });
