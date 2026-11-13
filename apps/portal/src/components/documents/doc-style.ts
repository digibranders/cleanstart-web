import type { IconName } from '@/components/icon-paths';
import type { Product as ChipProduct } from '@/components/ui/badge';
import type { DocProduct, DocumentType } from '@/lib/domain';

export const TYPE_ICON: Record<DocumentType, IconName> = {
  video: 'play',
  battlecard: 'file',
  price_list: 'file',
  datasheet: 'file',
  solution_sheet: 'file',
  enablement_guide: 'docs',
};

export const TYPE_TONE: Record<DocumentType, string> = {
  video: 'tone-violet',
  battlecard: 'tone-red',
  price_list: 'tone-red',
  datasheet: 'tone-blue',
  solution_sheet: 'tone-blue',
  enablement_guide: 'tone-green',
};

/** ProductChip takes the display label as its Product type. These are exactly the labels in DOC_PRODUCT_LABEL. */
export const CHIP_PRODUCT: Record<DocProduct, ChipProduct> = {
  images: 'CleanStart Images',
  libraries: 'Clean Libraries',
  cleansight: 'CleanSight',
  all: 'All products',
};
