/**
 * Webflow lifecycle-flag → Payload status mapping.
 *
 * The logic + tests live in the CMS lib (`apps/cms/src/payload/lib/webflow-import/status.ts`)
 * so it runs under the cms vitest suite; this module is the import-side re-export.
 */
export {
  webflowHiringStatus,
  webflowStatus,
} from '../../../apps/cms/src/payload/lib/webflow-import/status';
