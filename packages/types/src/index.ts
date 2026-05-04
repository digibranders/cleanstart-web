// Re-exports the Payload-generated types from apps/cms.
// This package becomes the canonical type surface once Phase B lands real collections.
// Until then it exposes the role enum and a minimal placeholder so consumers compile.

export const ROLES = ['admin', 'editor', 'author'] as const;
export type Role = (typeof ROLES)[number];
