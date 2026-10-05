import type { BlogCtaSet } from "./types";

/**
 * What the page would show for a post with no editor picks, in the terms the
 * CMS editor needs: names, not cards. The CMS shows it under the two override
 * fields so a blank field no longer looks like nothing is configured.
 */
export interface BlogCtaSuggestion {
  resource: { title: string; typeLabel: string; slug: string } | null;
  image: { name: string } | null;
}

export function toSuggestion(ctas: BlogCtaSet): BlogCtaSuggestion {
  return {
    resource: ctas.learn
      ? { title: ctas.learn.title, typeLabel: ctas.learn.typeLabel, slug: ctas.learn.slug }
      : null,
    image: ctas.explore.kind === "image" ? { name: ctas.explore.name } : null,
  };
}
