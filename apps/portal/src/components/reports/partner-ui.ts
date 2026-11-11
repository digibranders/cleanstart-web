import type { PartnerCategory } from '@/data/reports';

export const CATEGORY_BADGE: Record<PartnerCategory, string> = {
  Distributor: 'b-violet',
  'Channel partner': 'b-blue',
  'System integrator': 'b-cyan',
};

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const avatarClass = (index: number): string => `av-${(index % 4) + 1}`;
