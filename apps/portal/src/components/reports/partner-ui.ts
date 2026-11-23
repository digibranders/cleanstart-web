import type { PartnerCategory } from '@/lib/domain';

export const CATEGORY_BADGE: Record<PartnerCategory, string> = {
  distributor: 'b-violet',
  channel: 'b-blue',
};

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const avatarClass = (index: number): string => `av-${(index % 4) + 1}`;
