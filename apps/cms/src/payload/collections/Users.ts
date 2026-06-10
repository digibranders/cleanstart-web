import type { CollectionConfig } from 'payload';
import { ValidationError } from 'payload';

import { ROLES } from '@cleanstart/types';

import { isAdmin, isAdminFieldLevel, isAdminOrSelf, userRoles } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'enabled', 'updatedAt'],
    group: 'System',
    components: {
      edit: {
        ...docStatusBarEditConfig({ showPublishedAt: false, showStats: false }),
        editMenuItems: [
          ...(docStatusBarEditConfig().editMenuItems ?? []),
          { path: '@/payload/admin/components/DisableUserAction.tsx#DisableUserAction' },
          { path: '@/payload/admin/components/ReassignContentAction.tsx#ReassignContentAction' },
        ],
      },
    },
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    // Enables per-user API keys. The web app's draft-preview fetch authenticates
    // as a dedicated read-only `preview-bot` user (Authorization: `users API-Key
    // <CMS_API_KEY>`), which is what lets `publishedOrAuthenticated` (see
    // access/index.ts) return drafts to preview while anonymous reads stay
    // scoped to published. The preview-bot holds NO write roles, so create/
    // update/delete (isAdminOrEditor) remain denied — least privilege.
    useAPIKey: true,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => {
      const roles = userRoles(user);
      return roles.includes('admin') || roles.includes('editor') || roles.includes('author');
    },
  },
  hooks: {
    // Block disabled users at the login stage — throws before a JWT is issued.
    beforeLogin: [
      async ({ user }) => {
        if ((user as { enabled?: boolean }).enabled === false) {
          throw new ValidationError({
            errors: [{ message: 'This account has been disabled. Contact an administrator.', path: 'email' }],
          });
        }
        return user;
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      access: {
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'Uncheck to block this user from logging in. Use the "Disable account" action instead of editing this directly.',
        position: 'sidebar',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['author'],
      options: ROLES.map((role) => ({ label: role, value: role })),
      access: {
        update: isAdminFieldLevel,
      },
      admin: {
        description: 'Composite roles supported. Author = own drafts only. Editor = publish content. Admin = full access.',
      },
    },
    // ---------------------------------------------------------------
    // Per-editor admin-UI preferences. Backs the Wave 3 "saved views"
    // surface (column visibility, where filters, sort, page size per
    // collection) and any future personalised state. Hidden from the
    // admin UI — managed via @/payload/admin/lib/saved-views.ts.
    //
    // Shape (loose by design — additive over time):
    //   {
    //     savedViews?: {
    //       [collectionSlug: string]: {
    //         active?: string;
    //         views?: Array<{
    //           id: string;
    //           name: string;
    //           columns?: string[];
    //           where?: Where;
    //           sort?: string;
    //           limit?: number;
    //         }>;
    //       };
    //     };
    //     // List-table column widths per collection (px), managed via
    //     // @/payload/admin/lib/column-widths.ts.
    //     columnWidths?: {
    //       [collectionSlug: string]: { [accessor: string]: number };
    //     };
    //   }
    // ---------------------------------------------------------------
    {
      name: 'preferences',
      type: 'json',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
};
