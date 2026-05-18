import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Auto-increments `forms.schemaVersion` whenever the `fields[]` array changes
 * shape after the form has captured at least one submission. Subsequent
 * leads then store this version, so renaming a field tomorrow doesn't
 * silently break the meaning of yesterday's leads.fields JSON keys.
 *
 * No-op when:
 * - this is the form's first save (no `originalDoc`)
 * - the form has zero submissions yet (no risk of breaking lead-key meaning)
 * - `fields[]` is structurally unchanged
 */
type FormFieldShape = {
  name?: string | null;
  type?: string | null;
};

type FormDoc = {
  fields?: FormFieldShape[] | null;
  schemaVersion?: number | null;
};

const fingerprintFields = (fields: FormFieldShape[] | null | undefined): string => {
  if (!fields) return '[]';
  // Sort by name so a pure visual reorder of fields doesn't bump the
  // schema version. Field identity is the (name, type) tuple — two
  // forms with identical {name,type} sets but different display order
  // capture leads with the same key shape, so the dedup window stays
  // intact across editor reorderings.
  const stable = fields
    .map((field) => ({ name: field?.name ?? null, type: field?.type ?? null }))
    .sort((a, b) => {
      const an = a.name ?? '';
      const bn = b.name ?? '';
      return an.localeCompare(bn);
    });
  return JSON.stringify(stable);
};

const isValidFormId = (raw: unknown): raw is number | string => {
  if (typeof raw === 'number') return Number.isFinite(raw);
  if (typeof raw === 'string') return raw.length > 0;
  return false;
};

export const formSchemaVersionHook: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // The schema-version bump only makes sense for an existing form
  // with a real id. Skip on create — and on the admin-UI's "publish
  // a brand-new draft" path where Payload's stack hands the hook a
  // partial `originalDoc` whose `id` is missing/`NaN`, which would
  // otherwise blow up the lead count query with
  // `invalid input syntax for type integer: "NaN"`.
  if (operation === 'create') return data;
  if (!originalDoc) return data;
  const originalId = (originalDoc as { id?: unknown }).id;
  if (!isValidFormId(originalId)) return data;

  const original = originalDoc as FormDoc;
  const next = data as FormDoc;
  const previousFingerprint = fingerprintFields(original.fields);
  const nextFingerprint = fingerprintFields(next.fields);
  if (previousFingerprint === nextFingerprint) return data;

  const submissionCount = await req.payload.count({
    collection: 'leads',
    where: { form: { equals: originalId } },
    req,
  });

  if (submissionCount.totalDocs === 0) return data;

  const currentVersion = original.schemaVersion ?? 1;
  return {
    ...data,
    schemaVersion: currentVersion + 1,
  };
};
