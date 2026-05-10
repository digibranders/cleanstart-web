import type { CollectionConfig } from 'payload';

import { ROLES } from '@cleanstart/types';

import { isAdmin, isAdminFieldLevel, isAdminOrSelf, userRoles } from '../access';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'updatedAt'],
    group: 'System',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    useAPIKey: false,
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
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
