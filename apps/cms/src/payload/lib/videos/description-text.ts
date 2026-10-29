// Pure and free of Node imports: used by the sync and by the "use the first paragraph" button in the admin.

// One below the `summary` field's 320 maxLength, so the closing "." still fits.
const SUMMARY_CUT = 319;
const isHashtagLine = (text: string): boolean => text.split(/\s+/).every((t) => t.startsWith('#'));

/** First real paragraph of a description, whitespace collapsed, cut at a word boundary. */
export const firstParagraph = (text: string): string => {
  const paragraph =
    text
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .find((p) => p.length > 0 && !isHashtagLine(p)) ?? '';
  if (paragraph.length <= SUMMARY_CUT) return paragraph;
  const cut = paragraph.slice(0, SUMMARY_CUT);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : SUMMARY_CUT).replace(/[,;:\s]+$/, '')}.`;
};
