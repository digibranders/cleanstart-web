import type { CollectionConfig } from 'payload';

type DocStatusBarMountArgs = {
  /** Render the publishedAt timestamp. Default true. */
  showPublishedAt?: boolean;
  /** Render the wordCount + readingMinutes pair. Default false. */
  showStats?: boolean;
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
  const { showPublishedAt = true, showStats = false } = args;
  return {
    beforeDocumentControls: [
      {
        path: '@/payload/admin/components/DocHeader.tsx#DocHeader',
        clientProps: { showPublishedAt, showStats },
      },
    ],
    editMenuItems: [
      {
        path: '@/payload/admin/components/ScheduleKebabItem.tsx#ScheduleKebabItem',
      },
      {
        path: '@/payload/admin/components/DocKebabExtras.tsx#DocKebabExtras',
      },
    ],
  };
};
