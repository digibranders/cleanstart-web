import type { PartnerCategory } from '@/lib/domain';

/** The audience a person chose, in the shape the actions and the repo take it. */
export type AudienceInput =
  | { kind: 'all' }
  | { kind: 'categories'; categories: PartnerCategory[] }
  | { kind: 'named'; partnerIds: string[] };

/** One option in the named partner picker. */
export interface AudiencePartnerDto {
  id: string;
  name: string;
}

/** What createUploadTicketAction returns: where and how the browser uploads. `headers` must be sent exactly. */
export interface UploadTicketDto {
  key: string;
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
  originalName: string;
  size: number;
}

/** What the confirm actions take: the key from the ticket and the file facts. */
export interface UploadedFileRef {
  key: string;
  size: number;
  originalName: string;
}
