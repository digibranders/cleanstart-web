/**
 * Map the parent document's collection slug onto the Media folder
 * that inline-image uploads should land in. Mirrors the `folderHint`
 * used by `mediaUploadField` for each collection's hero image, so
 * inline images land beside their hero counterparts.
 */
export const inlineImageFolderForCollection = (slug: string | null | undefined): string => {
  switch (slug) {
    case 'blogs':
      return 'web/blog';
    case 'guides':
      return 'web/guide';
    case 'knowledgeBase':
      return 'web/general';
    case 'authors':
      return 'web/author';
    default:
      return 'web/general';
  }
};
