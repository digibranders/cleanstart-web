/** Elements a keyboard user can land on. Shared by the overlay focus trap and the scroll regions. */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Where Tab or Shift+Tab should land so focus never leaves a modal. Returns the element to focus, or null when the
 * browser's own move stays inside the modal. An active element that is not in the list (the dialog itself, a
 * programmatically focusable node, something outside) counts as outside and is pulled back to an end of the list.
 */
export function trapTarget<T>(items: readonly T[], active: T | null, shiftKey: boolean): T | null {
  const first = items[0];
  const last = items[items.length - 1];
  if (first === undefined || last === undefined) return null;
  const at = active === null ? -1 : items.indexOf(active);
  if (shiftKey) return at <= 0 ? last : null;
  return at === -1 || at === items.length - 1 ? first : null;
}

/** Elements that stay live while a modal is open: the dimmed click-away layers, the toast, and page furniture that is not content. */
const INERT_EXEMPT_TAGS = new Set(["script", "style", "next-route-announcer", "nextjs-portal"]);
const INERT_EXEMPT_CLASSES = new Set(["cs-scrim", "dd-scrim", "toast"]);

/** Whether a sibling of the modal's ancestors must be left alone when the background goes inert. Matches the element itself, never its descendants. */
export function isInertExempt(el: { tag: string; classes: readonly string[]; inert: boolean }): boolean {
  return el.inert || INERT_EXEMPT_TAGS.has(el.tag.toLowerCase()) || el.classes.some((c) => INERT_EXEMPT_CLASSES.has(c));
}

/** Where focus goes when a modal closes: the control that opened it, or the fallback when that control has left the page. */
export function focusReturnTarget<T extends { isConnected: boolean }>(opener: T | null, fallback: T | null): T | null {
  return opener?.isConnected ? opener : fallback;
}
