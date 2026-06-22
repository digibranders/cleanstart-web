/**
 * Shim re-exporting the shared JSON-LD composer from @cleanstart/schema/compose
 * (composeGraph, mergeByType, primaryType, …) so cms admin components import it
 * via a stable local path — mirrors override-validator.ts.
 */
export * from '@cleanstart/schema/compose';
export type { GraphNode, SchemaGraph } from '@cleanstart/schema';
