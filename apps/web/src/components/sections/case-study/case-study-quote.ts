/** A customer quote as the detail page renders it. */
export interface CaseStudyQuote {
  readonly text: string;
  readonly author?: string | undefined;
  readonly role?: string | undefined;
}

/**
 * The approved quote for a study, from the collection's `quote` fields.
 *
 * Returns undefined when the field is empty, which is a real state and not an
 * error: the hero and the quote band both check for it and reshape. Editors
 * fill it per study — it is not derived from the homepage testimonial list,
 * because that list is a marketing rotation and a case study's quote is part
 * of what the customer signed off with the document.
 */
export function caseStudyQuote(study: {
  quote?: string | null;
  quoteAuthor?: string | null;
  quoteRole?: string | null;
}): CaseStudyQuote | undefined {
  const text = study.quote?.trim();
  if (!text) return undefined;
  return {
    text,
    author: study.quoteAuthor?.trim() || undefined,
    role: study.quoteRole?.trim() || undefined,
  };
}
