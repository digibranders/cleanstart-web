/**
 * CleanStart fix status of an advisory. Dependency-free so the client-side
 * admin list filters can import it alongside the collection config.
 */
export const ADVISORY_STATUS_OPTIONS = [
  { label: 'Identified', value: 'identified' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Fixed', value: 'fixed' },
  { label: 'Not affected', value: 'not_affected' },
] as const;
