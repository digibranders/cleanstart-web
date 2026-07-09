import type { CollectionConfig } from 'payload';

type DocStatusBarMountArgs = {
  /** Render the publishedAt timestamp. Default true. */
  showPublishedAt?: boolean;
  /** Render the wordCount + readingMinutes pair. Default false. */
  showStats?: boolean;
  /**
   * Mount the "Purge this page" button in the controls strip, next to
   * Save / Publish, instead of the edit sidebar. Set on the purgeable
   * content collections (see PURGEABLE_COLLECTIONS in lib/web-pages.ts).
   * Default false.
   */
  showPurge?: boolean;
};

type EditConfig = NonNullable<
  NonNullable<NonNullable<CollectionConfig['admin']>['components']>['edit']
>;

/**
 * Returns the `admin.components.edit` slot wiring needed to render
 * DocHeader (status badge · title · meta inline) into the document
 * edit-view's controls strip, replacing Payload's default title row
 * + status meta. Native Save / Publish / kebab actions are untouched.
 *
 * Spread into a collection's `admin.components.edit` field. Each
 * collection passes its own `showStats` / `showPublishedAt` flags so
 * the header adapts to whether the collection runs `bodyStatsHook`
 * and the draft → published versioning flow.
 */
export const docStatusBarEditConfig = (args: DocStatusBarMountArgs = {}): EditConfig => {
  const { showPublishedAt = true, showStats = false, showPurge = false } = args;
  const beforeDocumentControls: NonNullable<EditConfig['beforeDocumentControls']> = [
    {
      path: '@/payload/admin/components/DocHeader.tsx#DocHeader',
      clientProps: { showPublishedAt, showStats },
    },
  ];
  // Rendered after DocHeader (which is flex:1 and fills the strip), so the
  // purge button is pushed to the right edge, sitting just before the
  // native Save Draft / Publish cluster.
  if (showPurge) {
    beforeDocumentControls.push({
      path: '@/payload/admin/components/cache/PurgePageButton.tsx#PurgePageButton',
    });
  }
  return {
    beforeDocumentControls,
    editMenuItems: [
      {
        path: '@/payload/admin/components/DocKebabExtras.tsx#DocKebabExtras',
      },
    ],
    // Replace Payload's stock PublishButton (whose built-in submenu opens
    // the default ScheduleDrawer) with our minimal submit-only button.
    // The schedule entry point lives in PublishMenu and routes to
    // SchedulePublishDialog. Payload silently ignores this override on
    // collections without drafts enabled, so it's safe to apply globally.
    PublishButton: '@/payload/admin/components/CmsPublishButton.tsx#CmsPublishButton',
  };
};
