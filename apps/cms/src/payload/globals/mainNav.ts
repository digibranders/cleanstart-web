import type { GlobalConfig } from 'payload';

import { isAdminOrEditor, isAuthenticated } from '../access';
import { mediaUploadField } from '../fields/media-upload';

import { navItemFields } from './_navItem';

const MAX_MEGA_MENU_COLUMNS = 4;
const MAX_MEGA_MENU_ROWS_PER_COLUMN = 8;

export const MainNav: GlobalConfig = {
  slug: 'mainNav',
  label: 'Main navigation',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Item', plural: 'Items' },
      admin: {
        description: 'Top-level navigation items. Drag to reorder.',
      },
      fields: [
        ...navItemFields,
        {
          name: 'isMegaMenu',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Convert this top-level item into a mega-menu with up to 4 columns. Available only at the top level — mega-menus do not nest.',
            condition: (_data, sibling) => sibling?.kind === 'internal-doc',
          },
        },
        {
          name: 'megaMenu',
          type: 'group',
          admin: {
            condition: (_data, sibling) => sibling?.isMegaMenu === true,
          },
          fields: [
            {
              name: 'columns',
              type: 'array',
              maxRows: MAX_MEGA_MENU_COLUMNS,
              labels: { singular: 'Column', plural: 'Columns' },
              fields: [
                { name: 'heading', type: 'text', required: true },
                {
                  name: 'items',
                  type: 'array',
                  maxRows: MAX_MEGA_MENU_ROWS_PER_COLUMN,
                  labels: { singular: 'Link', plural: 'Links' },
                  fields: navItemFields,
                },
              ],
            },
            {
              name: 'mobileGroupHint',
              type: 'text',
              admin: {
                description:
                  'Heading shown above the collapsed group on mobile. Defaults to the parent item label when blank.',
              },
            },
            {
              name: 'featuredCard',
              type: 'group',
              label: 'Featured card (optional)',
              fields: [
                {
                  name: 'kind',
                  type: 'select',
                  // Match the nav-item kind values verbatim so renderers
                  // can branch with one set of strings rather than two.
                  options: [
                    { label: 'Internal doc', value: 'internal-doc' },
                    { label: 'External URL', value: 'external-url' },
                  ],
                },
                {
                  name: 'target',
                  type: 'relationship',
                  relationTo: 'pages',
                  admin: { condition: (_data, sibling) => sibling?.kind === 'internal-doc' },
                },
                {
                  name: 'href',
                  type: 'text',
                  admin: { condition: (_data, sibling) => sibling?.kind === 'external-url' },
                },
                { name: 'eyebrow', type: 'text' },
                { name: 'title', type: 'text' },
                { name: 'description', type: 'textarea' },
                mediaUploadField({ name: 'image', folderHint: 'web/general' }),
              ],
            },
          ],
        },
      ],
    },
  ],
};
