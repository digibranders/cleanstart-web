import type {
  CollectionConfig,
  Field,
  GlobalConfig,
} from 'payload';

/**
 * Map of field types → custom Field component path.
 *
 * Payload v3 has no top-level "default field component override" hook,
 * so we walk every collection / global / block field tree at boot time
 * and stamp `admin.components.Field` onto each matching field. Existing
 * per-field overrides (e.g. SlugField, SeoTitleField) win — we only
 * inject when the slot is empty. Existing `Cell` overrides on the same
 * field are preserved.
 *
 * Keep this list in lockstep with what's actually implemented under
 * `admin/components/fields/`. Adding a new adapter here flips it on
 * across every collection in one edit.
 */
const FIELD_OVERRIDES: Partial<Record<Field['type'], string>> = {
  relationship:
    '@/payload/admin/components/fields/RelationshipField.tsx#RelationshipField',
  upload: '@/payload/admin/components/fields/UploadField.tsx#UploadField',
  text: '@/payload/admin/components/fields/TextField.tsx#TextField',
  textarea: '@/payload/admin/components/fields/TextareaField.tsx#TextareaField',
  number: '@/payload/admin/components/fields/NumberField.tsx#NumberField',
  // Date intentionally left to Payload's stock DateTime field — the
  // bundled calendar / time picker is a better default than our
  // earlier custom DateField (parked in the codebase for future use).
  email: '@/payload/admin/components/fields/EmailField.tsx#EmailField',
  point: '@/payload/admin/components/fields/PointField.tsx#PointField',
  json: '@/payload/admin/components/fields/JsonField.tsx#JsonField',
  select: '@/payload/admin/components/fields/SelectField.tsx#SelectField',
  checkbox: '@/payload/admin/components/fields/CheckboxField.tsx#CheckboxField',
  radio: '@/payload/admin/components/fields/RadioField.tsx#RadioField',
  // Wave 2 part 2 — structural fields. All wrap a labelled chrome
  // around Payload's `RenderFields` so children stamped above keep
  // resolving to our custom Field components.
  group: '@/payload/admin/components/fields/GroupField.tsx#GroupField',
  collapsible:
    '@/payload/admin/components/fields/CollapsibleField.tsx#CollapsibleField',
  tabs: '@/payload/admin/components/fields/TabsField.tsx#TabsField',
  row: '@/payload/admin/components/fields/RowField.tsx#RowField',
  array: '@/payload/admin/components/fields/ArrayField.tsx#ArrayField',
  blocks: '@/payload/admin/components/fields/BlocksField.tsx#BlocksField',
  join: '@/payload/admin/components/fields/JoinField.tsx#JoinField',
  code: '@/payload/admin/components/fields/CodeField.tsx#CodeField',
};

/**
 * Map of field types → custom list-view Cell component path.
 *
 * Mirrors `FIELD_OVERRIDES` but for the list table's cell renderer.
 * Stamping `relationship` centrally gives every collection a resolved
 * relationship title (instead of an opaque id) plus the stable
 * `.cs-relationship-cell` class the table CSS keys column widths off.
 * Per-field `Cell` overrides win (e.g. a collection that passes a
 * polymorphic `collectionSlug` explicitly).
 *
 * Date columns are deliberately NOT stamped here: they're reformatted
 * client-side by `ListCellEnhancer` (relative "3d ago" / compact
 * "12 Aug 2025"), which rewrites the cell's text node directly. A
 * component-rendered DateCell would be clobbered by that enhancer's
 * `textContent` rewrite, so the two must not both own date cells.
 *
 * NOTE: any path added here must resolve in the generated import map —
 * run `pnpm --filter @cleanstart/cms generate:importmap` and commit the
 * result, or the production bundle can't load the component.
 */
const CELL_OVERRIDES: Partial<Record<Field['type'], string>> = {
  relationship:
    '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
};

const hasOwnFieldOverride = (field: Field): boolean => {
  const admin = (field as { admin?: { components?: { Field?: unknown } } }).admin;
  return Boolean(admin?.components?.Field);
};

const hasOwnCellOverride = (field: Field): boolean => {
  const admin = (field as { admin?: { components?: { Cell?: unknown } } }).admin;
  return Boolean(admin?.components?.Cell);
};

/**
 * Client props for a stamped Cell. Single-collection relationships need
 * the target slug so `RelationshipCell` can resolve the row's title;
 * polymorphic relationships (relationTo is an array) carry `relationTo`
 * inside each value and are inferred at render time, so we pass nothing.
 */
const cellClientProps = (
  field: Field,
): Record<string, unknown> | undefined => {
  if (field.type === 'relationship') {
    const relationTo = (field as { relationTo?: string | string[] }).relationTo;
    if (typeof relationTo === 'string') return { collectionSlug: relationTo };
  }
  return undefined;
};

const stampField = (field: Field, componentPath: string): Field => {
  if (hasOwnFieldOverride(field)) return field;
  const current = field as Field & {
    admin?: { components?: Record<string, unknown> };
  };
  const admin = current.admin ?? {};
  const components = admin.components ?? {};
  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...components,
        Field: componentPath,
      },
    },
  } as Field;
};

const stampCell = (field: Field, componentPath: string): Field => {
  if (hasOwnCellOverride(field)) return field;
  const current = field as Field & {
    admin?: { components?: Record<string, unknown> };
  };
  const admin = current.admin ?? {};
  const components = admin.components ?? {};
  const clientProps = cellClientProps(field);
  const cell = clientProps
    ? { path: componentPath, clientProps }
    : componentPath;
  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...components,
        Cell: cell,
      },
    },
  } as Field;
};

const walkFields = (fields: Field[]): Field[] =>
  fields.map((field) => {
    let next: Field = field;
    const override = FIELD_OVERRIDES[field.type];
    if (override) next = stampField(next, override);

    const cellOverride = CELL_OVERRIDES[field.type];
    if (cellOverride) next = stampCell(next, cellOverride);

    // Recurse into containers that hold sub-fields.
    if (next.type === 'group' || next.type === 'array' || next.type === 'collapsible') {
      const container = next as typeof next & { fields: Field[] };
      next = { ...next, fields: walkFields(container.fields) } as Field;
    } else if (next.type === 'row') {
      const row = next as typeof next & { fields: Field[] };
      next = { ...next, fields: walkFields(row.fields) } as Field;
    } else if (next.type === 'tabs') {
      const tabs = next as typeof next & {
        tabs: Array<{ fields: Field[] } & Record<string, unknown>>;
      };
      next = {
        ...next,
        tabs: tabs.tabs.map((tab) => ({ ...tab, fields: walkFields(tab.fields) })),
      } as Field;
    } else if (next.type === 'blocks') {
      // Wave 2 part 2: our custom BlocksField composes block sub-fields
      // through RenderFields (no longer the lazy stock RSC pipeline),
      // so it's safe — and necessary — to stamp custom Field overrides
      // recursively into each block's sub-fields.
      const blocks = next as typeof next & {
        blocks: Array<{ fields: Field[] } & Record<string, unknown>>;
      };
      next = {
        ...next,
        blocks: blocks.blocks.map((b) => ({ ...b, fields: walkFields(b.fields) })),
      } as Field;
    }

    return next;
  });

export const wireCustomFields = <T extends CollectionConfig | GlobalConfig>(entity: T): T => {
  return { ...entity, fields: walkFields(entity.fields) };
};
