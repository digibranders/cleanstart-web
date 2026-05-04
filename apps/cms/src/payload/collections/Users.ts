import type { CollectionConfig } from 'payload';

import { ROLES } from '@cleanstart/types';

import { isAdmin, isAdminFieldLevel, isAdminOrSelf } from '../access';

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
      const roles = (user as { roles?: string[] } | null | undefined)?.roles;
      return Boolean(roles?.includes('admin') || roles?.includes('editor') || roles?.includes('author'));
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
  ],
  timestamps: true,
};
