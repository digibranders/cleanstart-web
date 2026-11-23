import type { BadgeTone } from '@/components/ui/badge';
import type { MaterialRequestStatus } from '@/lib/domain';

export const requestTone = (status: MaterialRequestStatus): BadgeTone =>
  status === 'open' ? 'pending' : status === 'in_progress' ? 'blue' : status === 'done' ? 'accepted' : 'rejected';

/** A request nobody has finished. */
export const isActiveRequest = (status: MaterialRequestStatus): boolean => status === 'open' || status === 'in_progress';
