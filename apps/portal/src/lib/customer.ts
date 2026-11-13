/** Same rule as the registrations_open_unique index: trimmed and case insensitive. */
export const sameCustomer = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** "https://www.Vardhancapital.in/about" becomes "vardhancapital.in". Null when no usable domain is left. */
export const normalizeDomain = (input: string | null | undefined): string | null => {
  if (!input) return null;
  let value = input.trim().toLowerCase();
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.split(/[/?#]/)[0] ?? '';
  value = value.replace(/^www\./, '').replace(/:\d+$/, '').replace(/\.$/, '');
  return DOMAIN.test(value) ? value : null;
};
