import type React from "react";

import type { BlogCtaSet } from "@/lib/blog-cta/types";

import { type CtaCardContext, ExploreCard, LearnCard, ProveCard } from "./BlogCtaCards";

/**
 * The rail for pages short enough to read in one screen, where stepping the
 * asks by reading depth would change them straight away. All three cards sit
 * in the column at once, in the same order as the blog's steps.
 */
export function BlogCtaStack({ ctas }: { ctas: BlogCtaSet }): React.ReactElement {
  const context: CtaCardContext = { surface: ctas.surface, slug: ctas.slug, layout: "stacked", placement: "rail" };
  return (
    <div className="flex flex-col gap-4">
      <ExploreCard cta={ctas.explore} context={context} />
      {ctas.learn ? <LearnCard cta={ctas.learn} context={context} /> : null}
      <ProveCard cta={ctas.prove} context={context} />
    </div>
  );
}
