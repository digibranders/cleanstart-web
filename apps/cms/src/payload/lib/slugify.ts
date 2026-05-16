// Re-export from `@cleanstart/ui` so both the admin field components and
// the data layer share one slugify implementation. The function is
// pure (no Payload or React coupling) and is used by quick-create
// dialogs in the UI package — duplicating it here would invite drift.
export { slugify } from '@cleanstart/ui';
