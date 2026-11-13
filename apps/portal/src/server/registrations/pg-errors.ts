interface PgErrorShape {
  code?: string;
  constraint?: string;
  cause?: unknown;
}

const read = (value: unknown): PgErrorShape | null => (typeof value === 'object' && value !== null ? (value as PgErrorShape) : null);

/** Drizzle wraps the driver error as `cause`; older versions throw it as is. Both are read. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  let current = read(error);
  for (let depth = 0; current && depth < 3; depth += 1) {
    if (current.code === '23505' && (constraint === undefined || current.constraint === constraint)) return true;
    current = read(current.cause);
  }
  return false;
}
