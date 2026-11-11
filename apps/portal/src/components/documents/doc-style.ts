import type { IconName } from '@/components/icon-paths';
import type { DocType } from '@/data/documents';

export const TYPE_ICON: Record<DocType, IconName> = {
  Video: 'play',
  Battlecard: 'file',
  'Price list': 'file',
  Datasheet: 'file',
  'Solution sheet': 'file',
  'Enablement guide': 'docs',
};

export const TYPE_TONE: Record<DocType, string> = {
  Video: 'tone-violet',
  Battlecard: 'tone-red',
  'Price list': 'tone-red',
  Datasheet: 'tone-blue',
  'Solution sheet': 'tone-blue',
  'Enablement guide': 'tone-green',
};
