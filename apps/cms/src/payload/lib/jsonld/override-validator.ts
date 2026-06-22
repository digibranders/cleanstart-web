/**
 * Back-compat shim. The override validator now lives in
 * `@cleanstart/schema/validate` so apps/cms and apps/web share one
 * implementation (Schema Manager plan, Phase 0 Task 0.3). Five CMS
 * modules import from here; keep this re-export until they are migrated
 * to import the package directly.
 */
export * from '@cleanstart/schema/validate';
