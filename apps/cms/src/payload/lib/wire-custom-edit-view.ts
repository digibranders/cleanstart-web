import type { CollectionConfig, GlobalConfig } from 'payload';

/**
 * Custom edit-view stamp — currently a no-op pass-through.
 *
 * The previous implementation pointed `views.edit.default` at
 * `CmsEditView`, but replacing Payload's `DefaultEditView` strips the
 * `<Form>` provider that supplies `getData` / `getFields` /
 * `dispatchFields` / `addFieldRow` to every `useField` call below us
 * (including the custom Field components stamped by
 * `wireCustomFields`). Rebuilding that orchestration — `<Form>` with
 * the right `initialState`, autosave plumbing, document-lock modals,
 * `<OperationProvider>` — is a deferred wave on its own.
 *
 * Until that wave lands, fall back to Payload's stock edit chrome
 * while keeping every per-field custom component (TextField,
 * TextareaField, ArrayField, BlocksField, RelationshipField, etc.).
 * The list view's custom chrome (`wireCustomListView`) is unaffected.
 */
export const wireCustomEditView = <T extends CollectionConfig | GlobalConfig>(
  entity: T,
): T => entity;
