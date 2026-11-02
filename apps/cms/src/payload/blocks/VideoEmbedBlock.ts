import type { Block } from 'payload';

/**
 * A video from the Videos library, placed inside a body rich-text field.
 *
 * The block stores only the library id: the web resolves title, length and
 * poster at render time (`resolveLexicalVideos`), so a rename or a video going
 * private takes effect without editing the article. A video that is deleted or
 * unpublished renders nothing. Registered via `BlocksFeature` in
 * `editor-config.ts`, inserted from the slash and Add menus.
 */
export const VideoEmbedBlock: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    {
      name: 'video',
      type: 'relationship',
      relationTo: 'videos',
      required: true,
      filterOptions: { _status: { equals: 'published' } },
      admin: { description: 'Pick a published video from the Videos library.' },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Shown under the video. Leave empty to use the video title.' },
    },
  ],
};
