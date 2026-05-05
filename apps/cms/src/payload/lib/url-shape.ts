const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const PATH_PATTERN = /^\/[^\s]*$/;
const MAILTO_PATTERN = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const TEL_PATTERN = /^tel:\+?[0-9 ()-]+$/i;

export type UrlShape = 'url' | 'path' | 'mailto' | 'tel' | 'invalid';

export const classifyUrlShape = (raw: string | null | undefined): UrlShape => {
  if (typeof raw !== 'string') return 'invalid';
  const value = raw.trim();
  if (value.length === 0) return 'invalid';
  if (URL_PATTERN.test(value)) return 'url';
  if (MAILTO_PATTERN.test(value)) return 'mailto';
  if (TEL_PATTERN.test(value)) return 'tel';
  if (PATH_PATTERN.test(value)) return 'path';
  return 'invalid';
};

export const isValidExternalLink = (raw: string | null | undefined): boolean => {
  const shape = classifyUrlShape(raw);
  return shape !== 'invalid';
};
