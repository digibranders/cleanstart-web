import type { WebhookEvent, WebhookEventName } from '../webhooks/dispatch';

/**
 * Per-row routing predicate. Three independent filters, all optional:
 *
 *   events       — required subscription list (empty = subscribe to none)
 *   collections  — limit `document.published` to specific collection slugs
 *   formSlugs    — limit `lead.submitted` to specific form slugs
 *
 * Empty arrays mean "no filter" *only* for `collections` and `formSlugs`.
 * `events` is the required subscription — an integration with `events: []`
 * receives nothing.
 */
export interface IntegrationRouting {
  readonly events: readonly WebhookEventName[];
  readonly collections?: readonly string[];
  readonly formSlugs?: readonly string[];
}

const isNonEmpty = (arr: readonly string[] | undefined): arr is readonly string[] =>
  Array.isArray(arr) && arr.length > 0;

const stringField = (data: Record<string, unknown>, key: string): string | null => {
  const v = data[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
};

/**
 * Returns `true` when the routing predicate accepts the event. Used by
 * the dispatch layer to decide whether each DB-backed integration row
 * gets a delivery for a given event.
 *
 * Per-event semantics:
 *   - `document.published`: matches when the event's `data.collection`
 *     is in `routing.collections` (or `routing.collections` is empty).
 *   - `lead.submitted`: matches when `data.formSlug` is in `routing.formSlugs`
 *     (or `routing.formSlugs` is empty). `data.formId` is *not* used —
 *     editor-facing identifiers are slug-based.
 */
export const routingMatches = (
  routing: IntegrationRouting,
  event: WebhookEvent,
): boolean => {
  if (!routing.events.includes(event.event)) return false;

  if (event.event === 'document.published' && isNonEmpty(routing.collections)) {
    const collection = stringField(event.data, 'collection');
    if (!collection || !routing.collections.includes(collection)) return false;
  }

  if (event.event === 'lead.submitted' && isNonEmpty(routing.formSlugs)) {
    const slug = stringField(event.data, 'formSlug');
    if (!slug || !routing.formSlugs.includes(slug)) return false;
  }

  return true;
};
