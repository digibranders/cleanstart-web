/**
 * Back-compat shim. The JSON-LD builders + the JsonLd component now live
 * in `@cleanstart/schema` so apps/web and apps/cms share one
 * implementation (Schema Manager plan, Phase 0 Task 0.2). 40 page files
 * import from here; keep this re-export until they migrate to the
 * single-@graph compose path (Task 0.5).
 */
export * from "@cleanstart/schema/builders";
