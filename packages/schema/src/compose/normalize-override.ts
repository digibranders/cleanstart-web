import type { GraphNode } from "../types";
import { overrideSchema } from "../validate/override-validator";

/**
 * Turn a (already-validated) raw override into graph nodes. The per-blob
 * `@context` is stripped — the composed `@graph` carries a single
 * top-level `@context`. Returns `[]` if the input does not parse, so the
 * composer fails safe to auto + add-ons.
 */
export const overrideToNodes = (input: unknown): GraphNode[] => {
  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) return [];
  const blobs = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  return blobs.map((blob) => {
    const { "@context": _context, ...rest } = blob as Record<string, unknown>;
    return rest as GraphNode;
  });
};
