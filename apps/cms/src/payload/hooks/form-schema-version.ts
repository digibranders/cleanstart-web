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
  return JSON.stringify(
    fields.map((field) => ({ name: field?.name ?? null, type: field?.type ?? null })),
  );
};

export const formSchemaVersionHook: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!originalDoc) return data;

  const original = originalDoc as FormDoc;
  const next = data as FormDoc;
  const previousFingerprint = fingerprintFields(original.fields);
  const nextFingerprint = fingerprintFields(next.fields);
  if (previousFingerprint === nextFingerprint) return data;

  const submissionCount = await req.payload.count({
    collection: 'leads',
    where: { form: { equals: (originalDoc as { id: number | string }).id } },
    req,
  });

  if (submissionCount.totalDocs === 0) return data;

  const currentVersion = original.schemaVersion ?? 1;
  return {
    ...data,
    schemaVersion: currentVersion + 1,
  };
};
