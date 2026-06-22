import type { ComposeInput, GraphNode, SchemaGraph } from "../types";
import { validateOverride } from "../validate/override-validator";
import { dedupeById, mergeByType } from "./merge";
import { overrideToNodes } from "./normalize-override";

/**
 * Compose a page's single connected JSON-LD `@graph` from the three
 * layers (INV-5):
 *
 *   1. auto      — live, derived from current doc fields + globals
 *   2. addonNodes — editor add-on nodes, already built by the caller
 *   3. override  — raw paste, validated then merged per-`@type`
 *
 * Runs on every build / ISR / republish, so it must be a pure function
 * of its inputs. An invalid override is dropped (fail-safe to auto +
 * add-ons) — a broken paste never ships broken schema.
 */
export const composeGraph = (input: ComposeInput): SchemaGraph => {
  const base: GraphNode[] = [...input.auto, ...(input.addonNodes ?? [])];

  let nodes = base;
  if (input.override != null) {
    const result = validateOverride(input.override);
    if (result.ok) {
      nodes = mergeByType(base, overrideToNodes(input.override));
    }
  }

  return { "@context": "https://schema.org", "@graph": dedupeById(nodes) };
};
